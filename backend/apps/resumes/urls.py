from django.urls import path
from apps.resumes.views import (
    ResumeListAPIView,
    ResumeCreateAPIView,
    ResumeDetailAPIView,
    ResumeCabinetAPIView,
    ResumePurchaseAPIView,
    ResumeBookmarkAPIView,
    ResumeBookmarkListAPIView,
    ResumeComplainAPIView,
    ResumeParseAPIView,
    ResumeTranslateAPIView
)

urlpatterns = [
    path('', ResumeListAPIView.as_view(), name='resume-list'),
    path('create/', ResumeCreateAPIView.as_view(), name='resume-create'),
    path('parse/', ResumeParseAPIView.as_view(), name='resume-parse'),
    path('cabinet/', ResumeCabinetAPIView.as_view(), name='resume-cabinet'),
    path('bookmarks/', ResumeBookmarkListAPIView.as_view(), name='resume-bookmarks'),
    path('<int:pk>/', ResumeDetailAPIView.as_view(), name='resume-detail'),
    path('<int:pk>/translate/', ResumeTranslateAPIView.as_view(), name='resume-translate'),
    path('<int:pk>/buy/', ResumePurchaseAPIView.as_view(), name='resume-purchase'),
    path('<int:pk>/bookmark/', ResumeBookmarkAPIView.as_view(), name='resume-bookmark'),
    path('<int:pk>/complain/', ResumeComplainAPIView.as_view(), name='resume-complain'),
]
