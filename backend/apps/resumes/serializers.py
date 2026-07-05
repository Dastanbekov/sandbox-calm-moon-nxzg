from rest_framework import serializers
from apps.resumes.models import (
    Resume, WorkExperience, Institution, ExtraInstitutions, ResumeLanguage,
    Citizenship, Language, LanguageProficiency
)
from apps.vacancies.serializers import CitySerializer, ScopeSerializer, BusynessSerializer, CurrencySerializer, EducationSerializer
from apps.resumes.services import ResumeService

class CitizenshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citizenship
        fields = ['id', 'title', 'active']


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ['id', 'title', 'slug', 'active']


class LanguageProficiencySerializer(serializers.ModelSerializer):
    class Meta:
        model = LanguageProficiency
        fields = ['id', 'title', 'active']


class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = [
            'id', 'company_name', 'position', 'exp_start_work', 'exp_is_working',
            'exp_end_work', 'achievements', 'duties',
            'level', 'company_type', 'company_size'
        ]


class InstitutionSerializer(serializers.ModelSerializer):
    education_detail = EducationSerializer(source='education', read_only=True)

    class Meta:
        model = Institution
        fields = [
            'id', 'education', 'education_detail', 'institution_name', 'faculty',
            'specialization', 'inst_start_study', 'inst_end_study'
        ]


class ExtraInstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtraInstitutions
        fields = [
            'id', 'extra_inst_title', 'extra_inst_organizer', 'extra_inst_date', 'extra_inst_location'
        ]


class ResumeLanguageSerializer(serializers.ModelSerializer):
    language_detail = LanguageSerializer(source='language', read_only=True)
    proficiency_detail = LanguageProficiencySerializer(source='language_proficiency', read_only=True)

    class Meta:
        model = ResumeLanguage
        fields = [
            'id', 'language', 'language_detail', 'language_proficiency', 'proficiency_detail'
        ]


class ResumeSerializer(serializers.ModelSerializer):
    city_detail = CitySerializer(source='city', read_only=True)
    scope_detail = ScopeSerializer(source='scope', read_only=True)
    busyness_detail = BusynessSerializer(source='busyness', read_only=True)
    currency_detail = serializers.SerializerMethodField()
    has_contact_access = serializers.SerializerMethodField()
    
    name = serializers.SerializerMethodField()
    sname = serializers.SerializerMethodField()
    mname = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    salary = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    work_experiences = WorkExperienceSerializer(many=True, read_only=True)

    class Meta:
        model = Resume
        fields = [
            'id', 'career_objective', 'city', 'city_detail', 'scope', 'scope_detail',
            'busyness', 'busyness_detail', 'salary', 'currency', 'currency_detail',
            'date_of_birth', 'created_at', 'updated_at', 'has_contact_access',
            'is_fixed', 'is_hot', 'draft', 'moderated', 'is_hidden',
            
            # Новые поля 5-шагового мастера
            'search_status', 'ready_for_relocation', 'ready_for_trips',
            'work_format', 'schedule', 'ready_to_start',
            'driver_license', 'driver_license_categories', 'has_car', 'digital_skills',
            
            # Оригинальные поля
            'name', 'sname', 'mname', 'phone', 'about_me', 'key_skills', 'photo', 'user_id',
            'work_experiences'
        ]

    def get_has_contact_access(self, obj):
        # We cache this on the object to avoid calling the service multiple times per row
        if not hasattr(obj, '_has_contact_access'):
            request = self.context.get('request')
            if not request:
                obj._has_contact_access = False
            else:
                obj._has_contact_access = ResumeService.can_view_contacts(request.user, obj)
        return obj._has_contact_access

    def get_name(self, obj):
        if self.get_has_contact_access(obj):
            return obj.name
        return "Соискатель"

    def get_sname(self, obj):
        if self.get_has_contact_access(obj):
            return obj.sname
        return ""

    def get_mname(self, obj):
        if self.get_has_contact_access(obj):
            return obj.mname
        return ""

    def get_phone(self, obj):
        if self.get_has_contact_access(obj):
            return obj.phone
        return "[Скрыто]"

    def get_salary(self, obj):
        if self.get_has_contact_access(obj):
            return obj.salary
        return None

    def get_currency(self, obj):
        if self.get_has_contact_access(obj):
            return obj.currency_id
        return None

    def get_currency_detail(self, obj):
        if self.get_has_contact_access(obj) and obj.currency:
            return CurrencySerializer(obj.currency).data
        return None


