from rest_framework import serializers

from .models import Post


class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    author_avatar = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "author_avatar",
            "campus",
            "post_type",
            "title",
            "content",
            "feeling",
            "image",
            "image_url",
            "likes_count",
            "is_liked",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "author",
            "author_avatar",
            "campus",
            "image_url",
            "created_at",
            "updated_at",
        ]

        # `image` is write-only (upload); reads use the absolute `image_url`.
        extra_kwargs = {
            "image": {"write_only": True, "required": False},
            "title": {"required": False},
            "content": {"required": False, "allow_blank": True},
            "feeling": {"required": False},
        }

    def get_author_avatar(self, obj):
        # author is select_related in the feed querysets, so this is free.
        return getattr(obj.author, "avatar_url", "") or ""

    def get_image_url(self, obj):
        if not obj.image:
            return None
        try:
            url = obj.image.url
        except ValueError:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def validate(self, attrs):
        # A post must carry *something* — text, an image, or a feeling. Fall back
        # to the existing instance for partial (PATCH) updates.
        inst = self.instance
        content = attrs.get("content", getattr(inst, "content", "") if inst else "")
        feeling = attrs.get("feeling", getattr(inst, "feeling", "") if inst else "")
        has_image = bool(attrs.get("image")) or bool(getattr(inst, "image", None) if inst else None)
        if not ((content or "").strip() or (feeling or "").strip() or has_image):
            raise serializers.ValidationError("A post needs text, an image, or a feeling.")
        return attrs

    def get_likes_count(self, obj):
        # Prefer the value annotated by the queryset (avoids an extra query per post).
        annotated = getattr(obj, "num_likes", None)
        if annotated is not None:
            return annotated
        return obj.likes.count()

    def get_is_liked(self, obj):
        # Prefer the annotated Exists() flag if the view provided one.
        annotated = getattr(obj, "liked_by_me", None)
        if annotated is not None:
            return annotated

        request = self.context.get("request")
        if not request or request.user.is_anonymous:
            return False

        return obj.likes.filter(user=request.user).exists()