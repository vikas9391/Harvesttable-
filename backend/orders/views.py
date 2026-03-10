from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404

from .models import (
    Order, Cart, CartItem, CartGiftBox, CartGiftBoxItem,
    GIFT_SIZE_PRICES, GIFT_SIZE_MAX_ITEMS,
)
from .serializers import OrderSerializer, CartSerializer
from products.models import Product


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


# ─────────────────────────────────────────────────────────────────────────────
# Orders
# ─────────────────────────────────────────────────────────────────────────────

class OrderViewSet(viewsets.ModelViewSet):
    queryset           = Order.objects.all()
    serializer_class   = OrderSerializer
    permission_classes = [AllowAny]
    http_method_names  = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self) -> QuerySet[Order]:  # type: ignore[override]
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff:
                return Order.objects.all().prefetch_related('items', 'gift_boxes__gift_items')
            return Order.objects.filter(user=user).prefetch_related('items', 'gift_boxes__gift_items')
        return Order.objects.none()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=False, methods=['get'], url_path='my', permission_classes=[AllowAny])
    def my_orders(self, request):
        if not request.user.is_authenticated:
            return Response([])
        orders = Order.objects.filter(user=request.user).prefetch_related(
            'items', 'gift_boxes__gift_items'
        ).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='admin', permission_classes=[AllowAny])
    def admin_list(self, request):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        orders = Order.objects.all().prefetch_related(
            'items', 'gift_boxes__gift_items'
        ).order_by('-created_at')
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


