from django.contrib import admin

from .models import Campus


@admin.register(Campus)
class CampusAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "state", "has_logo", "has_banner")
    list_filter = ("state",)
    search_fields = ("name", "city", "state")
    prepopulated_fields = {"slug": ("name",)}
    fields = (
        "name",
        "slug",
        "city",
        "state",
        "description",
        "logo_url",
        "banner_url",
    )

    @admin.display(boolean=True, description="Logo")
    def has_logo(self, obj):
        return bool(obj.logo_url)

    @admin.display(boolean=True, description="Banner")
    def has_banner(self, obj):
        return bool(obj.banner_url)
