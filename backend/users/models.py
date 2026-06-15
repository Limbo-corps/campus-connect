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
    avatar_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    campus = models.ForeignKey(
        "campuses.Campus",
        on_delete=models.SET_NULL,
        related_name="students",
        null=True,
        blank=True,
    )
    
