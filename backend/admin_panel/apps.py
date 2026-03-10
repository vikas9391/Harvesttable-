from django.apps import AppConfig


class AdminPanelConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name               = "admin_panel"
    verbose_name       = "Admin Panel — Settings"

    def ready(self):
        """
        Ensure singleton rows are created the first time the app
        is ready (e.g. after migrate). Safe to call multiple times.
        """
        # Import inside ready() to avoid AppRegistryNotReady errors
        try:
            from .models import StoreSettings, ShippingSettings  # noqa: F401
            # Rows are created lazily via `.get()` on first API hit,
            # so nothing extra is needed here. The import is kept
            # for future signal wiring if required.
        except Exception:
            pass