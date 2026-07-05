from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.users.views import (
    CompanyListAPIView, CompanyDetailAPIView, CompanyEmployeesAPIView,
    CompanyMeAPIView, ProfileMeAPIView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/vacancies/', include('apps.vacancies.urls')),
    path('api/resumes/', include('apps.resumes.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/trainings/', include('apps.trainings.urls')),
    path('api/cms/', include('apps.cms.urls')),
    path('api/companies/me/', CompanyMeAPIView.as_view(), name='company-me'),
    path('api/companies/', CompanyListAPIView.as_view(), name='company-list'),
    path('api/companies/employees/', CompanyEmployeesAPIView.as_view(), name='company-employees'),
    path('api/companies/<int:pk>/', CompanyDetailAPIView.as_view(), name='company-detail'),
    path('api/profiles/me/', ProfileMeAPIView.as_view(), name='profile-me'),
]

if settings.DEBUG or True:  # Serve media files even in basic production if no S3 is used
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

