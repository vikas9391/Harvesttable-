from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from .models import Order, Cart, CartItem
from .serializers import OrderSerializer, CartSerializer
from products.models import Product


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class OrderViewSet(viewsets.ModelViewSet):
    queryset           = Order.objects.all()
    serializer_class   = OrderSerializer
    permission_classes = [AllowAny]
    http_method_names  = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self) -> QuerySet[Order]:
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff:
                return Order.objects.all().prefetch_related('items')
            return Order.objects.filter(user=user).prefetch_related('items')
        return Order.objects.none()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=False, methods=['get'], url_path='my', permission_classes=[AllowAny])
    def my_orders(self, request):
        if not request.user.is_authenticated:
            return Response([])
        orders     = Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='admin', permission_classes=[AllowAny])
    def admin_list(self, request):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        orders     = Order.objects.all().prefetch_related('items').order_by('-created_at')
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'patch'], url_path='admin', permission_classes=[AllowAny])
    def admin_detail(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        order = self.get_object()
        if request.method == 'PATCH':
            allowed_fields = {'status'}
            data       = {k: v for k, v in request.data.items() if k in allowed_fields}
            serializer = OrderSerializer(order, data=data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)


# ── Cart Views ────────────────────────────────────────────────────────────────

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/orders/cart/"""
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        """POST /api/orders/cart/ — add or increment item"""
        product_id = request.data.get('product_id')
        quantity   = int(request.data.get('quantity', 1))
        product    = get_object_or_404(Product, id=product_id)
        cart       = get_or_create_cart(request.user)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        item.quantity = item.quantity + quantity if not created else quantity
        item.save()

        return Response(CartSerializer(cart).data)

    def delete(self, request):
        """DELETE /api/orders/cart/ — clear entire cart"""
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)


class CartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        """PATCH /api/orders/cart/items/<item_id>/"""
        quantity = int(request.data.get('quantity', 1))
        item     = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save()
        return Response(CartSerializer(get_or_create_cart(request.user)).data)

    def delete(self, request, item_id):
        """DELETE /api/orders/cart/items/<item_id>/"""
        item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        item.delete()
        return Response(CartSerializer(get_or_create_cart(request.user)).data)


class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """POST /api/orders/cart/merge/ — merge guest cart on login"""
        guest_items = request.data.get('items', [])
        cart        = get_or_create_cart(request.user)

        for entry in guest_items:
            try:
                product  = Product.objects.get(id=entry['product_id'])
                quantity = int(entry.get('quantity', 1))
                item, created = CartItem.objects.get_or_create(cart=cart, product=product)
                item.quantity = item.quantity + quantity if not created else quantity
                item.save()
            except (Product.DoesNotExist, KeyError, ValueError):
                continue

        return Response(CartSerializer(cart).data)