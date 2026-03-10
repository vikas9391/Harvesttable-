from django.urls import path
from .views import StoreSettingsView, ShippingSettingsView

app_name = "admin_panel"

urlpatterns = [
    # Store settings  →  GET / PATCH  /api/settings/store/
    path("store/", StoreSettingsView.as_view(), name="store-settings"),

    # Shipping rates  →  GET / PATCH  /api/settings/shipping/
    path("shipping/", ShippingSettingsView.as_view(), name="shipping-settings"),
]