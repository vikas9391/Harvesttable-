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
    shipping_cost = models.DecimalField(max_digits=6, decimal_places=2, default=0)
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
    product       = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
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