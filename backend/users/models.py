# users/models.py

import uuid

from django.contrib.auth.models import AbstractUser, UserManager
from django.core.exceptions import ValidationError
from django.db import models


class User(AbstractUser):
    objects = UserManager()
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True, max_length=500)

    profile_template = models.CharField(max_length=32, default="aurora", blank=True)
    tagline = models.CharField(max_length=120, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    email = models.EmailField(unique=True)

    campus = models.ForeignKey(
        "campuses.Campus",
        on_delete=models.SET_NULL,
        related_name="students",
        null=True,
        blank=True,
    )

    following = models.ManyToManyField(
        "self",
        through="Follow",
        through_fields=("follower", "following"),
        symmetrical=False,
        related_name="followers",
    )

    def is_following_user(self, other: "User") -> bool:
        """True if this user follows ``other``."""
        return self.following.filter(pk=other.pk).exists()

    def is_mutual_with(self, other: "User") -> bool:
        """True only when both users follow each other (DM prerequisite)."""
        if self.pk == other.pk:
            return False
        return (
            self.following.filter(pk=other.pk).exists()
            and self.followers.filter(pk=other.pk).exists()
        )

    def mutuals(self):
        """Users who follow this user AND are followed back by this user."""
        return (
            User.objects.filter(pk__in=self.following.values_list("pk", flat=True))
            .filter(pk__in=self.followers.values_list("pk", flat=True))
            .order_by("first_name", "username")
        )


class Follow(models.Model):
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="following_relationships",
    )

    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="follower_relationships",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"],
                name="unique_follow_relationship",
            )
        ]
        ordering = ["-created_at"]

    def clean(self):
        if self.follower == self.following:
            raise ValidationError("Users cannot follow themselves.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.follower.username} → {self.following.username}"
