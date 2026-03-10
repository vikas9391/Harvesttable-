from django.contrib import admin
from .models import StoreSettings, ShippingSettings


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    """
    Singleton admin — disables the 'Add' button so only one
    StoreSettings row ever exists.
    """
    list_display  = ("store_name", "contact_email", "currency", "updated_at")
    readonly_fields = ("updated_at",)

    def has_add_permission(self, request):
        # Prevent creating a second row
        return not StoreSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False  # Never delete the singleton


@admin.register(ShippingSettings)
class ShippingSettingsAdmin(admin.ModelAdmin):
    """
    Singleton admin for shipping rates.
    """
    list_display   = (
        "free_shipping_threshold",
        "standard_shipping_cost",
        "updated_at",
    )
    readonly_fields = ("updated_at",)

    def has_add_permission(self, request):
        return not ShippingSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False