from rest_framework import serializers

from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment

        fields = [
            "id",
            "post",
            "author",
            "content",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "post",
            "author",
            "created_at",
            "updated_at",
        ]
