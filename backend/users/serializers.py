from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from users.models import Follow, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        validate_password(value)
        return value

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
        ]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class BaseUserSerializer(serializers.ModelSerializer):
    campus = serializers.PrimaryKeyRelatedField(read_only=True)

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_mutual = serializers.SerializerMethodField()

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get("request")

        if request is None or request.user.is_anonymous or request.user == obj:
            return False

        return request.user.following.filter(pk=obj.pk).exists()

    def get_is_mutual(self, obj):
        """Whether the requester and this user follow each other (can DM)."""
        request = self.context.get("request")

        if request is None or request.user.is_anonymous or request.user == obj:
            return False

        return request.user.is_mutual_with(obj)


class UserSerializer(BaseUserSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "bio",
            "avatar_url",
            "profile_template",
            "tagline",
            "campus",
            "followers_count",
            "following_count",
            "is_following",
            "is_mutual",
        ]


class PublicUserSerializer(BaseUserSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "bio",
            "avatar_url",
            "profile_template",
            "tagline",
            "campus",
            "followers_count",
            "following_count",
            "is_following",
            "is_mutual",
        ]


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "bio",
            "avatar_url",
            "profile_template",
            "tagline",
        ]


class FollowUserSerializer(serializers.ModelSerializer):
    pass


class FollowSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Follow
        fields = [
            "user",
            "created_at",
        ]

    def get_user(self, obj):
        request = self.context.get("request")

        if self.context.get("direction") == "followers":
            return PublicUserSerializer(obj.follower, context={"request": request}).data

        return PublicUserSerializer(obj.following, context={"request": request}).data
