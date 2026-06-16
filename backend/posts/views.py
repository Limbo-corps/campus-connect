from django.db.models import Count, Exists, OuterRef
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from .models import Like, Post
from .serializers import PostSerializer

# Default page size for the global feed — bounds the query so it never scans
# the entire table. Clients may override with ?limit= (capped at MAX_FEED).
DEFAULT_FEED = 50
MAX_FEED = 100


def _annotated_posts(request):
    """Posts with likes_count + is-liked computed in SQL (no per-row N+1)."""
    liked_by_me = Like.objects.filter(post=OuterRef("pk"), user=request.user)
    return (
        Post.objects.select_related("author", "campus")
        .annotate(
            num_likes=Count("likes", distinct=True),
            liked_by_me=Exists(liked_by_me),
        )
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_post(request):
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
    try:
        try:
            limit = min(int(request.query_params.get("limit", DEFAULT_FEED)), MAX_FEED)
        except (TypeError, ValueError):
            limit = DEFAULT_FEED

        posts = _annotated_posts(request).order_by("-created_at")[:limit]
        return Response(PostSerializer(posts, many=True, context={"request": request}).data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_posts(request):
    try:
        posts = _annotated_posts(request).filter(author=request.user).order_by("-created_at")
        return Response(PostSerializer(posts, many=True, context={"request": request}).data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        return Response(PostSerializer(post, context={"request": request}).data)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        if post.author != request.user:
            return Response({"error": "You cannot delete this post"}, status=status.HTTP_403_FORBIDDEN)
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
    try:
        post = Post.objects.get(id=post_id)
        if post.author != request.user:
            return Response({"error": "You cannot edit this post"}, status=status.HTTP_403_FORBIDDEN)
        serializer = PostSerializer(post, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
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
    try:
        like = Like.objects.get(user=request.user, post_id=post_id)
        like.delete()
        return Response({"message": "Post Unliked"})
    except Like.DoesNotExist:
        return Response({"error": "Like not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
