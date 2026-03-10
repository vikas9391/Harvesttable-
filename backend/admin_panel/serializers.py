from rest_framework import serializers
from .models import StoreSettings, ShippingSettings


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StoreSettings
        fields = ["store_name", "contact_email", "updated_at"]
        read_only_fields = ["updated_at"]


class ShippingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShippingSettings
        fields = [
            "free_shipping_threshold",
            "standard_shipping_cost",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate_free_shipping_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Free shipping threshold must be a non-negative value."
            )
        return value

    def validate_standard_shipping_cost(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Standard shipping cost must be a non-negative value."
            )
        return value