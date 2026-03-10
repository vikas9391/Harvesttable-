from decimal import Decimal
from rest_framework import serializers
from .models import (
    Order, OrderItem, OrderGiftBox, OrderGiftBoxItem,
    Cart, CartItem, CartGiftBox, CartGiftBoxItem,
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _build_product_dict(p, request=None):
    """Return a plain dict representation of a Product for cart/order responses."""
    image_url = None
    if getattr(p, 'image', None) and request:
        image_url = request.build_absolute_uri(p.image.url)
    elif getattr(p, 'image_url_path', None):
        image_url = (
            request.build_absolute_uri(p.image_url_path)
            if request else p.image_url_path
        )

    return {
        'id':             p.id,
        'name':           p.name,
        'slug':           p.slug,
        'price':          str(p.price),
        'category':       getattr(p, 'category', ''),
        'origin':         getattr(p, 'origin', ''),
        'description':    getattr(p, 'description', ''),
        'image_url':      image_url,
        'imageType':      getattr(p, 'image_type', getattr(p, 'imageType', None)),
        'badge':          getattr(p, 'badge', None),
        'name_fr':        getattr(p, 'name_fr', None),
        'name_ar':        getattr(p, 'name_ar', None),
        'description_fr': getattr(p, 'description_fr', None),
        'description_ar': getattr(p, 'description_ar', None),
        'badge_fr':       getattr(p, 'badge_fr', None),
        'badge_ar':       getattr(p, 'badge_ar', None),
        'is_organic':     getattr(p, 'is_organic', False),
        'is_vegan':       getattr(p, 'is_vegan', False),
        'is_gluten_free': getattr(p, 'is_gluten_free', False),
        'is_fair_trade':  getattr(p, 'is_fair_trade', False),
        'in_stock':       getattr(p, 'in_stock', True),
        'stock_quantity': getattr(p, 'stock_quantity', 0),
        'is_featured':    getattr(p, 'is_featured', False),
        'is_seasonal':    getattr(p, 'is_seasonal', False),
        'created_at':     str(p.created_at),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Order serializers
# ─────────────────────────────────────────────────────────────────────────────

class OrderItemSerializer(serializers.ModelSerializer):
    name     = serializers.CharField(source='product_name', read_only=True)
    qty      = serializers.IntegerField(source='quantity', read_only=True)
    price    = serializers.DecimalField(source='product_price', max_digits=8, decimal_places=2, read_only=True)
    quantity = serializers.IntegerField(write_only=True)

    class Meta:
        model            = OrderItem
        fields           = ['id', 'product', 'name', 'qty', 'quantity', 'price', 'subtotal']
        read_only_fields = ['name', 'price', 'subtotal']


class OrderGiftBoxItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderGiftBoxItem
        fields = ['product_name', 'product_price']


class OrderGiftBoxSerializer(serializers.ModelSerializer):
    gift_items = OrderGiftBoxItemSerializer(many=True, read_only=True)

    class Meta:
        model  = OrderGiftBox
        fields = ['id', 'size', 'packaging_fee', 'quantity', 'gift_items']


class OrderSerializer(serializers.ModelSerializer):
    items      = OrderItemSerializer(many=True)
    gift_boxes = OrderGiftBoxSerializer(many=True, read_only=True)
    shipping   = serializers.DecimalField(source='shipping_cost', max_digits=6, decimal_places=2, read_only=True)
    address    = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'order_number', 'email', 'full_name', 'phone',
            'address',
            'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country',
            'status', 'subtotal', 'shipping', 'total',
            'notes', 'items', 'gift_boxes', 'created_at',
        ]
        read_only_fields = ['id', 'order_number', 'subtotal', 'total', 'created_at']

    def get_address(self, obj):
        parts = [obj.address_line1]
        if obj.address_line2:
            parts.append(obj.address_line2)
        if obj.city:
            parts.append(obj.city)
        if obj.state:
            parts.append(obj.state)
        if obj.postal_code:
            parts.append(obj.postal_code)
        if obj.country:
            parts.append(obj.country)
        return ', '.join(filter(None, parts))

    def create(self, validated_data):
        items_data      = validated_data.pop('items', [])
        gift_boxes_data = validated_data.pop('gift_boxes_payload', [])

        # ── Subtotal: regular items + gift box totals ──────────────────────
        items_subtotal = sum(
            item['product'].price * item['quantity']
            for item in items_data
        )
        gift_subtotal = sum(
            Decimal(str(gb['items_price'])) + Decimal(str(gb['packaging_fee']))
            for gb in gift_boxes_data
        )
        subtotal = items_subtotal + gift_subtotal
        shipping = Decimal('5.99') if subtotal < Decimal('50') else Decimal('0')

        order = Order.objects.create(
            **validated_data,
            subtotal=subtotal,
            shipping_cost=shipping,
            total=subtotal + shipping,
        )

        # ── Regular order items ────────────────────────────────────────────
        for item_data in items_data:
            product = item_data['product']
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                product_price=product.price,
                quantity=item_data['quantity'],
                subtotal=product.price * item_data['quantity'],
            )

        # ── Gift box snapshots ─────────────────────────────────────────────
        for gb in gift_boxes_data:
            gift_box = OrderGiftBox.objects.create(
                order=order,
                size=gb['size'],
                packaging_fee=Decimal(str(gb['packaging_fee'])),
                quantity=gb['quantity'],
            )
            for p in gb['products']:
                OrderGiftBoxItem.objects.create(
                    gift_box=gift_box,
                    product_name=p['name'],
                    product_price=Decimal(str(p['price'])),
                )

        return order


