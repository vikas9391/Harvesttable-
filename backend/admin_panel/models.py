from decimal import Decimal

from django.db import models


class StoreSettings(models.Model):
    """
    Singleton model for global store configuration.
    Only one row should ever exist (pk=1).
    """
    store_name    = models.CharField(max_length=255, default="HarvestTable")
    contact_email = models.EmailField(default="hello@harvesttable.com")
    currency      = models.CharField(
        max_length=10,
        default="USD",
        choices=[
            ("USD", "USD — US Dollar"),
            ("EUR", "EUR — Euro"),
            ("GBP", "GBP — British Pound"),
            ("MAD", "MAD — Moroccan Dirham"),
        ],
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Store Settings"
        verbose_name_plural = "Store Settings"

    def __str__(self):
        return f"{self.store_name} ({self.currency})"

    @classmethod
    def get(cls):
        """Always return the single StoreSettings instance (create if missing)."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ShippingSettings(models.Model):
    """
    Singleton model for shipping rate configuration.
    Only one row should ever exist (pk=1).
    """
    free_shipping_threshold = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("50.00"),
        help_text="Cart subtotal above which shipping is free.",
    )
    standard_shipping_cost = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("5.99"),
        help_text="Flat shipping cost when below the free threshold.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Shipping Settings"
        verbose_name_plural = "Shipping Settings"

    def __str__(self):
        return (
            f"Free ≥ ${self.free_shipping_threshold} | "
            f"Standard ${self.standard_shipping_cost}"
        )

    @classmethod
    def get(cls):
        """Always return the single ShippingSettings instance (create if missing)."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj