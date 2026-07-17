from django.urls import path

from . import views

urlpatterns = [
    path("", views.get_posts, name="get-posts"),
    path("create/", views.create_post, name="create-post"),
    path("me/", views.get_user_posts, name="get-user-posts"),
    path("user/<uuid:user_id>/", views.get_user_posts, name="get-user-posts"),
    path("<uuid:post_id>/", views.get_post, name="get-post"),
    path("<uuid:post_id>/update/", views.update_post, name="update-post"),
    path("<uuid:post_id>/delete/", views.delete_post, name="delete-post"),
    path("<uuid:post_id>/like/", views.like_post, name="like-post"),
    path("<uuid:post_id>/unlike/", views.unlike_post, name="unlike-post"),
]
