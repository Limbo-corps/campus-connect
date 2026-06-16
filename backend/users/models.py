# users/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True, max_length=500)

    # Profile customisation
    profile_template = models.CharField(max_length=32, default="aurora", blank=True)
    tagline = models.CharField(max_length=120, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    campus = models.ForeignKey(
        "campuses.Campus",
        on_delete=models.SET_NULL,
        related_name="students",
        null=True,
        blank=True,
    )
    
