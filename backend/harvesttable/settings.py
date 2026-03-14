# harvesttable/settings.py
from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
import dj_database_url
import cloudinary

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get('SECRET_KEY')

# Default to False in production — set DEBUG=True in .env for local dev only
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

ALLOWED_HOSTS = [
    "harvesttable-szli.onrender.com",
    "harvesttable.onrender.com",
    "localhost",
    "127.0.0.1",
]

_env_hosts = os.getenv("ALLOWED_HOSTS", "")
if _env_hosts:
    ALLOWED_HOSTS = [h.strip() for h in _env_hosts.split(",") if h.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',

    'corsheaders',
    'django_filters',

    "cloudinary",
    "cloudinary_storage",

    'products',
    'orders',
    'users',
    "admin_panel",
    "chatbot",
    'contact',
]

# -----------------------------------------------------------------------
# Cookie / Session — kept for Django admin only
# -----------------------------------------------------------------------
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE   = not DEBUG
CSRF_COOKIE_SECURE      = not DEBUG

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'harvesttable.urls'

EMAIL_BACKEND       = os.getenv("EMAIL_BACKEND")
EMAIL_HOST          = os.getenv("EMAIL_HOST")
EMAIL_PORT          = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS       = os.getenv("EMAIL_USE_TLS") == "True"
EMAIL_HOST_USER     = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL  = os.getenv("DEFAULT_FROM_EMAIL")

CONTACT_STAFF_EMAIL = 'support@harvesttable.com'
BRAND_NAME          = 'HarvestTable'
FRONTEND_URL        = os.getenv("FRONTEND_URL", "https://harvesttable.onrender.com")

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'harvesttable.wsgi.application'

DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL"),
        conn_max_age=600,
        ssl_require=True,
        engine='django.db.backends.postgresql',
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -----------------------------------------------------------------------
# HTTPS / Security
# -----------------------------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER        = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT            = False
    SECURE_HSTS_SECONDS            = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD            = True
    SECURE_CONTENT_TYPE_NOSNIFF    = True

# -----------------------------------------------------------------------
# CORS
# -----------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "https://harvesttable.onrender.com",
    "http://harvesttable.onrender.com",
    "https://harvesttable-szli.onrender.com",
    "http://harvesttable-szli.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

# -----------------------------------------------------------------------
# CSRF — only needed for Django admin
# -----------------------------------------------------------------------
CSRF_TRUSTED_ORIGINS = [
    "https://harvesttable.onrender.com",
    "http://harvesttable.onrender.com",
    "https://harvesttable-szli.onrender.com",
    "http://harvesttable-szli.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# -----------------------------------------------------------------------
# Django REST Framework — JWT only, no SessionAuthentication
# SessionAuthentication enforces CSRF on ALL requests including AllowAny
# endpoints, breaking cross-origin POST requests without a CSRF cookie.
# -----------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# -----------------------------------------------------------------------
# SimpleJWT
# -----------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES':        ('Bearer',),
    'AUTH_TOKEN_CLASSES':       ('rest_framework_simplejwt.tokens.AccessToken',),
}
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend"  # explicit default
)
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS") == "True"

# -----------------------------------------------------------------------
# Logging — surfaces errors in Render logs
# -----------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} — {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class':     'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level':    'INFO',
    },
    'loggers': {
        'contact': {
            'handlers':  ['console'],
            'level':     'DEBUG',
            'propagate': False,
        },
        'django': {
            'handlers':  ['console'],
            'level':     'WARNING',
            'propagate': False,
        },
    },
}