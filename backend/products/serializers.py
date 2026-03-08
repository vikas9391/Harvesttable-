from rest_framework import serializers
from .models import Product, ProductReview


class ProductReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductReview
        fields = ['id', 'author', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


def _resolve_image(obj, request):
    """
    Priority:
      1. Uploaded file  → absolute URL via request
      2. image_url_path → absolute URL built from request host
      3. None
    """
    if obj.image and request:
        return request.build_absolute_uri(obj.image.url)
    if obj.image_url_path:
        if request:
            return request.build_absolute_uri(obj.image_url_path)
        return obj.image_url_path
    return None


class ProductSerializer(serializers.ModelSerializer):
    reviews        = ProductReviewSerializer(many=True, read_only=True)
    review_count   = serializers.IntegerField(source='reviews.count', read_only=True)
    average_rating = serializers.SerializerMethodField()
    image_url      = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'category',
            'origin', 'image', 'image_url', 'badge',
            'is_organic', 'is_vegan', 'is_gluten_free', 'is_fair_trade',
            'is_featured', 'is_seasonal',
            'in_stock', 'stock_quantity',
            'reviews', 'review_count', 'average_rating', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None

    def get_image_url(self, obj):
        return _resolve_image(obj, self.context.get('request'))


class ProductListSerializer(serializers.ModelSerializer):
    """Lighter serializer used for list / card views."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'price', 'category', 'origin',
            'image_url', 'badge',
            'is_organic', 'is_vegan', 'is_gluten_free', 'is_fair_trade',
            'is_featured', 'is_seasonal',
            'in_stock', 'stock_quantity',
        ]

    def get_image_url(self, obj):
        return _resolve_image(obj, self.context.get('request'))