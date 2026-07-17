from django.urls import path

from .views import (
    UserByUsernameView,
    UserDetailView,
    UserListView,
    FollowUserView,
    FollowersListView,
    FollowingListView,
)

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path(
        "username/<str:username>/",
        UserByUsernameView.as_view(),
        name="user-by-username",
    ),
    path("<uuid:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("<uuid:pk>/follow/", FollowUserView.as_view(), name="follow-user"),
    path("<uuid:pk>/followers/", FollowersListView.as_view(), name="user-followers"),
    path("<uuid:pk>/following/", FollowingListView.as_view(), name="user-following"),
]
