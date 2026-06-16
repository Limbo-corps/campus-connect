import json
import urllib.request
import uuid

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UpdateProfileSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """GET current user; PATCH/PUT to edit own profile."""

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "put"]

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return UpdateProfileSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        # Always return the full user representation after an update.
        super().update(request, *args, **kwargs)
        return Response(UserSerializer(self.get_object()).data)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    access_token = request.data.get("access_token")
    if not access_token:
        return Response({"error": "No access_token provided"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            userinfo = json.loads(resp.read().decode())

        if not userinfo.get("email_verified"):
            return Response({"error": "Google email not verified"}, status=status.HTTP_400_BAD_REQUEST)

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

        if not created and avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
            user.save(update_fields=["avatar_url"])

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
