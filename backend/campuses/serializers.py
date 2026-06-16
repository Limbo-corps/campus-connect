from rest_framework import serializers

from .models import Campus


class CampusSerializer(serializers.ModelSerializer):
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Campus
        fields = [
            "id",
            "name",
            "slug",
            "city",
            "state",
            "description",
            "logo_url",
            "banner_url",
            "students_count",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def get_students_count(self, obj):
        annotated = getattr(obj, "num_students", None)
        if annotated is not None:
            return annotated
        return obj.students.count()
