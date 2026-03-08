from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

from .models import Product, ProductReview
from .serializers import ProductSerializer, ProductListSerializer, ProductReviewSerializer


class ProductFilter(django_filters.FilterSet):
    min_price    = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price    = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    category     = django_filters.CharFilter(field_name='category',     lookup_expr='exact')
    is_organic   = django_filters.BooleanFilter(field_name='is_organic')
    is_vegan     = django_filters.BooleanFilter(field_name='is_vegan')
    is_gluten_free = django_filters.BooleanFilter(field_name='is_gluten_free')
    is_fair_trade  = django_filters.BooleanFilter(field_name='is_fair_trade')
    is_featured  = django_filters.BooleanFilter(field_name='is_featured')
    is_seasonal  = django_filters.BooleanFilter(field_name='is_seasonal')

    class Meta:
        model  = Product
        fields = [
            'category', 'is_organic', 'is_vegan', 'is_gluten_free',
            'is_fair_trade', 'is_featured', 'is_seasonal', 'in_stock',
        ]


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow GET/HEAD/OPTIONS to anyone; write operations only to staff/superusers."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))


class ProductViewSet(viewsets.ModelViewSet):
    queryset           = Product.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = ProductFilter
    search_fields      = ['name', 'description', 'origin']
    ordering_fields    = ['price', 'name', 'created_at', 'stock_quantity']
    ordering           = ['-created_at']
    lookup_field       = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    # ── /api/products/<slug>/reviews/  (POST) ────────────────────────────────
    @action(detail=True, methods=['post'], url_path='reviews',
            permission_classes=[permissions.IsAuthenticated])
    def add_review(self, request, slug=None):
        product    = self.get_object()
        serializer = ProductReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ── /api/products/featured/  (GET) ───────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        qs = Product.objects.filter(in_stock=True, is_featured=True)
        if not qs.exists():
            # Fallback: products that have a badge
            qs = Product.objects.filter(in_stock=True).exclude(badge='')[:4]
        serializer = ProductListSerializer(qs[:4], many=True, context={'request': request})
        return Response(serializer.data)

    # ── /api/products/seasonal/  (GET) ───────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='seasonal')
    def seasonal(self, request):
        qs = Product.objects.filter(in_stock=True, is_seasonal=True)
        if not qs.exists():
            qs = Product.objects.filter(in_stock=True, badge='Seasonal')
        serializer = ProductListSerializer(qs[:3], many=True, context={'request': request})
        return Response(serializer.data)

    # ── /api/products/categories/  (GET) ─────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='categories')
    def categories(self, request):
        from .models import Category
        return Response([{'value': c.value, 'label': c.label} for c in Category])