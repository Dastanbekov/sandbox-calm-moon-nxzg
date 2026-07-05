from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from apps.users.serializers import UserSerializer, RegisterSerializer
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
import requests

User = get_user_model()

def set_refresh_cookie(response, refresh_token):
    """Sets the HTTPOnly refresh token cookie on the response."""
    cookie_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        max_age=cookie_max_age,
        expires=cookie_max_age,
        httponly=True,
        secure=not settings.DEBUG,  # True in production, False for local HTTP dev
        samesite='None', # Allows cross-domain cookies (Vercel -> Railway)
        path='/api/auth/'  # Limit cookie exposure to auth endpoints only
    )


class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        recaptcha_token = request.data.get('recaptcha_token')
        if not recaptcha_token:
            return Response({"detail": "Пожалуйста, подтвердите, что вы не робот."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify recaptcha
        secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY', 'dummy_secret')
        if secret_key != 'dummy_secret':
            res = requests.post('https://www.google.com/recaptcha/api/siteverify', data={
                'secret': secret_key,
                'response': recaptcha_token
            })
            result = res.json()
            if not result.get('success'):
                return Response({"detail": "Ошибка проверки reCAPTCHA."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            return Response({
                'detail': 'Регистрация успешна. Теперь вы можете войти в систему.'
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"detail": "Токен обязателен."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(activation_token=token)
            if user.is_active:
                return Response({"detail": "Аккаунт уже активирован."}, status=status.HTTP_400_BAD_REQUEST)
                
            user.is_active = True
            user.activation_token = None
            user.save()
            
            refresh = RefreshToken.for_user(user)
            serializer = UserSerializer(user)
            
            response = Response({
                'detail': "Email успешно подтвержден.",
                'access': str(refresh.access_token),
                'refresh': str(refresh), # Mobile fallback
                'user': serializer.data
            }, status=status.HTTP_200_OK)
            set_refresh_cookie(response, refresh)
            return response
        except User.DoesNotExist:
            return Response({"detail": "Недействительный или устаревший токен."}, status=status.HTTP_400_BAD_REQUEST)

class SubscriptionsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'scope_ids': []})

    def post(self, request):
        return Response({'status': 'ok'})


class ForgotPasswordView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # For security, we still return 200 to avoid email enumeration
            return Response({"detail": "Если email существует, ссылка отправлена."}, status=status.HTTP_200_OK)

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        # In a real application, send this token via email.
        # For now, we simulate success.
        print(f"--- PASSWORD RESET EMAIL TO {email} ---")
        print(f"Link: http://localhost:3000/auth/reset-password?email={email}&token={token}")
        print("-----------------------------------------")

        return Response({"detail": "Ссылка отправлена на ваш email."}, status=status.HTTP_200_OK)


class ResetPasswordView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        token = request.data.get('token')
        password = request.data.get('password')
        password_confirmation = request.data.get('password_confirmation')

        if not all([email, token, password, password_confirmation]):
            return Response({"detail": "Все поля обязательны."}, status=status.HTTP_400_BAD_REQUEST)

        if password != password_confirmation:
            return Response({"detail": "Пароли не совпадают."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Недействительный запрос."}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({"detail": "Недействительный или устаревший токен."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()

        return Response({"detail": "Пароль успешно изменен."}, status=status.HTTP_200_OK)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {"detail": "Email and password are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Неверный email или пароль."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        if not user.check_password(password):
            return Response(
                {"detail": "Неверный email или пароль."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        if not user.is_active:
            return Response(
                {"detail": "Учетная запись не активирована. Пожалуйста, проверьте вашу почту для подтверждения."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        
        response = Response({
            'user': user_data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_200_OK)
        
        # Set cookie for web client (fallback)
        set_refresh_cookie(response, refresh)
        
        return response


class TokenRefreshView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        # 1. Retrieve refresh token from cookie or request body (for mobile)
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is missing."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            # 2. Decode and rotate token
            token = RefreshToken(refresh_token)
            
            # Retrieve user
            user_id = token.payload.get('user_id')
            user = User.objects.get(id=user_id)
            
            # SimpleJWT Rotate setting handles rotation if set, let's manually re-issue 
            # to support cookie rotation and mobile payload sync properly
            new_refresh = RefreshToken.for_user(user)
            
            # Blacklist old token
            try:
                token.blacklist()
            except AttributeError:
                # If blacklist app is not setup/installed
                pass
                
            response = Response({
                'access': str(new_refresh.access_token)
            }, status=status.HTTP_200_OK)
            
            # 3. Set new cookie
            set_refresh_cookie(response, new_refresh)
            
            # Send new refresh in body for mobile
            response.data['refresh'] = str(new_refresh)
            
            return response
            
        except (TokenError, User.DoesNotExist) as e:
            # Clear invalid cookie on error
            response = Response(
                {"detail": "Token is invalid or expired."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie('refresh_token', path='/api/auth/')
            return response


class LogoutView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass
                
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        # Clear cookies
        response.delete_cookie('refresh_token', path='/api/auth/')
        return response


class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from apps.users.models import Company, CompanyEmployee
from apps.users.serializers import CompanyListSerializer, CompanyDetailSerializer

class CompanyEmployeesAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Check if user has company safely
        user_company = None
        try:
            user_company = request.user.company
        except Exception:
            pass

        if not user_company and not CompanyEmployee.objects.filter(user=request.user).exists():
            return Response({"detail": "Только работодатель может видеть сотрудников."}, status=status.HTTP_403_FORBIDDEN)
            
        if user_company:
            company = user_company
            is_owner = True
        else:
            emp = CompanyEmployee.objects.get(user=request.user)
            company = emp.company
            is_owner = False

        data = []
        
        owner_phone = company.phone
        try:
            if company.user and company.user.profile:
                owner_phone = company.user.profile.phone
        except Exception:
            pass

        data.append({
            "id": "owner",
            "user_id": company.user.id if company.user else None,
            "name": company.user.name if company.user else "Владелец",
            "email": company.user.email if company.user else "",
            "phone": owner_phone,
            "role": "main_hr",
            "status": "active"
        })

        employees = CompanyEmployee.objects.filter(company=company).select_related('user')
        for emp in employees:
            phone = None
            if emp.user:
                try:
                    phone = emp.user.profile.phone
                except Exception:
                    try:
                        phone = emp.user.company.phone
                    except Exception:
                        pass
                
            data.append({
                "id": emp.id,
                "user_id": emp.user.id if emp.user else None,
                "name": emp.user.name if emp.user else emp.name,
                "email": emp.user.email if emp.user else emp.email,
                "phone": phone,
                "role": emp.role,
                "status": emp.status
            })
            
        return Response({
            "is_owner": is_owner,
            "team": data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        if not hasattr(request.user, 'company'):
            return Response({"detail": "Только работодатель может добавлять сотрудников."}, status=status.HTTP_403_FORBIDDEN)
            
        email = request.data.get('email')
        name = request.data.get('name')
        role = request.data.get('role', 'hr_manager')
        
        if not email or not name:
            return Response({"detail": "Email и ФИО обязательны."}, status=status.HTTP_400_BAD_REQUEST)
            
        if CompanyEmployee.objects.filter(company=request.user.company, email=email).exists():
            return Response({"detail": "Этот пользователь уже приглашен или является сотрудником вашей компании."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            invited_user = User.objects.get(email=email)
            emp = CompanyEmployee.objects.create(
                company=request.user.company,
                user=invited_user,
                email=email,
                name=name,
                role=role,
                status='active'
            )
            return Response({
                "id": emp.id,
                "user_id": emp.user.id,
                "name": emp.user.name,
                "email": emp.user.email,
                "role": emp.role,
                "status": emp.status
            }, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            import secrets
            import urllib.parse
            token = secrets.token_urlsafe(32)
            emp = CompanyEmployee.objects.create(
                company=request.user.company,
                email=email,
                name=name,
                role=role,
                status='pending',
                invite_token=token
            )
            encoded_company = urllib.parse.quote(request.user.company.title or "Компания")
            print(f"--- INVITE EMAIL SENT TO {email} ---")
            print(f"Link: http://localhost:3000/auth/register?invite_token={token}&email={email}&company_name={encoded_company}")
            return Response({
                "id": emp.id,
                "user_id": None,
                "name": emp.name,
                "email": emp.email,
                "role": emp.role,
                "status": emp.status
            }, status=status.HTTP_201_CREATED)

    def patch(self, request):
        if not hasattr(request.user, 'company'):
            return Response({"detail": "Только основной владелец может редактировать сотрудников."}, status=status.HTTP_403_FORBIDDEN)
            
        employee_id = request.data.get('id')
        if not employee_id:
            return Response({"detail": "ID сотрудника обязателен."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            emp = CompanyEmployee.objects.get(id=employee_id, company=request.user.company)
        except CompanyEmployee.DoesNotExist:
            return Response({"detail": "Сотрудник не найден."}, status=status.HTTP_404_NOT_FOUND)
            
        name = request.data.get('name')
        phone = request.data.get('phone')
        role = request.data.get('role')

        if name:
            emp.name = name
            if emp.user:
                emp.user.name = name
                emp.user.save()
        
        if phone and emp.user and hasattr(emp.user, 'profile'):
            emp.user.profile.phone = phone
            emp.user.profile.save()
            
        if role:
            if role == 'main_hr':
                if not emp.user:
                    return Response({"detail": "Нельзя сделать основным сотрудника, который еще не подтвердил приглашение."}, status=status.HTTP_400_BAD_REQUEST)
                
                old_owner = request.user
                company = request.user.company
                
                CompanyEmployee.objects.create(
                    company=company,
                    user=old_owner,
                    name=old_owner.name,
                    email=old_owner.email,
                    role='hr_manager',
                    status='active'
                )
                
                company.user = emp.user
                company.save()
                
                emp.delete()
                return Response({"detail": "Права основного HR успешно переданы."}, status=status.HTTP_200_OK)
            else:
                emp.role = role
                
        emp.save()
        return Response({"detail": "Данные сотрудника обновлены."}, status=status.HTTP_200_OK)

    def delete(self, request):
        if not hasattr(request.user, 'company'):
            return Response({"detail": "Только работодатель может удалять сотрудников."}, status=status.HTTP_403_FORBIDDEN)
            
        employee_id = request.query_params.get('id')
        if not employee_id:
            return Response({"detail": "ID сотрудника обязателен."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            emp = CompanyEmployee.objects.get(id=employee_id, company=request.user.company)
            emp.delete()
            return Response({"detail": "Сотрудник удален."}, status=status.HTTP_200_OK)
        except CompanyEmployee.DoesNotExist:
            return Response({"detail": "Сотрудник не найден."}, status=status.HTTP_404_NOT_FOUND)

class CompanyPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

class CompanyListAPIView(views.APIView):
    """GET /api/companies/ — Список компаний с пагинацией и фильтрами."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Company.objects.filter(published=True).select_related('user', 'city', 'scope').order_by('-created_at')
        
        # Фильтрация
        query = request.query_params.get('query')
        city_id = request.query_params.get('city_id')
        scope_id = request.query_params.get('scope_id')
        with_vacancies = request.query_params.get('with_vacancies')

        if query:
            qs = qs.filter(title__icontains=query)
        if city_id:
            qs = qs.filter(city_id=city_id)
        if scope_id:
            qs = qs.filter(scope_id=scope_id)
        if with_vacancies == '1' or with_vacancies == 'true':
            from apps.vacancies.models import Vacancy
            users_with_vacancies = Vacancy.objects.filter(draft=False, moderated=True, archive=False).values_list('user_id', flat=True)
            qs = qs.filter(user_id__in=users_with_vacancies)

        paginator = CompanyPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CompanyListSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

class CompanyDetailAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        company = get_object_or_404(Company, pk=pk)
        serializer = CompanyDetailSerializer(company)
        return Response(serializer.data)

class CompanyMeAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        if not hasattr(request.user, 'company'):
            return Response({"detail": "User is not an employer"}, status=status.HTTP_403_FORBIDDEN)

        company = request.user.company

        # Handle logo file upload
        logo_file = request.FILES.get('logo')
        if logo_file:
            from django.core.files.storage import default_storage
            import os
            ext = os.path.splitext(logo_file.name)[1]
            filename = f'logos/company_{company.id}{ext}'
            # Delete old file if exists
            if company.logo and default_storage.exists(company.logo.lstrip('/')):
                try:
                    default_storage.delete(company.logo.lstrip('/'))
                except Exception:
                    pass
            path = default_storage.save(filename, logo_file)
            company.logo = default_storage.url(path)
            company.save(update_fields=['logo'])
            # Return immediately if only logo was uploaded
            if len(request.data) == 1 and 'logo' in request.data:
                from apps.users.serializers import CompanySerializer as CS
                return Response(CS(company).data)

        from apps.users.serializers import CompanySerializer
        serializer = CompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileMeAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        if not hasattr(request.user, 'profile'):
            if request.user.role == 'workers':
                from apps.users.models import Profile
                Profile.objects.create(user=request.user)
                request.user.refresh_from_db()
            else:
                return Response({"detail": "User is not a worker"}, status=status.HTTP_403_FORBIDDEN)
        
        # Handle photo upload
        photo = request.FILES.get('photo')
        if photo:
            from django.core.files.storage import default_storage
            path = default_storage.save(f'photos/{photo.name}', photo)
            request.user.photo = default_storage.url(path)
            request.user.save(update_fields=['photo'])
            if len(request.data) == 1 and 'photo' in request.data:
                from apps.users.serializers import ProfileSerializer as PS
                data = PS(request.user.profile).data
                data['user'] = {'photo': request.user.photo}
                return Response(data)

        from apps.users.serializers import ProfileSerializer
        serializer = ProfileSerializer(request.user.profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            data['user'] = {'photo': request.user.photo}
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class HeaderStatsAPIView(views.APIView):
    """
    GET /api/auth/header-stats/ — Счётчики для шапки сайта.
    Returns saved vacancies count, saved resumes count, and (future) unread messages.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.vacancies.models import SavedVacancy
        from apps.resumes.models import SavedResume

        saved_vacancies = SavedVacancy.objects.filter(user=request.user).count()
        saved_resumes = SavedResume.objects.filter(user=request.user).count() if request.user.is_employer else 0

        return Response({
            'saved_vacancies_count': saved_vacancies,
            'saved_resumes_count': saved_resumes,
            'unread_messages': 0,       # будет реализовано в Sprint 4 (Messaging)
            'unread_notifications': 0,  # будет реализовано в Sprint 4
        })


class ChangePasswordAPIView(views.APIView):
    """
    PATCH /api/auth/change-password/ — Смена пароля.
    Body: { current_password, new_password, new_password_confirm }
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm = request.data.get('new_password_confirm')

        if not all([current_password, new_password, confirm]):
            return Response({'detail': 'Все поля обязательны.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm:
            return Response({'detail': 'Новые пароли не совпадают.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'detail': 'Пароль должен быть не менее 8 символов.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(current_password):
            return Response({'detail': 'Неверный текущий пароль.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Пароль успешно изменён.'})


class DeactivateAccountAPIView(views.APIView):
    """
    DELETE /api/auth/account/ — Деактивация аккаунта.
    Sets is_active=False. User can contact support to restore.
    Body: { password } — required for confirmation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        password = request.data.get('password')
        if not password:
            return Response({'detail': 'Введите пароль для подтверждения.'}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(password):
            return Response({'detail': 'Неверный пароль.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.is_active = False
        user.save()
        return Response({'detail': 'Аккаунт деактивирован.'}, status=status.HTTP_200_OK)
