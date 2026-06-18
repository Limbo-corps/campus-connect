from django.urls import path
from .views import (
    RegisterView,
    MeView,
    google_auth,
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CookieLogoutView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CookieTokenObtainPairView.as_view(), name="login"),
    path("refresh/", CookieTokenRefreshView.as_view(), name="refresh"),
    path("logout/", CookieLogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("google/", google_auth, name="google-auth"),
]

