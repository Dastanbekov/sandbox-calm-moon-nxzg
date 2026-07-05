"""
Vacancies app serializers — точная копия форматов вывода employment-old.
"""
from rest_framework import serializers

from apps.vacancies.models import Vacancy, Scope, Busyness, Education, Currency, VacancyResponse
from apps.users.models import Company
from apps.resumes.models import City


class ScopeSerializer(serializers.ModelSerializer):
    vacancies_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Scope
        fields = ['id', 'title', 'active', 'order', 'icon', 'vacancies_count']


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'title', 'active', 'order']


class BusynessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Busyness
        fields = ['id', 'title', 'active', 'order']


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'title', 'active', 'order']


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'title', 'active', 'order']


class VacancyListSerializer(serializers.ModelSerializer):
    """
    Лист вакансий (поиск, каталог). 
    В отличии от базового возвращает: scope, city, currency + company info.
    """
    company_title = serializers.SerializerMethodField()
    company_logo  = serializers.SerializerMethodField()
    company_is_verified = serializers.SerializerMethodField()
    
    city     = CitySerializer(read_only=True)
    scope    = ScopeSerializer(read_only=True)
    currency = CurrencySerializer(read_only=True)

    class Meta:
        model = Vacancy
        fields = [
            'id', 'position', 'wages_from', 'wages_to', 'currency',
            'city', 'scope', 'is_fixed', 'is_hot', 'in_priority', 'upped',
            'published_at', 'created_at', 'company_title', 'company_logo', 'company_is_verified',
            'draft', 'moderated', 'archive', 'checking', 'count_view', 'count_response', 'short_description'
        ]

    short_description = serializers.SerializerMethodField()

    def get_short_description(self, obj):
        import re
        html_content = ""
        if obj.overview: html_content += obj.overview + " "
        if obj.duties: html_content += obj.duties + " "
        if obj.qualification_requirements: html_content += obj.qualification_requirements + " "
        if obj.conditions: html_content += obj.conditions + " "
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', html_content)
        # Collapse multiple spaces
        text = re.sub(r'\s+', ' ', text).strip()
        return text if text else None

    def get_company_title(self, obj):
        if obj.anonim:
            return "Анонимный работодатель"
        return obj.user.company.title if hasattr(obj.user, 'company') else obj.user.name

    def get_company_logo(self, obj):
        if obj.anonim:
            return None
        if hasattr(obj.user, 'company') and obj.user.company.logo:
            logo = obj.user.company.logo
            if isinstance(logo, str):
                if logo.startswith('http'):
                    return logo
                return f'/media/{logo}' if not logo.startswith('/') else logo
            return logo.url if hasattr(logo, 'url') else str(logo)
        return None

    def get_company_is_verified(self, obj):
        if obj.anonim:
            return False
        return getattr(obj.user.company, 'is_verified', False) if hasattr(obj.user, 'company') else False


class VacancyDetailSerializer(VacancyListSerializer):
    """Для страницы просмотра одной вакансии (полные данные)."""
    busyness  = BusynessSerializer(read_only=True)
    education = EducationSerializer(read_only=True)

    company_size = serializers.SerializerMethodField()
    company_org_type = serializers.SerializerMethodField()
    company_about = serializers.SerializerMethodField()
    company_id = serializers.SerializerMethodField()
    contact_name = serializers.SerializerMethodField()
    contact_email = serializers.SerializerMethodField()
    contact_phone = serializers.SerializerMethodField()

    class Meta(VacancyListSerializer.Meta):
        fields = VacancyListSerializer.Meta.fields + [
            'place_of_work', 'education', 'busyness', 'work_graphite', 'experience',
            'overview', 'qualification_requirements', 'duties', 'conditions',
            'response_email_notifications', 'only_in_english', 'request_type',
            'form_from_file', 'link_online_form', 'language',
            'profession', 'key_skills', 'digital_skills', 'work_format',
            'vacancy_languages', 'salary_type', 'salary_net', 'bonuses',
            'deadline_date', 'deadline_time', 'email_notification_frequency',
            'application_languages', 'company_size', 'company_org_type', 'company_about',
            'company_id', 'contact_name', 'contact_email', 'contact_phone'
        ]

    def get_company_size(self, obj):
        if obj.anonim: return None
        if hasattr(obj.user, 'company'): return obj.user.company.get_size_display()
        return None

    def get_company_org_type(self, obj):
        if obj.anonim: return None
        if hasattr(obj.user, 'company'): return obj.user.company.get_org_type_display()
        return None

    def get_company_about(self, obj):
        if obj.anonim: return None
        if hasattr(obj.user, 'company'): return obj.user.company.about_company
        return None

    def get_company_id(self, obj):
        if obj.anonim: return None
        if hasattr(obj.user, 'company'): return obj.user.company.id
        return None

    def get_contact_name(self, obj):
        if hasattr(obj.user, 'company') and obj.user.company:
            comp = obj.user.company
            if comp.show_fio:
                return comp.fio or obj.user.name
            return None
        return obj.user.name if hasattr(obj.user, 'name') else None

    def get_contact_email(self, obj):
        if hasattr(obj.user, 'company') and obj.user.company:
            comp = obj.user.company
            if comp.show_email:
                return comp.email or obj.user.email
            return None
        return obj.user.email if hasattr(obj.user, 'email') else None

    def get_contact_phone(self, obj):
        if hasattr(obj.user, 'company') and obj.user.company:
            comp = obj.user.company
            if comp.show_phone:
                return comp.phone or obj.user.phone
            return None
        return obj.user.phone if hasattr(obj.user, 'phone') else None



class VacancyWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для создания/обновления (входные данные)."""
    class Meta:
        model = Vacancy
        fields = [
            'position', 'scope', 'place_of_work', 'city', 'education', 'busyness',
            'work_graphite', 'experience', 'wages_from', 'wages_to', 'currency',
            'overview', 'qualification_requirements', 'duties', 'conditions',
            'response_email_notifications', 'only_in_english', 'request_type',
            'form_from_file', 'link_online_form', 'language', 'draft', 'anonim',
            'profession', 'key_skills', 'digital_skills', 'work_format',
            'vacancy_languages', 'salary_type', 'salary_net', 'bonuses',
            'deadline_date', 'deadline_time', 'email_notification_frequency',
            'application_languages', 'posting_language'
        ]


class VacancyResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacancyResponse
        fields = '__all__'
