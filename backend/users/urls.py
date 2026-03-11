# users/urls.py
from django.urls import path
from .views import (
    register, user_login, user_logout,
    me, change_password, csrf_token,
    admin_customer_list,
    forgot_password, reset_password,
)

urlpatterns = [
    path('register/',           register,             name='register'),
    path('login/',              user_login,            name='login'),
    path('logout/',             user_logout,           name='logout'),
    path('me/',                 me,                    name='me'),
    path('change-password/',    change_password,       name='change-password'),
    path('csrf/',               csrf_token,            name='csrf-token'),
    path('admin/customers/',    admin_customer_list,   name='admin-customers'),
    path('forgot-password/',    forgot_password,       name='forgot-password'),
    path('reset-password/',     reset_password,        name='reset-password'),
]