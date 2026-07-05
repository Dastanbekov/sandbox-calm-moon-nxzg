from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.cms.models import Page, Article, Banner, Widget, Contact, MainBackground, PaymentInstruction
from apps.cms.serializers import (
    PageSerializer, ArticleSerializer, BannerSerializer, WidgetSerializer, 
    ContactSerializer, MainBackgroundSerializer, PaymentInstructionSerializer
)

class PageListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        pages = Page.objects.filter(active=True)
        return Response(PageSerializer(pages, many=True).data)

class PageDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, slug):
        page = get_object_or_404(Page, slug=slug, active=True)
        return Response(PageSerializer(page).data)

class ArticleListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        articles = Article.objects.filter(active=True)
        return Response(ArticleSerializer(articles, many=True).data)

class ArticleDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, pk):
        article = get_object_or_404(Article, pk=pk, active=True)
        return Response(ArticleSerializer(article).data)

class BannerListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        banners = Banner.objects.filter(active=True)
        return Response(BannerSerializer(banners, many=True).data)

class ConfigAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Возвращает общие настройки сайта (виджеты, контакты, фон)"""
        widgets = Widget.objects.all()
        contacts = Contact.objects.last()
        background = MainBackground.objects.last()
        instructions = PaymentInstruction.objects.all()
        
        return Response({
            'widgets': WidgetSerializer(widgets, many=True).data,
            'contacts': ContactSerializer(contacts).data if contacts else None,
            'background': MainBackgroundSerializer(background).data if background else None,
            'payment_instructions': PaymentInstructionSerializer(instructions, many=True).data
        })
