# users/urls.py
from django.urls import path

from .views import (
    admin_customer_list,
    change_password,
    csrf_token,
    forgot_password,
    me,
    notifications,
    register,
    reset_password,
    user_login,
    user_logout,
)

app_name = 'users'

urlpatterns = [
    # Auth
    path('csrf/',               csrf_token,           name='csrf-token'),
    path('register/',           register,             name='register'),
    path('login/',              user_login,           name='login'),
    path('logout/',             user_logout,          name='logout'),

    # Profile  (GET / PATCH / DELETE)
    path('me/',                 me,                   name='me'),
    path('change-password/',    change_password,      name='change-password'),
    path('notifications/',      notifications,        name='notifications'),

    # Password reset
    path('forgot-password/',    forgot_password,      name='forgot-password'),
    path('reset-password/',     reset_password,       name='reset-password'),

    # Admin
    path('admin/customers/',    admin_customer_list,  name='admin-customers'),
]