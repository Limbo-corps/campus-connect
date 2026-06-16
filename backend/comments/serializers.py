from rest_framework import serializers

from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Comment

        fields = [
            "id",
            "post",
            "author",
            "author_avatar",
            "content",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "post",
            "author",
            "author_avatar",
            "created_at",
            "updated_at",
        ]

    def get_author_avatar(self, obj):
        # author is select_related in the list view, so this is free.
        return getattr(obj.author, "avatar_url", "") or ""
