from django.urls import path

from . import views

urlpatterns = [
    path(
        "post/<uuid:post_id>/",
        views.get_comments,
        name="get-comments",
    ),
    path(
        "post/<uuid:post_id>/create/",
        views.create_comment,
        name="create-comment",
    ),
    path(
        "<uuid:comment_id>/update/",
        views.update_comment,
        name="update-comment",
    ),
    path(
        "<uuid:comment_id>/delete/",
        views.delete_comment,
        name="delete-comment",
    ),
]
