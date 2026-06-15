from django.urls import path

from . import views

urlpatterns = [
    path("", views.get_campuses),
    path("create/", views.create_campus),
    path("<uuid:campus_id>/", views.get_campus),
    path("<uuid:campus_id>/join/", views.join_campus),
    path("leave/", views.leave_campus),
    path("<uuid:campus_id>/update/", views.update_campus),
    path("<uuid:campus_id>/delete/", views.delete_campus),
]
