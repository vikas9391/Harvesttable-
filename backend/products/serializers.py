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
      1. Uploaded Cloudinary file → .url is already absolute, return as-is
      2. image_url_path → build absolute URL from request host
      3. None
    """
    if obj.image:
        url = obj.image.url
        # Cloudinary returns full https:// URL — never wrap in build_absolute_uri
        if url.startswith('http://') or url.startswith('https://'):
            return url
        # Local storage fallback — build absolute URL
        if request:
            return request.build_absolute_uri(url)
        return url

    if obj.image_url_path:
        path = obj.image_url_path
        # If image_url_path is also already absolute, return as-is
        if path.startswith('http://') or path.startswith('https://'):
            return path
        if request:
            return request.build_absolute_uri(path)
        return path

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
            'origin', 'image', 'image_url',
            'badge', 'badge_fr', 'badge_ar',          # ← all 3 badge langs
            # ── Multilingual name & description ──────────────────────────
            'name_fr', 'name_ar',
            'description_fr', 'description_ar',
            # ─────────────────────────────────────────────────────────────
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
            'image_url',
            'badge', 'badge_fr', 'badge_ar',          # ← all 3 badge langs
            # ── Multilingual name & description ──────────────────────────
            'name_fr', 'name_ar',
            'description',        # ← fixes EN description always reading as ''
            'description_fr', 'description_ar',
            # ─────────────────────────────────────────────────────────────
            'is_organic', 'is_vegan', 'is_gluten_free', 'is_fair_trade',
            'is_featured', 'is_seasonal',
            'in_stock', 'stock_quantity',
        ]

    def get_image_url(self, obj):
        return _resolve_image(obj, self.context.get('request'))