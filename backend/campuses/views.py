from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from backend import campuses

from .models import Campus
from .serializers import CampusSerializer

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_campus(request):
    try: 
        serializer = CampusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        campus = serializer.save()

        return Response(
            CampusSerializer(campus).data,
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {"error": f"Internal Server error: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_campuses(request):
    try:
        campuses = Campus.objects.all().order_by("name")

        serializer = CampusSerializer(
            campuses,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"error": f"Internal server error {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_campus(request, campus_id):
    try:
        campus = Campus.objects.get(id=campus_id)

        serializer = CampusSerializer(campus)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except Campus.DoesNotExist:
        return Response(
            {"error": "Campus not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    except Exception as e:
        return Response(
            {"error": f"Internal Server error {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_campus(request, campus_id):
    try:
        campus = Campus.objects.get(id=campus_id)

        request.user.campus = campus
        request.user.save()

        return Response(
            {"message": "Campus joined successfully"},
            status=status.HTTP_200_OK,
        )

    except Campus.DoesNotExist:
        return Response(
            {"error": "Campus not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    except Exception as e:
        return Response(
            {"error": f"Internal server error: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def leave_campus(request):
    request.user.campus = None
    request.user.save()

    return Response(
        {"message": "Campus left successfully"},
        status=status.HTTP_200_OK,
    )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def update_campus(request, campus_id):
    try:
        campus = Campus.objects.get(id=campus_id)

        serializer = CampusSerializer(
            campus,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except Campus.DoesNotExist:
        return Response(
            {"error": "Campus not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Internal Server Error: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_campus(request, campus_id):
    try:
        campus = Campus.objects.get(id=campus_id)

        campus.delete()

        return Response(
            {"message": "Campus deleted successfully"},
            status=status.HTTP_200_OK,
        )

    except Campus.DoesNotExist:
        return Response(
            {"error": "Campus not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Internal Server Error: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )