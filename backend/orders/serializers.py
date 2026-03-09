from rest_framework import serializers
from .models import Order, OrderItem, Cart, CartItem


class OrderItemSerializer(serializers.ModelSerializer):
    name     = serializers.CharField(source='product_name', read_only=True)
    qty      = serializers.IntegerField(source='quantity', read_only=True)
    price    = serializers.DecimalField(source='product_price', max_digits=8, decimal_places=2, read_only=True)
    quantity = serializers.IntegerField(write_only=True)

    class Meta:
        model            = OrderItem
        fields           = ['id', 'product', 'name', 'qty', 'quantity', 'price', 'subtotal']
        read_only_fields = ['name', 'price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items    = OrderItemSerializer(many=True)
    shipping = serializers.DecimalField(source='shipping_cost', max_digits=6, decimal_places=2, read_only=True)
    address  = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'order_number', 'email', 'full_name', 'phone',
            'address',
            'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country',
            'status', 'subtotal', 'shipping', 'total',
            'notes', 'items', 'created_at',
        ]
        read_only_fields = ['id', 'order_number', 'subtotal', 'total', 'created_at']

    def get_address(self, obj):
        parts = [obj.address_line1]
        if obj.address_line2: parts.append(obj.address_line2)
        if obj.city:          parts.append(obj.city)
        if obj.state:         parts.append(obj.state)
        if obj.postal_code:   parts.append(obj.postal_code)
        if obj.country:       parts.append(obj.country)
        return ', '.join(filter(None, parts))

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        subtotal   = sum(item['product'].price * item['quantity'] for item in items_data)
        shipping   = 5.99 if subtotal < 50 else 0
        order      = Order.objects.create(
            **validated_data,
            subtotal=subtotal,
            shipping_cost=shipping,
            total=subtotal + shipping,
        )
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
        return order


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)
    product    = serializers.SerializerMethodField()

    class Meta:
        model  = CartItem
        fields = ['id', 'product_id', 'product', 'quantity']

    def get_product(self, obj):
        p = obj.product

        # ── resolve image URL ──────────────────────────────────────────────
        request = self.context.get('request')
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

            # ── Multilingual fields ────────────────────────────────────────
            'name_fr':           getattr(p, 'name_fr', None),
            'name_ar':           getattr(p, 'name_ar', None),
            'description_fr':    getattr(p, 'description_fr', None),
            'description_ar':    getattr(p, 'description_ar', None),
            'badge_fr':          getattr(p, 'badge_fr', None),
            'badge_ar':          getattr(p, 'badge_ar', None),
            # ──────────────────────────────────────────────────────────────

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


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model  = Cart
        fields = ['id', 'items', 'updated_at']