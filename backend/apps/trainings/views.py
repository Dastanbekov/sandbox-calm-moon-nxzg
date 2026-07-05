from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.trainings.models import Training, TrainingCategory, TrainingResponse
from apps.trainings.serializers import (
    TrainingSerializer, TrainingWriteSerializer, TrainingCategorySerializer, TrainingResponseSerializer
)

class TrainingCategoryListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        categories = TrainingCategory.objects.filter(active=True)
        return Response(TrainingCategorySerializer(categories, many=True).data)

class TrainingListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        trainings = Training.objects.filter(moderated=True).order_by('-created_at')
        
        category_id = request.query_params.get('category_id')
        if category_id:
            trainings = trainings.filter(category_id=category_id)
            
        return Response(TrainingSerializer(trainings, many=True).data)

class TrainingDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, pk):
        training = get_object_or_404(Training, pk=pk, moderated=True)
        return Response(TrainingSerializer(training).data)

class TrainingCabinetAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_employer:
            return Response({"detail": "Only employers can create trainings."}, status=status.HTTP_403_FORBIDDEN)
        
        trainings = Training.objects.filter(user=request.user).order_by('-created_at')
        return Response(TrainingSerializer(trainings, many=True).data)

class TrainingCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_employer:
            return Response({"detail": "Only employers can create trainings."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = TrainingWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class TrainingRespondAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        if not request.user.is_worker:
            return Response({"detail": "Only workers can respond to trainings."}, status=status.HTTP_403_FORBIDDEN)
            
        training = get_object_or_404(Training, pk=pk, moderated=True)
        
        if TrainingResponse.objects.filter(training=training, user=request.user).exists():
            return Response({"detail": "You already applied to this training."}, status=status.HTTP_400_BAD_REQUEST)
            
        TrainingResponse.objects.create(
            user=request.user,
            training=training,
            name=request.data.get('name'),
            phone=request.data.get('phone'),
            email=request.data.get('email', request.user.email),
            message=request.data.get('message', '')
        )
        return Response({"detail": "Application sent successfully."}, status=status.HTTP_201_CREATED)
