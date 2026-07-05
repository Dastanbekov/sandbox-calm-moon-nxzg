import requests
import json
from copy import deepcopy
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings
from apps.billing.models import BillingLog
from apps.resumes.models import ResumeResponse, Resume, SavedResume, Language

class ResumeService:
    @staticmethod
    def can_view_contacts(user, resume):
        """
        Verifies if the given user is authorized to view candidate's phone/email.
        Rules:
        - Candidate themselves
        - Admins/Staff
        - Company with active global get_contacts flag
        - Company with active SuperHR / SuperHR+ package
        - Company that sent an active job offer to this candidate
        - Company that purchased this candidate's contacts (checked via billing log)
        """
        if not user or user.is_anonymous:
            return False

        # Owner check
        if resume.user_id == user.id:
            return True

        # Staff check
        if user.is_staff or user.is_superuser:
            return True

        # Company check
        if hasattr(user, 'company'):
            company = user.company
            # Global access
            if company.get_contacts:
                return True
            # Super HR status
            if company.super_hr_type in ['superHr', 'superHrPlus']:
                if company.super_expired_at and company.super_expired_at > timezone.now():
                    return True
            # Job offer sent
            if ResumeResponse.objects.filter(user=user, resume=resume).exists():
                return True
            # Individual purchase check
            if BillingLog.objects.filter(
                user=user,
                billable_id=resume.id,
                billable_type='resumes.resume',
                description='buyContacts',
                active=True
            ).exists():
                return True

        return False

    @staticmethod
    @transaction.atomic
    def purchase_contact_access(user, resume):
        """
        Purchases access to candidate's contacts by deducting 150.00 KGS from company balance.
        """
        if not hasattr(user, 'company'):
            raise ValidationError("Только зарегистрированные работодатели могут приобретать контакты.")

        if ResumeService.can_view_contacts(user, resume):
            return True  # Already unlocked

        cost = 150.00
        if user.balance >= cost:
            user.balance -= cost
            user.save()

            # Log transaction
            BillingLog.objects.create(
                user=user,
                billable_id=resume.id,
                billable_type='resumes.resume',
                description='buyContacts',
                change=-cost,
                balance=user.balance,
                started_at=timezone.now(),
                active=True
            )
            return True
        else:
            raise ValidationError(f"Недостаточно средств на балансе. Требуется 150 KGS. Ваш баланс: {user.balance} KGS.")

class ResumeTranslationService:
    @staticmethod
    def translate_resume(resume: Resume, target_language_id: int) -> Resume:
        target_lang = Language.objects.get(id=target_language_id)
        
        text_fields = {
            'career_objective': resume.career_objective or '',
            'about_me': resume.about_me or '',
            'key_skills': resume.key_skills or '',
        }
        
        if any(text_fields.values()):
            translated_fields = ResumeTranslationService._call_deepseek_api(text_fields, target_lang.title)
        else:
            translated_fields = text_fields
            
        new_resume = deepcopy(resume)
        new_resume.pk = None
        new_resume.id = None
        
        new_resume.career_objective = translated_fields.get('career_objective', new_resume.career_objective)
        new_resume.about_me = translated_fields.get('about_me', new_resume.about_me)
        new_resume.key_skills = translated_fields.get('key_skills', new_resume.key_skills)
        
        new_resume.language = target_lang
        new_resume.is_ai_translated = True
        new_resume.save()
        
        # Clone experiences, institutions, extra_institutions, resume_languages
        for exp in resume.work_experiences.all():
            new_exp = deepcopy(exp)
            new_exp.pk = None
            new_exp.id = None
            new_exp.resume = new_resume
            new_exp.save()
            
        for edu in resume.institutions.all():
            new_edu = deepcopy(edu)
            new_edu.pk = None
            new_edu.id = None
            new_edu.resume = new_resume
            new_edu.save()
            
        for extra in resume.extra_institutions.all():
            new_extra = deepcopy(extra)
            new_extra.pk = None
            new_extra.id = None
            new_extra.resume = new_resume
            new_extra.save()
            
        for lang_item in resume.resume_languages.all():
            new_lang_item = deepcopy(lang_item)
            new_lang_item.pk = None
            new_lang_item.id = None
            new_lang_item.resume = new_resume
            new_lang_item.save()
            
        return new_resume

    @staticmethod
    def _call_deepseek_api(fields_dict: dict, target_lang_name: str) -> dict:
        api_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
        if not api_key:
            return {k: f"[TRANSLATED TO {target_lang_name}] {v}" for k, v in fields_dict.items() if v}
            
        system_prompt = f"You are a professional translator and HR expert. Translate the following resume fields into {target_lang_name}. Keep the professional tone intact. Return ONLY a valid JSON object where keys are the same as provided, and values are the translated strings."

        try:
            response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(fields_dict, ensure_ascii=False)}
                    ],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            content = data['choices'][0]['message']['content']
            return json.loads(content)
        except Exception as e:
            print(f"DeepSeek translation error: {e}")
            return {k: f"[{target_lang_name}] {v}" for k, v in fields_dict.items() if v}