from rest_framework import generics, permissions
from .serializers import RegisterSerializer, UserSerializer
# Create your views here.


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