# ─────────────────────────────────────────────────────────────────────────────
# Cart serializers
# ─────────────────────────────────────────────────────────────────────────────

class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)
    product    = serializers.SerializerMethodField()

    class Meta:
        model  = CartItem
        fields = ['id', 'product_id', 'product', 'quantity']

    def get_product(self, obj):
        return _build_product_dict(obj.product, self.context.get('request'))


class CartGiftBoxItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()

    class Meta:
        model  = CartGiftBoxItem
        fields = ['id', 'product']

    def get_product(self, obj):
        return _build_product_dict(obj.product, self.context.get('request'))


class CartGiftBoxSerializer(serializers.ModelSerializer):
    gift_items  = CartGiftBoxItemSerializer(many=True, read_only=True)
    items_price = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model  = CartGiftBox
        fields = [
            'id', 'size', 'packaging_fee', 'quantity',
            'gift_items', 'items_price', 'total_price',
        ]

    def get_items_price(self, obj):
        return str(obj.items_price)

    def get_total_price(self, obj):
        return str(obj.total_price)


class CartSerializer(serializers.ModelSerializer):
    items      = serializers.SerializerMethodField()
    gift_boxes = CartGiftBoxSerializer(many=True, read_only=True)

    class Meta:
        model  = Cart
        fields = ['id', 'items', 'gift_boxes', 'updated_at']

    def get_items(self, obj):
        """
        Return only regular cart items whose product is NOT already inside
        a gift box in this cart. This prevents a product from appearing both
        as a standalone row and inside a bundle when the user only added it
        via the Gift Builder.
        """
        # Collect every product_id that lives inside any gift box in this cart
        gift_box_product_ids: set = set()
        for gb in obj.gift_boxes.prefetch_related('gift_items'):  # type: ignore[attr-defined]
            for gi in gb.gift_items.all():  # type: ignore[attr-defined]
                gift_box_product_ids.add(gi.product_id)  # type: ignore[attr-defined]

        # Only return items whose product is NOT already in a gift box
        regular_items = [
            item for item in obj.items.select_related('product')  # type: ignore[attr-defined]
            if item.product_id not in gift_box_product_ids  # type: ignore[attr-defined]
        ]
        return CartItemSerializer(regular_items, many=True, context=self.context).data