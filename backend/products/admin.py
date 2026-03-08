# products/admin.py
from django.contrib import admin
from .models import Product, ProductReview


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'in_stock', 'is_organic', 'origin']
    list_filter = ['category', 'in_stock', 'is_organic', 'is_vegan', 'is_gluten_free', 'is_fair_trade']
    search_fields = ['name', 'description', 'origin']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['price', 'in_stock']


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'author', 'rating', 'created_at']
    list_filter = ['rating']
