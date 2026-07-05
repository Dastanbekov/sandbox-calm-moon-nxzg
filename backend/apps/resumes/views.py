"""
Resumes app views — точная миграция с employment-old.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError

from apps.resumes.models import Resume, SavedResume, ComplainResume
from apps.vacancies.models import Complain
from apps.resumes.repositories import ResumeRepository
from apps.resumes.services import ResumeService
from apps.resumes.serializers import (
    ResumeSerializer,
    ResumeDetailSerializer,
    ResumeCreateUpdateSerializer
)
from apps.resumes.ai_parser import parse_resume_document
from apps.users.permissions import IsActiveAndVerified


class ResumePagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


class ResumeListAPIView(APIView):
    """GET /api/resumes/ — Каталог резюме с фильтрацией."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        filters = {
            'query':       request.query_params.get('query'),
            'city_id':     request.query_params.get('city_id'),
            'scope_id':    request.query_params.get('scope_id'),
            'busyness_id': request.query_params.get('busyness_id'),
        }
        
        qs = ResumeRepository.get_active_listings(filters)
        paginator = ResumePagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(
            ResumeSerializer(page, many=True, context={'request': request}).data
        )

    def post(self, request):
        if not request.user.is_authenticated or not request.user.is_worker:
            return Response({'detail': 'Только соискатели могут размещать резюме.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        # Map frontend fields to backend serializer fields
        mapping = {
            'city_id': 'city',
            'scope_id': 'scope',
            'busyness_id': 'busyness',
            'currency_id': 'currency',
            'wages': 'salary',
            'birth_date': 'date_of_birth',
            'about': 'about_me'
        }
        for f_key, b_key in mapping.items():
            if f_key in data and data[f_key]:
                val = data.pop(f_key)
                data[b_key] = val[0] if isinstance(val, list) else val

        serializer = ResumeCreateUpdateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            resume = serializer.save(user=request.user)
            return Response({'id': resume.id, 'message': 'Резюме успешно создано.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeDetailAPIView(APIView):
    """GET/PUT/DELETE /api/resumes/{id}/ — Детали/Обновление/Удаление резюме."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        
        # Только владельцы или если отмодерировано и не скрыто
        if resume.user_id != request.user.id:
            if not resume.moderated or resume.is_hidden or resume.draft:
                return Response({'detail': 'Резюме не найдено или скрыто.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ResumeDetailSerializer(resume, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        serializer = ResumeCreateUpdateSerializer(resume, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        updated_resume = serializer.save()
        ResumeRepository.save_nested_relations(
            updated_resume,
            work_experiences_data=serializer.validated_data.get('work_experiences'),
            institutions_data=serializer.validated_data.get('institutions'),
            extra_institutions_data=serializer.validated_data.get('extra_institutions'),
            resume_languages_data=serializer.validated_data.get('resume_languages')
        )
        
        out_serializer = ResumeDetailSerializer(updated_resume, context={'request': request})
        return Response(out_serializer.data)

    def delete(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        resume.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResumeCreateAPIView(APIView):
    """POST /api/resumes/ — Создание резюме."""
    permission_classes = [IsActiveAndVerified]

    def post(self, request):
        if not request.user.is_worker:
            return Response({'detail': 'Только соискатели могут создавать резюме.'},
                            status=status.HTTP_403_FORBIDDEN)
                            
        serializer = ResumeCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        work_experiences_data = serializer.validated_data.pop('work_experiences', [])
        institutions_data = serializer.validated_data.pop('institutions', [])
        extra_institutions_data = serializer.validated_data.pop('extra_institutions', [])
        resume_languages_data = serializer.validated_data.pop('resume_languages', [])
        
        resume = Resume(**serializer.validated_data)
        resume.user = request.user
        ResumeRepository.save(resume)
        
        ResumeRepository.save_nested_relations(
            resume,
            work_experiences_data=work_experiences_data,
            institutions_data=institutions_data,
            extra_institutions_data=extra_institutions_data,
            resume_languages_data=resume_languages_data
        )
        
        out_serializer = ResumeDetailSerializer(resume, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class ResumeParseAPIView(APIView):
    """POST /api/resumes/parse/ — Парсинг PDF-резюме с помощью AI."""
    permission_classes = [IsActiveAndVerified]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not request.user.is_worker:
            return Response({'detail': 'Только соискатели могут парсить резюме.'},
                            status=status.HTTP_403_FORBIDDEN)
        
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'Не найден файл.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not file_obj.name.lower().endswith('.pdf'):
            return Response({'detail': 'Поддерживаются только PDF файлы.'}, status=status.HTTP_400_BAD_REQUEST)
            
        data = parse_resume_document(file_obj)
        if "error" in data:
            return Response({'detail': data["error"]}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(data, status=status.HTTP_200_OK)


class ResumeCabinetAPIView(APIView):
    """GET /api/resumes/cabinet/ — Мои резюме."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = ResumeRepository.get_candidate_resumes(request.user.id)
        paginator = ResumePagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(
            ResumeSerializer(page, many=True, context={'request': request}).data
        )


class ResumePurchaseAPIView(APIView):
    """POST /api/resumes/{id}/purchase/ — Открыть контакты (списывает баланс/лимит)."""
    permission_classes = [IsActiveAndVerified]

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        try:
            ResumeService.purchase_contact_access(request.user, resume)
            serializer = ResumeDetailSerializer(resume, context={'request': request})
            return Response({
                "detail": "Контакты успешно приобретены.",
                "resume": serializer.data
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)


class ResumeBookmarkAPIView(APIView):
    """POST /api/resumes/{id}/bookmark/ — Сохранить/убрать резюме."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        saved, created = SavedResume.objects.get_or_create(user=request.user, resume=resume)
        if not created:
            saved.delete()
            return Response({"status": "removed"}, status=status.HTTP_200_OK)
        return Response({"status": "saved"}, status=status.HTTP_201_CREATED)


class ResumeBookmarkListAPIView(APIView):
    """GET /api/resumes/bookmarks/ — Список сохранённых резюме пользователя."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        saved_qs = SavedResume.objects.filter(
            user=request.user
        ).select_related('resume').order_by('-id')

        resumes = [s.resume for s in saved_qs if s.resume]

        paginator = ResumePagination()
        page = paginator.paginate_queryset(resumes, request)
        serializer = ResumeSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class ResumeComplainAPIView(APIView):
    """POST /api/resumes/{id}/complain/ — Пожаловаться на резюме."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk, moderated=True)
        complain_reason = get_object_or_404(Complain, pk=request.data.get('complain_id'), active=True)
        
        if ComplainResume.objects.filter(resume=resume, user=request.user).exists():
            return Response({'detail': 'Вы уже жаловались на это резюме.'},
                            status=status.HTTP_400_BAD_REQUEST)
                            
        ComplainResume.objects.create(
            user=request.user,
            resume=resume,
            complain=complain_reason,
            description=request.data.get('description', '')
        )
        return Response({"detail": "Жалоба успешно отправлена."}, status=status.HTTP_201_CREATED)

class ResumeTranslateAPIView(APIView):
    """POST /api/resumes/{id}/translate/ - Перевод резюме с ИИ"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_worker:
            return Response({'detail': 'Только соискатели могут переводить резюме.'}, status=status.HTTP_403_FORBIDDEN)
        
        target_language_id = request.data.get('target_language_id')
        if not target_language_id:
            return Response({'detail': 'target_language_id обязателен.'}, status=status.HTTP_400_BAD_REQUEST)
            
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        
        from apps.resumes.services import ResumeTranslationService
        try:
            new_resume = ResumeTranslationService.translate_resume(resume, target_language_id)
            return Response({'detail': 'Резюме переведено', 'resume_id': new_resume.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
