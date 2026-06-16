from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

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

class UserSerializer(serializers.ModelSerializer):
    campus = serializers.PrimaryKeyRelatedField(read_only=True)

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
        ]


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Only the fields a user is allowed to edit about themselves."""

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