from django.db import models
import uuid


# Create your models here.
class Campus(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=25)
    slug = models.SlugField(unique=True)

    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)

    description = models.TextField(blank=True)

    # Optional real assets — set these to official/licensed URLs (media kit or
    # Wikimedia Commons). When blank, the frontend falls back to a generated
    # emblem (logo) and a themed campus photo (banner). Avoids bundling any
    # trademarked logos or copyrighted photos in the repo.
    logo_url = models.URLField(blank=True, max_length=500)
    banner_url = models.URLField(blank=True, max_length=500)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

