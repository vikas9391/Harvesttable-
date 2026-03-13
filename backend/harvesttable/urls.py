from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok", "service": "HarvestTable API"})

urlpatterns = [
    path('', health_check),                          # ← fixes the 404
    path('admin/', admin.site.urls),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/users/', include('users.urls')),
    path("api/settings/", include("admin_panel.urls")),
    path("api/chatbot/", include("chatbot.urls")),
    path('api/contact/', include('contact.urls', namespace='contact')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)