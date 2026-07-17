from django.db.models import Count, Exists, OuterRef
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Like, Post
from .serializers import PostSerializer

# Constants for query limits
DEFAULT_FEED = 50
MAX_FEED = 100


def _annotated_posts(request):
    """
    Returns a core Post queryset preloaded with author and campus relationships,
    plus SQL-annotated like aggregates to avoid N+1 query bottlenecks.
    """
    liked_by_me = Like.objects.filter(post=OuterRef("pk"), user=request.user)
    return Post.objects.select_related("author", "campus").annotate(
        num_likes=Count("likes", distinct=True),
        liked_by_me=Exists(liked_by_me),
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_post(request):
    """Creates a new post contextually bounded to the current user and their campus."""
    serializer = PostSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    post = serializer.save(author=request.user, campus=request.user.campus)
    return Response(
        PostSerializer(post, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_posts(request):
    """Fetches the global post feed with an optionally configured query limit parameter."""
    try:
        try:
            limit = min(int(request.query_params.get("limit", DEFAULT_FEED)), MAX_FEED)
        except (TypeError, ValueError):
            limit = DEFAULT_FEED

        posts = _annotated_posts(request).order_by("-created_at")[:limit]
        return Response(
            PostSerializer(posts, many=True, context={"request": request}).data
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_posts(request, user_id=None):
    """Fetches a historical stream of posts matching either a specific user_id or the request owner."""
    try:
        target_user = user_id if user_id is not None else request.user.id
        posts = (
            _annotated_posts(request)
            .filter(author_id=target_user)
            .order_by("-created_at")
        )
        return Response(
            PostSerializer(posts, many=True, context={"request": request}).data
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_post(request, post_id):
    """Fetches a detailed view of a singular annotated post item."""
    try:
        post = _annotated_posts(request).get(id=post_id)
        return Response(PostSerializer(post, context={"request": request}).data)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    """Permits an author to permanently drop an active post asset."""
    try:
        post = Post.objects.get(id=post_id)
        if post.author != request.user:
            return Response(
                {"error": "You cannot delete this post"},
                status=status.HTTP_403_FORBIDDEN,
            )
        post.delete()
        return Response({"message": "Post deleted successfully"})
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_post(request, post_id):
    """Permits the author to execute partial or full content revisions on a post."""
    try:
        post = Post.objects.get(id=post_id)
        if post.author != request.user:
            return Response(
                {"error": "You cannot edit this post"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = PostSerializer(
            post, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Re-fetch with annotations so UI client instantly receives correct updated states
        updated_post = _annotated_posts(request).get(id=post.id)
        return Response(PostSerializer(updated_post, context={"request": request}).data)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    """Idempotently appends a profile engagement reaction element onto the target item."""
    try:
        post = Post.objects.get(id=post_id)
        Like.objects.get_or_create(user=request.user, post=post)
        return Response({"message": "Post Liked"})
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unlike_post(request, post_id):
    """Drops an existing profile engagement like relation tracking mapping context."""
    try:
        like = Like.objects.get(user=request.user, post_id=post_id)
        like.delete()
        return Response({"message": "Post Unliked"})
    except Like.DoesNotExist:
        return Response({"error": "Like not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
