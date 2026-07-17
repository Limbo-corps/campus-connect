from django.db import models
import uuid


# Create your models here.
# The Post model represents a single post on the platform.
class Post(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    author = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="posts",
    )

    campus = models.ForeignKey(
        "campuses.Campus",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
    )

    # What kind of post this is — drives the editor used to create it and how
    # it's rendered (plain text vs. a formatted article vs. an image post).
    TEXT = "text"
    PHOTO = "photo"
    ARTICLE = "article"
    FEELING = "feeling"
    POST_TYPES = [
        (TEXT, "Text"),
        (PHOTO, "Photo"),
        (ARTICLE, "Article"),
        (FEELING, "Feeling"),
    ]
    post_type = models.CharField(max_length=10, choices=POST_TYPES, default=TEXT)

    # Optional article headline.
    title = models.CharField(max_length=200, blank=True, default="")

    # Body. Markdown for articles, plain text otherwise. May be blank for a
    # photo-only post.
    content = models.TextField(blank=True, default="")

    # Optional feeling tag (e.g. "💪 Motivated").
    feeling = models.CharField(max_length=50, blank=True, default="")

    # Optional uploaded image (FileField avoids a hard Pillow dependency).
    image = models.FileField(upload_to="posts/%Y/%m/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["author", "-created_at"]),
            models.Index(fields=["campus", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.author.username}: {self.content[:30]}"


# The Like model represents a like on a post.
class Like(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="likes",
    )

    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        related_name="likes",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "post"],
                name="unique_post_like",
            )
        ]