# ─────────────────────────────────────────────────────────────────────────────
# Cart — regular items
# ─────────────────────────────────────────────────────────────────────────────

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/orders/cart/"""
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def post(self, request):
        """POST /api/orders/cart/ — add or increment a regular item"""
        product_id = request.data.get('product_id')
        quantity   = int(request.data.get('quantity', 1))
        product    = get_object_or_404(Product, id=product_id)
        cart       = get_or_create_cart(request.user)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        item.quantity = item.quantity + quantity if not created else quantity
        item.save()

        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request):
        """DELETE /api/orders/cart/ — clear entire cart (items + gift boxes)"""
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()        # type: ignore[attr-defined]
        cart.gift_boxes.all().delete()   # type: ignore[attr-defined]
        return Response(CartSerializer(cart, context={'request': request}).data)


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
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, item_id):
        """DELETE /api/orders/cart/items/<item_id>/"""
        item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        item.delete()
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)


# ─────────────────────────────────────────────────────────────────────────────
# Cart — gift boxes
# ─────────────────────────────────────────────────────────────────────────────

class CartGiftBoxView(APIView):
    """
    POST /api/orders/cart/gift-boxes/
    Body: {
        "size": "medium",           // small | medium | large
        "product_ids": [1, 2, 3],   // must not exceed size's max_items
        "quantity": 1               // optional, defaults to 1
    }
    Creates a new independent gift box bundle each time it is called,
    so users can add as many different gift boxes as they want.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        size        = request.data.get('size', 'medium')
        product_ids = request.data.get('product_ids', [])
        quantity    = max(1, int(request.data.get('quantity', 1)))

        if size not in GIFT_SIZE_PRICES:
            return Response(
                {'detail': f'Invalid size. Choose from: {list(GIFT_SIZE_PRICES.keys())}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_items = GIFT_SIZE_MAX_ITEMS[size]
        if len(product_ids) == 0:
            return Response({'detail': 'No products provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(product_ids) > max_items:
            return Response(
                {'detail': f'A {size} box holds at most {max_items} items. You sent {len(product_ids)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate all products exist
        products  = list(Product.objects.filter(id__in=product_ids))
        found_ids = {p.id for p in products}  # type: ignore[attr-defined]
        missing   = set(product_ids) - found_ids
        if missing:
            return Response(
                {'detail': f'Products not found: {list(missing)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart          = get_or_create_cart(request.user)
        packaging_fee = Decimal(GIFT_SIZE_PRICES[size])

        gift_box = CartGiftBox.objects.create(
            cart=cart,
            size=size,
            packaging_fee=packaging_fee,
            quantity=quantity,
        )

        # Preserve order of product_ids as sent by the client
        product_map = {p.id: p for p in products}  # type: ignore[attr-defined]
        for pid in product_ids:
            CartGiftBoxItem.objects.create(gift_box=gift_box, product=product_map[pid])

        return Response(
            CartSerializer(cart, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        """GET /api/orders/cart/gift-boxes/ — list all gift boxes in the cart"""
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)


class CartGiftBoxDetailView(APIView):
    """
    GET    /api/orders/cart/gift-boxes/<box_id>/   — fetch one box
    PATCH  /api/orders/cart/gift-boxes/<box_id>/   — update quantity
    DELETE /api/orders/cart/gift-boxes/<box_id>/   — remove the box
    """
    permission_classes = [IsAuthenticated]

    def _get_box(self, request, box_id):
        return get_object_or_404(CartGiftBox, id=box_id, cart__user=request.user)

    def get(self, request, box_id):
        self._get_box(request, box_id)
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def patch(self, request, box_id):
        """Update the quantity of an existing gift box."""
        box      = self._get_box(request, box_id)
        quantity = int(request.data.get('quantity', box.quantity))
        if quantity <= 0:
            box.delete()
        else:
            box.quantity = quantity
            box.save()
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, box_id):
        """Remove a gift box (and its items) from the cart."""
        box = self._get_box(request, box_id)
        box.delete()
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)


# ─────────────────────────────────────────────────────────────────────────────
# Cart merge (guest → authenticated)
# ─────────────────────────────────────────────────────────────────────────────

class CartMergeView(APIView):
    """
    POST /api/orders/cart/merge/
    Body: {
        "items": [{"product_id": 1, "quantity": 2}, ...],
        "gift_boxes": [
            {
                "size": "medium",
                "product_ids": [1, 2, 3],
                "quantity": 1
            },
            ...
        ]
    }
    Merges a guest (localStorage) cart into the authenticated user's server cart.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        guest_items      = request.data.get('items', [])
        guest_gift_boxes = request.data.get('gift_boxes', [])
        cart             = get_or_create_cart(request.user)

        # ── Merge regular items ───────────────────────────────────────────
        for entry in guest_items:
            try:
                product  = Product.objects.get(id=entry['product_id'])
                quantity = int(entry.get('quantity', 1))
                item, created = CartItem.objects.get_or_create(cart=cart, product=product)
                item.quantity = item.quantity + quantity if not created else quantity
                item.save()
            except (Product.DoesNotExist, KeyError, ValueError):
                continue

        # ── Merge gift boxes ──────────────────────────────────────────────
        for box_entry in guest_gift_boxes:
            try:
                size        = box_entry.get('size', 'medium')
                product_ids = box_entry.get('product_ids', [])
                quantity    = max(1, int(box_entry.get('quantity', 1)))

                if size not in GIFT_SIZE_PRICES:
                    continue
                if not product_ids or len(product_ids) > GIFT_SIZE_MAX_ITEMS[size]:
                    continue

                products = list(Product.objects.filter(id__in=product_ids))
                if len(products) != len(product_ids):
                    continue

                packaging_fee = Decimal(GIFT_SIZE_PRICES[size])
                gift_box = CartGiftBox.objects.create(
                    cart=cart,
                    size=size,
                    packaging_fee=packaging_fee,
                    quantity=quantity,
                )
                product_map = {p.id: p for p in products}  # type: ignore[attr-defined]
                for pid in product_ids:
                    CartGiftBoxItem.objects.create(gift_box=gift_box, product=product_map[pid])
            except (KeyError, ValueError, TypeError):
                continue

        return Response(CartSerializer(cart, context={'request': request}).data)