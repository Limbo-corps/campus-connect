from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Like, Post
from .serializers import PostSerializer


# Create your views here.
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_post(request):
    try:
        serializer = PostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        post = serializer.save(
            author=request.user,
            campus=request.user.campus,
        )

        return Response(
            PostSerializer(
                post,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_posts(request):
    try:
        posts = Post.objects.select_related("author", "campus").order_by("-created_at")

        serializer = PostSerializer(posts, many=True, context={"request", request})

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_posts(request):
    try:
        posts = Post.objects.filter(author=request.user).order_by("-created-at")

        serializer = PostSerializer(posts, many=True, context={"request", request})

        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)

        serializer = PostSerializer(post, context={"request", request})

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)

        if post.author != request.user:
            return Response(
                {"error": "You cannot delete this post"},
                status=status.HTTP_403_FORBIDDEN,
            )

        post.delete()

        return Response(
            {"message": "Post deleted successfully"},
            status=status.HTTP_200_OK,
        )

    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)

        if post.author != request.user:
            return Response(
                {"error": "You cannot edit this post"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PostSerializer(
            post, data=request.data, partial=True, context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)

        Like.objects.get_or_create(user=request.user, post=post)

        return Response({"message": "Post Liked"}, status=status.HTTP_200_OK)
    except Post.DoesNotExist:
        return Response({"Error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response(
            {"error": f"Internal server error: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unlike_post(request, post_id):
    try:
        like = Like.objects.get(user=request.user, post_id=post_id)

        like.delete()

        return Response({"message": "Post Unliked"}, status=status.HTTP_200_OK)
    except Like.DoesNotExist:
        return Response({"error": "Like not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response(
            {"error": "Internal Error occured"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