class ResumeDetailSerializer(ResumeSerializer):
    citizenship_detail = CitizenshipSerializer(source='citizenship', read_only=True)
    native_language_detail = LanguageSerializer(source='native_language', read_only=True)
    work_experiences = WorkExperienceSerializer(many=True, read_only=True)
    institutions = InstitutionSerializer(many=True, read_only=True)
    extra_institutions = ExtraInstitutionSerializer(many=True, read_only=True)
    resume_languages = ResumeLanguageSerializer(many=True, read_only=True)
    
    email = serializers.SerializerMethodField()
    
    file1 = serializers.SerializerMethodField()
    file2 = serializers.SerializerMethodField()
    file3 = serializers.SerializerMethodField()
    filename1 = serializers.SerializerMethodField()
    filename2 = serializers.SerializerMethodField()
    filename3 = serializers.SerializerMethodField()

    class Meta(ResumeSerializer.Meta):
        fields = ResumeSerializer.Meta.fields + [
            'name', 'sname', 'mname', 'photo', 'phone', 'email', 'citizenship', 'citizenship_detail',
            'native_language', 'native_language_detail', 'key_skills', 'about_me',
            'work_experiences', 'institutions', 'extra_institutions', 'resume_languages',
            'filename1', 'file1', 'filename2', 'file2', 'filename3', 'file3'
        ]

    def get_email(self, obj):
        if self.get_has_contact_access(obj) and hasattr(obj, 'user') and obj.user:
            return obj.user.email
        return "[Скрыто]"

    def _get_file_url(self, file_field):
        if not file_field:
            return None
        if isinstance(file_field, str):
            if file_field.startswith('http'):
                return file_field
            url = f'/media/{file_field}' if not file_field.startswith('/') else file_field
        else:
            url = file_field.url if hasattr(file_field, 'url') else str(file_field)
        
        request = self.context.get('request')
        return request.build_absolute_uri(url) if request else url

    def get_file1(self, obj):
        if self.get_has_contact_access(obj) and obj.file1:
            return self._get_file_url(obj.file1)
        return None

    def get_file2(self, obj):
        if self.get_has_contact_access(obj) and obj.file2:
            return self._get_file_url(obj.file2)
        return None

    def get_file3(self, obj):
        if self.get_has_contact_access(obj) and obj.file3:
            return self._get_file_url(obj.file3)
        return None

    def get_filename1(self, obj):
        if self.get_has_contact_access(obj):
            return obj.filename1
        return None

    def get_filename2(self, obj):
        if self.get_has_contact_access(obj):
            return obj.filename2
        return None

    def get_filename3(self, obj):
        if self.get_has_contact_access(obj):
            return obj.filename3
        return None


