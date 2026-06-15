from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Comment
from .serializers import CommentSerializer
from posts.models import Post


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    try:
        post = Post.objects.get(id=post_id)

        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = serializer.save(
            author=request.user,
            post=post,
        )

        return Response(
            CommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_comments(request, post_id):
    try:
        comments = (
            Comment.objects.filter(post_id=post_id)
            .select_related("author")
            .order_by("created_at")
        )

        serializer = CommentSerializer(
            comments,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_comment(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)

        if comment.author != request.user:
            return Response(
                {"error": "You cannot edit this comment"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CommentSerializer(
            comment,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except Comment.DoesNotExist:
        return Response(
            {"error": "Comment not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)

        if comment.author != request.user:
            return Response(
                {"error": "You cannot delete this comment"},
                status=status.HTTP_403_FORBIDDEN,
            )

        comment.delete()

        return Response(
            {"message": "Comment deleted successfully"},
            status=status.HTTP_200_OK,
        )

    except Comment.DoesNotExist:
        return Response(
            {"error": "Comment not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
