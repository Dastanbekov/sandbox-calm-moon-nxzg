import os
from pathlib import Path
import environ
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environ
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1']),
    CORS_ALLOWED_ORIGINS=(list, []),
    CSRF_TRUSTED_ORIGINS=(list, []),
)

# Read .env file
env_file = BASE_DIR / '.env'
if env_file.exists():
    environ.Env.read_env(str(env_file))

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env('ALLOWED_HOSTS')

# Application definition
INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'storages',
    'corsheaders',
    
    # Custom local apps (namespaced inside apps/)
    'apps.users',
    'apps.vacancies',
    'apps.resumes',
    'apps.billing',
    'apps.trainings',
    'apps.cms',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware must be positioned high up
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database Connection
import urllib.parse as urlparse

DATABASE_URL = env.str('DATABASE_URL', default='')

if DATABASE_URL:
    url = urlparse.urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port,
        }
    }
else:
    DB_ENGINE = env.str('DB_ENGINE', default='sqlite')
    if DB_ENGINE == 'sqlite':
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': env('DB_NAME', default='employment_db'),
                'USER': env('DB_USER', default='postgres'),
                'PASSWORD': env('DB_PASSWORD', default='postgres'),
                'HOST': env('DB_HOST', default='localhost'),
                'PORT': env('DB_PORT', default='5432'),
            }
        }


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Internationalization
LANGUAGE_CODE = 'ru-ru'  # Primary language of target CIS audience
TIME_ZONE = 'Asia/Bishkek'  # Local timezone for employment.kg
USE_I18N = True
USE_TZ = True

# Static & Media Files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Supabase S3 Storage (AWS Boto3)
AWS_ACCESS_KEY_ID = env('SUPABASE_S3_ACCESS_KEY', default=None)
AWS_SECRET_ACCESS_KEY = env('SUPABASE_S3_SECRET_KEY', default=None)
AWS_STORAGE_BUCKET_NAME = env('SUPABASE_S3_BUCKET_NAME', default='media')
AWS_S3_ENDPOINT_URL = env('SUPABASE_S3_ENDPOINT_URL', default=None)
AWS_S3_REGION_NAME = env('SUPABASE_S3_REGION', default='eu-central-1')

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_S3_ENDPOINT_URL:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = 'public-read'
    # Optional: use custom domain if provided, otherwise it uses the endpoint url
    # AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.supabase.co'
    # MEDIA_URL = f'https://{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/'


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

# SimpleJWT Authentication Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': env('JWT_SECRET_KEY'),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# CORS & CSRF Settings
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS')
CORS_ALLOWED_ORIGINS.extend([
    'https://employment-new.vercel.app',
    'http://localhost:3000'
])
CORS_ALLOW_CREDENTIALS = True

# AI / LLM Integration
GROQ_API_KEY = env('GROQ_API_KEY', default=None)  # Required for httpOnly JWT cookie delivery
DEEPSEEK_API_KEY = env('DEEPSEEK_API_KEY', default=None)
CSRF_TRUSTED_ORIGINS = env('CSRF_TRUSTED_ORIGINS')
CSRF_TRUSTED_ORIGINS.extend([
    'https://*.up.railway.app',
    'https://employment-new.vercel.app',
    'http://localhost:3000',
])

# Enterprise Security Headers (OWASP)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
REFERRER_POLICY = 'same-origin'

# Email (activation emails)
EMAIL_BACKEND = env.str('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = env.str('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env.str('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env.str('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env.str('DEFAULT_FROM_EMAIL', default='Employment.kg <noreply@employment.kg>')

# App-specific settings
FRONTEND_URL = env.str('FRONTEND_URL', default='http://localhost:3000')
IMAGES_UPLOAD_DIRECTORY = env.str('IMAGES_UPLOAD_DIRECTORY', default=str(BASE_DIR / 'media' / 'uploads'))
ACTIVATION_CODE_LIMIT = env.int('ACTIVATION_CODE_LIMIT', default=60)  # seconds

# PayBox Payment Gateway
PAYBOX_MERCHANT_ID  = env.str('PAYBOX_MERCHANT_ID', default='535498')
PAYBOX_SECRET_KEY   = env.str('PAYBOX_SECRET_KEY', default='')
PAYBOX_TESTING_MODE = env.int('PAYBOX_TESTING_MODE', default=1)

# Celery (optional — requires Redis)
CELERY_BROKER_URL        = env.str('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND    = env.str('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT    = ['json']
CELERY_TASK_SERIALIZER   = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE          = TIME_ZONE
