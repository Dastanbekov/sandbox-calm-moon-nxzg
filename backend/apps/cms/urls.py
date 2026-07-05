from django.urls import path
from apps.cms.views import (
    PageListAPIView, PageDetailAPIView, ArticleListAPIView, 
    ArticleDetailAPIView, BannerListAPIView, ConfigAPIView
)

urlpatterns = [
    path('pages/', PageListAPIView.as_view(), name='cms-pages'),
    path('pages/<str:slug>/', PageDetailAPIView.as_view(), name='cms-page-detail'),
    
    path('articles/', ArticleListAPIView.as_view(), name='cms-articles'),
    path('articles/<int:pk>/', ArticleDetailAPIView.as_view(), name='cms-article-detail'),
    
    path('banners/', BannerListAPIView.as_view(), name='cms-banners'),
    
    path('config/', ConfigAPIView.as_view(), name='cms-config'),
]
