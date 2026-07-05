from django.urls import path
from apps.trainings.views import (
    TrainingListAPIView, TrainingDetailAPIView, TrainingCategoryListAPIView,
    TrainingCabinetAPIView, TrainingCreateAPIView, TrainingRespondAPIView
)

urlpatterns = [
    path('categories/', TrainingCategoryListAPIView.as_view(), name='training-categories'),
    path('', TrainingListAPIView.as_view(), name='training-list'),
    path('<int:pk>/', TrainingDetailAPIView.as_view(), name='training-detail'),
    path('cabinet/', TrainingCabinetAPIView.as_view(), name='training-cabinet'),
    path('create/', TrainingCreateAPIView.as_view(), name='training-create'),
    path('<int:pk>/respond/', TrainingRespondAPIView.as_view(), name='training-respond'),
]
