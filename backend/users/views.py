import json
import urllib.request
import uuid
from typing import Any, cast

from django.conf import settings

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.models import Follow, User

from .serializers import (
    FollowSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """GET current user; PATCH/PUT to edit own profile."""

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "put"]

    def get_serializer_class(self):  # pyright: ignore[reportIncompatibleMethodOverride]
        if self.request.method in ("PATCH", "PUT"):
            return UpdateProfileSerializer
        return UserSerializer

    def get_object(self):  # pyright: ignore[reportIncompatibleMethodOverride]
        return self.request.user

    def update(self, request, *args, **kwargs):
        # Always return the full user representation after an update.
        super().update(request, *args, **kwargs)
        return Response(UserSerializer(self.get_object()).data)


class CookieTokenObtainPairView(TokenObtainPairView):
    """Custom login view that sets the refresh token in an HttpOnly cookie."""

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        response_data = serializer.validated_data
        access_token = response_data.get("access")
        refresh_token = response_data.get("refresh")

        response = Response({"access": access_token}, status=status.HTTP_200_OK)

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=24 * 60 * 60,  # 1 day
        )
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Custom token refresh view that reads the refresh token from an HttpOnly cookie."""

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        request_data = cast(dict[str, Any], request.data)

        if not refresh_token:
            refresh_token = request_data.get("refresh")

        if not refresh_token:
            return Response(
                {"error": "Refresh token not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        mutable_data = request_data.copy()
        mutable_data["refresh"] = refresh_token

        serializer = self.get_serializer(data=mutable_data)
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError) as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        response_data = serializer.validated_data
        access_token = response_data.get("access")
        new_refresh_token = response_data.get("refresh")

        response = Response({"access": access_token}, status=status.HTTP_200_OK)

        if new_refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=new_refresh_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                max_age=24 * 60 * 60,
            )
        return response


class CookieLogoutView(APIView):
    """Logout view that clears the refresh token cookie and optionally blacklists the token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            refresh_token = request.data.get("refresh")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Safe fallback if blacklisting is not configured/already expired

        response = Response(
            {"message": "Successfully logged out"}, status=status.HTTP_200_OK
        )
        response.delete_cookie("refresh_token")
        return response


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  # pyright: ignore[reportIncompatibleMethodOverride]
        return (
            User.objects.exclude(pk=self.request.user.pk)
            .exclude(is_superuser=True)
            .order_by("username")
        )


class UserByUsernameView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "username"

    def get_queryset(self):  # pyright: ignore[reportIncompatibleMethodOverride]
        return User.objects.exclude(is_superuser=True)


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    access_token = request.data.get("access_token")
    if not access_token:
        return Response(
            {"error": "No access_token provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            userinfo = json.loads(resp.read().decode())

        if not userinfo.get("email_verified"):
            return Response(
                {"error": "Google email not verified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = userinfo["email"]
        first_name = userinfo.get("given_name", "")
        last_name = userinfo.get("family_name", "")
        avatar_url = userinfo.get("picture", "")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email.split("@")[0] + "_" + uuid.uuid4().hex[:6],
                "first_name": first_name,
                "last_name": last_name,
                "avatar_url": avatar_url,
            },
        )
        user = cast(User, user)

        if not created and avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
            user.save(update_fields=["avatar_url"])

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "access": str(refresh.access_token),
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=24 * 60 * 60,
        )
        return response

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        if user == request.user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user,
        )

        return Response(
            {
                "following": True,
                "created": created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        deleted, _ = Follow.objects.filter(
            follower=request.user,
            following=user,
        ).delete()

        return Response(
            {
                "following": False,
                "deleted": bool(deleted),
            },
            status=status.HTTP_200_OK,
        )


class FollowersListView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  # type: ignore
        user = get_object_or_404(User, pk=self.kwargs["pk"])
        return (
            Follow.objects.filter(following=user)
            .select_related("follower")
            .order_by("-created_at")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["direction"] = "followers"
        return context


class FollowingListView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  # type: ignore
        user = get_object_or_404(User, pk=self.kwargs["pk"])

        return (
            Follow.objects.filter(follower=user)
            .select_related("following")
            .order_by("-created_at")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["direction"] = "following"
        return context
