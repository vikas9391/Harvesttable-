from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from products.models import Product
import uuid


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    order_number  = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user          = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    email         = models.EmailField()
    full_name     = models.CharField(max_length=200)
    phone         = models.CharField(max_length=20, blank=True)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city          = models.CharField(max_length=100)
    state         = models.CharField(max_length=100, blank=True)
    postal_code   = models.CharField(max_length=20)
    country       = models.CharField(max_length=100)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    subtotal      = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0'))
    total         = models.DecimalField(max_digits=10, decimal_places=2)
    notes         = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Order {self.order_number} - {self.full_name}'


class OrderItem(models.Model):
    order         = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product       = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name  = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity      = models.PositiveIntegerField(default=1)
    subtotal      = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if self.product and not self.product_name:
            self.product_name  = self.product.name
            self.product_price = self.product.price
        self.subtotal = self.product_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.quantity}x {self.product_name}'


# ── Gift Box sizes ─────────────────────────────────────────────────────────────

GIFT_BOX_SIZES = [
    ('small',  'Small',  3, '5.00'),
    ('medium', 'Medium', 5, '8.00'),
    ('large',  'Large',  8, '12.00'),
]

GIFT_SIZE_CHOICES   = [(s[0], s[1]) for s in GIFT_BOX_SIZES]
GIFT_SIZE_MAX_ITEMS = {s[0]: s[2] for s in GIFT_BOX_SIZES}
GIFT_SIZE_PRICES    = {s[0]: s[3] for s in GIFT_BOX_SIZES}


class Cart(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.email}"


class CartItem(models.Model):
    cart     = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'product')

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"


class CartGiftBox(models.Model):
    """
    A single gift box bundle in a cart.
    Each CartGiftBox has a size, a packaging fee, and N products inside it.
    Users can add multiple independent gift boxes to the same cart.
    """
    cart          = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='gift_boxes')
    size          = models.CharField(max_length=10, choices=GIFT_SIZE_CHOICES, default='medium')
    packaging_fee = models.DecimalField(max_digits=6, decimal_places=2)
    quantity      = models.PositiveIntegerField(default=1)   # how many of this identical box
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.size} gift box (cart {self.cart_id})"  # type: ignore[attr-defined]

    @property
    def items_price(self):
        return sum(item.product.price for item in self.gift_items.select_related('product'))  # type: ignore[attr-defined]

    @property
    def total_price(self):
        return (self.items_price + self.packaging_fee) * self.quantity


class CartGiftBoxItem(models.Model):
    """
    One product slot inside a CartGiftBox.
    The same product can appear in multiple gift boxes (no unique_together constraint here).
    """
    gift_box = models.ForeignKey(CartGiftBox, on_delete=models.CASCADE, related_name='gift_items')
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.product.name} in {self.gift_box}"


# ── Order-level gift box snapshot (for fulfilled orders) ──────────────────────

class OrderGiftBox(models.Model):
    """Immutable snapshot of a gift box at order-creation time."""
    order         = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='gift_boxes')
    size          = models.CharField(max_length=10, choices=GIFT_SIZE_CHOICES)
    packaging_fee = models.DecimalField(max_digits=6, decimal_places=2)
    quantity      = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.size} gift box in order {self.order.order_number}"


class OrderGiftBoxItem(models.Model):
    """One product inside an OrderGiftBox snapshot."""
    gift_box      = models.ForeignKey(OrderGiftBox, on_delete=models.CASCADE, related_name='gift_items')
    product_name  = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.product_name} in gift box {self.gift_box_id}"  # type: ignore[attr-defined]