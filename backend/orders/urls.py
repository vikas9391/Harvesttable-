from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet,
    CartView,
    CartItemView,
    CartGiftBoxView,
    CartGiftBoxDetailView,
    CartMergeView,
)

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    # ── Gift box endpoints (must come before cart/ to avoid router conflicts) ──
    path('cart/gift-boxes/<int:box_id>/', CartGiftBoxDetailView.as_view(), name='cart-gift-box-detail'),
    path('cart/gift-boxes/',              CartGiftBoxView.as_view(),        name='cart-gift-boxes'),

    # ── Regular cart endpoints ─────────────────────────────────────────────
    path('cart/items/<int:item_id>/',     CartItemView.as_view(),           name='cart-item'),
    path('cart/merge/',                   CartMergeView.as_view(),          name='cart-merge'),
    path('cart/',                         CartView.as_view(),               name='cart'),

    # ── Order router ───────────────────────────────────────────────────────
    path('', include(router.urls)),
]