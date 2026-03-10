from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework             import status
from rest_framework.permissions import IsAuthenticated

from .models      import StoreSettings, ShippingSettings
from .serializers import StoreSettingsSerializer, ShippingSettingsSerializer
from .permissions import IsAdminUser


# ─── Store Settings ───────────────────────────────────────────────────────────

class StoreSettingsView(APIView):
    """
    GET  /api/settings/store/   — retrieve current store settings
    PATCH /api/settings/store/  — update store settings (admin only)

    The frontend (AdminSettings.tsx) uses both GET (on mount) and PATCH (on save).
    The CartContext also calls this endpoint on mount so non-admin users
    need read access; write is restricted to admins.
    """

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            # Any authenticated user (or guest) can read store settings.
            # The CartContext fetches shipping config without auth,
            # so we keep GET open.
            return []
        # PATCH / PUT require admin.
        return [IsAuthenticated(), IsAdminUser()]

    def get(self, request):
        instance   = StoreSettings.get()
        serializer = StoreSettingsSerializer(instance)
        return Response(serializer.data)

    def patch(self, request):
        instance   = StoreSettings.get()
        serializer = StoreSettingsSerializer(
            instance, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    # Alias PUT → PATCH behaviour for convenience
    def put(self, request):
        return self.patch(request)


# ─── Shipping Settings ────────────────────────────────────────────────────────

class ShippingSettingsView(APIView):
    """
    GET   /api/settings/shipping/  — retrieve shipping rates (public)
    PATCH /api/settings/shipping/  — update shipping rates (admin only)

    CartContext calls GET on every page load to pull live rates.
    AdminSettings.tsx calls both GET (on mount) and PATCH (on save).
    """

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return []
        return [IsAuthenticated(), IsAdminUser()]

    def get(self, request):
        instance   = ShippingSettings.get()
        serializer = ShippingSettingsSerializer(instance)
        return Response(serializer.data)

    def patch(self, request):
        instance   = ShippingSettings.get()
        serializer = ShippingSettingsSerializer(
            instance, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        return self.patch(request)