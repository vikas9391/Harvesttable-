from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, CartView, CartItemView, CartMergeView

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('cart/items/<int:item_id>/', CartItemView.as_view(),  name='cart-item'),
    path('cart/merge/',               CartMergeView.as_view(), name='cart-merge'),
    path('cart/',                     CartView.as_view(),      name='cart'),
    path('', include(router.urls)),
]