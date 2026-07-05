from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.models import Company, Profile

User = get_user_model()

class CompanySerializer(serializers.ModelSerializer):
    verification_status = serializers.SerializerMethodField()

    class Meta:
        model = Company
        exclude = ['user']

    def get_verification_status(self, obj):
        if hasattr(obj, 'verification_request'):
            return obj.verification_request.status
        return None


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        exclude = ['user']


class UserSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    profile = ProfileSerializer(read_only=True)
    user_type = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'photo', 'personal_bill', 
            'balance', 'is_staff', 'user_type', 'company', 'profile'
        ]
        read_only_fields = ['id', 'personal_bill', 'balance', 'is_staff']

    def get_user_type(self, obj):
        if hasattr(obj, 'company'):
            return 'employer'
        elif hasattr(obj, 'profile'):
            return 'worker'
        return 'admin'


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    user_type = serializers.ChoiceField(choices=['employer', 'worker'])
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    recaptcha_token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    invite_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def create(self, validated_data):
        user_type = validated_data.pop('user_type')
        password = validated_data.pop('password')
        phone = validated_data.pop('phone', '')
        invite_token = validated_data.pop('invite_token', None)
        validated_data.pop('recaptcha_token', None)
        
        # 1. Create User
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=password,
            activated=True, # TEMPORARILY DISABLED EMAIL VERIFICATION
            role='employers' if user_type == 'employer' else 'workers'
        )
        
        # Generate unique personal bill
        user.generate_personal_bill()
        user.save()

        # 2. Create profile based on type or handle invite
        if invite_token:
            from apps.users.models import CompanyEmployee
            try:
                emp = CompanyEmployee.objects.get(invite_token=invite_token, status='pending')
                emp.user = user
                emp.status = 'active'
                emp.invite_token = None
                emp.save()
            except CompanyEmployee.DoesNotExist:
                pass
        elif user_type == 'employer':
            Company.objects.create(user=user, title=validated_data['name'], phone=phone)
        else:
            Profile.objects.create(user=user, name=validated_data['name'], phone=phone)
            
        return user


from apps.vacancies.models import Vacancy
from apps.vacancies.serializers import ScopeSerializer, CitySerializer, VacancyListSerializer

class CompanyListSerializer(serializers.ModelSerializer):
    city_detail = CitySerializer(source='city', read_only=True)
    scope_detail = ScopeSerializer(source='scope', read_only=True)
    vacancy_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'title', 'logo', 'about_company', 'site', 'phone', 
            'fio', 'address', 'show_phone', 'show_fio', 'show_site', 
            'email', 'show_email',
            'is_leading', 'super_hr_type', 'city_detail', 'scope_detail', 'vacancy_count', 'created_at',
            'org_type', 'size', 'inn', 'is_verified'
        ]

    def get_vacancy_count(self, obj):
        if obj.user:
            return Vacancy.objects.filter(user=obj.user, draft=False, moderated=True, archive=False).count()
        return 0

class CompanyDetailSerializer(serializers.ModelSerializer):
    city_detail = CitySerializer(source='city', read_only=True)
    scope_detail = ScopeSerializer(source='scope', read_only=True)
    vacancies = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'title', 'logo', 'about_company', 'site', 'phone', 
            'fio', 'address', 'show_phone', 'show_fio', 'show_site', 
            'email', 'show_email',
            'is_leading', 'super_hr_type', 'city_detail', 'scope_detail', 
            'google_map_code', 'vacancies', 'created_at',
            'org_type', 'size', 'inn', 'is_verified'
        ]

    def get_vacancies(self, obj):
        if obj.user:
            vacs = Vacancy.objects.filter(user=obj.user, draft=False, moderated=True, archive=False)
            return VacancyListSerializer(vacs, many=True).data
        return []
