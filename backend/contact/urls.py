# contact/urls.py
from django.urls import path
from . import views

app_name = 'contact'

urlpatterns = [
    # ── Public ────────────────────────────────────────────────────────────
    # POST  /api/contact/submit/
    path('submit/', views.submit, name='submit'),

    # ── Admin ─────────────────────────────────────────────────────────────
    # GET   /api/contact/admin/messages/
    path('admin/messages/',              views.admin_list,          name='admin-list'),
    # GET   /api/contact/admin/messages/<pk>/
    path('admin/messages/<int:pk>/',     views.admin_detail,        name='admin-detail'),
    # POST  /api/contact/admin/messages/<pk>/status/
    path('admin/messages/<int:pk>/status/', views.admin_update_status, name='admin-status'),
    # DELETE /api/contact/admin/messages/<pk>/
    path('admin/messages/<int:pk>/delete/', views.admin_delete,     name='admin-delete'),
    # GET   /api/contact/admin/stats/
    path('admin/stats/',                 views.admin_stats,         name='admin-stats'),
]