class ResumeCreateUpdateSerializer(serializers.ModelSerializer):
    work_experiences = serializers.JSONField(required=False)
    institutions = serializers.JSONField(required=False)
    extra_institutions = serializers.JSONField(required=False)
    resume_languages = serializers.JSONField(required=False)
    
    photo = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    file1 = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    file2 = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    file3 = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Resume
        fields = [
            'career_objective', 'city', 'scope', 'busyness', 'salary', 'currency',
            'date_of_birth', 'phone', 'name', 'sname', 'mname', 'photo',
            'citizenship', 'native_language', 'language', 'key_skills', 'about_me',
            'filename1', 'file1', 'filename2', 'file2', 'filename3', 'file3',
            'draft', 'is_hidden',
            
            # Новые поля 5-шагового мастера
            'search_status', 'ready_for_relocation', 'ready_for_trips',
            'work_format', 'schedule', 'ready_to_start',
            'driver_license', 'driver_license_categories', 'has_car', 'digital_skills',
            
            'work_experiences', 'institutions', 'extra_institutions', 'resume_languages'
        ]

    def _process_base64(self, val, folder):
        if not val or not isinstance(val, str):
            return val
            
        val = val.strip()
        if not val.startswith("data:"):
            # If it's just a regular string/path, it shouldn't exceed 255 chars
            if len(val) > 255:
                raise serializers.ValidationError("Неверный формат файла или строка слишком длинная.")
            return val
            
        try:
            import base64
            import uuid
            import os
            from django.conf import settings
            from rest_framework.exceptions import ValidationError
            
            # Разделяем на MIME-тип и саму строку base64
            parts = val.split(';base64,')
            if len(parts) != 2:
                raise ValidationError("Неверный формат base64 строки (отсутствует ;base64,).")
                
            format_str, imgstr = parts
            ext = format_str.split('/')[-1]
            
            # Нормализация расширений
            if 'jpeg' in ext: ext = 'jpg'
            elif 'plain' in ext: ext = 'txt'
            elif 'msword' in ext: ext = 'doc'
            elif 'wordprocessingml' in ext: ext = 'docx'
            elif 'pdf' in ext: ext = 'pdf'
            elif 'spreadsheetml' in ext: ext = 'xlsx'
            elif 'excel' in ext: ext = 'xls'
            elif 'png' in ext: ext = 'png'
            else: ext = 'bin' # Фолбэк для неизвестных
            
            file_name = f"{uuid.uuid4().hex}.{ext}"
            media_path = os.path.join(settings.MEDIA_ROOT, folder)
            os.makedirs(media_path, exist_ok=True)
            
            with open(os.path.join(media_path, file_name), "wb") as f:
                f.write(base64.b64decode(imgstr))
                
            return f"{folder}/{file_name}"
        except Exception as e:
            raise serializers.ValidationError(f"Ошибка при сохранении файла: {str(e)}")

    def validate(self, attrs):
        if 'photo' in attrs:
            attrs['photo'] = self._process_base64(attrs['photo'], 'resumes/photos')
        if 'file1' in attrs:
            attrs['file1'] = self._process_base64(attrs['file1'], 'resumes/files')
        if 'file2' in attrs:
            attrs['file2'] = self._process_base64(attrs['file2'], 'resumes/files')
        if 'file3' in attrs:
            attrs['file3'] = self._process_base64(attrs['file3'], 'resumes/files')
            
        work_experiences = attrs.get('work_experiences')
        if isinstance(work_experiences, list):
            for we in work_experiences:
                if isinstance(we, dict):
                    start = we.get('exp_start_work')
                    if start and len(str(start)) == 7:
                        we['exp_start_work'] = f"{start}-01"
                    elif not start:
                        we.pop('exp_start_work', None)
                        
                    end = we.get('exp_end_work')
                    if end and len(str(end)) == 7:
                        we['exp_end_work'] = f"{end}-01"
                    elif not end:
                        we.pop('exp_end_work', None)
                        
        return super().validate(attrs)

    def create(self, validated_data):
        work_experiences = validated_data.pop('work_experiences', None)
        institutions = validated_data.pop('institutions', None)
        extra_institutions = validated_data.pop('extra_institutions', None)
        resume_languages = validated_data.pop('resume_languages', None)

        resume = super().create(validated_data)

        self._handle_nested_data(resume, work_experiences, institutions, extra_institutions, resume_languages)
        return resume

    def update(self, instance, validated_data):
        work_experiences = validated_data.pop('work_experiences', None)
        institutions = validated_data.pop('institutions', None)
        extra_institutions = validated_data.pop('extra_institutions', None)
        resume_languages = validated_data.pop('resume_languages', None)
        
        resume = super().update(instance, validated_data)

        self._handle_nested_data(
            resume, 
            work_experiences=work_experiences, 
            institutions=institutions, 
            extra_institutions=extra_institutions, 
            resume_languages=resume_languages,
            is_update=True
        )
        return resume

    def _handle_nested_data(self, resume, work_experiences=None, institutions=None, extra_institutions=None, resume_languages=None, is_update=False):
        import json
        
        if work_experiences is not None:
            if is_update:
                resume.work_experiences.all().delete()
            if isinstance(work_experiences, str):
                try:
                    work_experiences = json.loads(work_experiences)
                except Exception:
                    work_experiences = []
            if isinstance(work_experiences, list):
                for we in work_experiences:
                    if isinstance(we, dict):
                        start = we.get('exp_start_work')
                        if start and len(str(start)) == 7:
                            we['exp_start_work'] = f"{start}-01"
                        elif not start:
                            we.pop('exp_start_work', None)
                            
                        end = we.get('exp_end_work')
                        if end and len(str(end)) == 7:
                            we['exp_end_work'] = f"{end}-01"
                        elif not end:
                            we.pop('exp_end_work', None)
                            
                        if we.get('exp_is_working') == '':
                            we.pop('exp_is_working', None)
                        elif 'exp_is_working' in we:
                            we['exp_is_working'] = bool(we['exp_is_working'])

                        WorkExperience.objects.create(resume=resume, **we)

        if institutions is not None:
            if is_update:
                resume.institutions.all().delete()
            if isinstance(institutions, str):
                try:
                    institutions = json.loads(institutions)
                except Exception:
                    institutions = []
            if isinstance(institutions, list):
                for inst in institutions:
                    if isinstance(inst, dict):
                        education_id = inst.pop('education', None)
                        if education_id:
                            inst['education_id'] = education_id
                        yoe = inst.get('year_of_ending')
                        if not yoe:
                            inst.pop('year_of_ending', None)
                        Institution.objects.create(resume=resume, **inst)

        if extra_institutions is not None:
            if is_update:
                resume.extra_institutions.all().delete()
            if isinstance(extra_institutions, str):
                try:
                    extra_institutions = json.loads(extra_institutions)
                except Exception:
                    extra_institutions = []
            if isinstance(extra_institutions, list):
                for ei in extra_institutions:
                    if isinstance(ei, dict):
                        ExtraInstitutions.objects.create(resume=resume, **ei)

        if resume_languages is not None:
            if is_update:
                resume.resume_languages.all().delete()
            if isinstance(resume_languages, str):
                try:
                    resume_languages = json.loads(resume_languages)
                except Exception:
                    resume_languages = []
            if isinstance(resume_languages, list):
                for rl in resume_languages:
                    if isinstance(rl, dict):
                        lang_id = rl.pop('language', None)
                        prof_id = rl.pop('language_proficiency', None)
                        if lang_id:
                            rl['language_id'] = lang_id
                        if prof_id:
                            rl['language_proficiency_id'] = prof_id
                        ResumeLanguage.objects.create(resume=resume, **rl)

