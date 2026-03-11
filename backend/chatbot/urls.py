# chatbot/urls.py
from django.urls import path
from . import views

app_name = 'chatbot'

urlpatterns = [
    path('chat/',                            views.chat,                 name='chat'),
    path('history/',                         views.history,              name='history'),
    path('admin/sessions/',                  views.admin_sessions,       name='admin-sessions'),
    path('admin/sessions/<int:pk>/',         views.admin_session_detail, name='admin-session-detail'),
    path('admin/sessions/<int:pk>/resolve/', views.resolve_session,      name='resolve-session'),
    path('admin/stats/',                     views.admin_stats,          name='admin-stats'),
]