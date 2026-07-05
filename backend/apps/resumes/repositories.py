from django.db.models import Q, F
from django.db import transaction
from django.utils import timezone
from apps.resumes.models import (
    Resume, WorkExperience, Institution, ExtraInstitutions, ResumeLanguage,
    Citizenship, Language, LanguageProficiency
)

class ResumeRepository:
    @staticmethod
    def get_base_queryset():
        """Returns optimized queryset to avoid N+1 issues."""
        return Resume.objects.select_related(
            'user',
            'citizenship',
            'native_language',
            'city',
            'currency',
            'scope',
            'busyness',
            'language'
        ).prefetch_related(
            'work_experiences',
            'institutions',
            'institutions__education',
            'extra_institutions',
            'resume_languages',
            'resume_languages__language',
            'resume_languages__language_proficiency'
        )

    @classmethod
    def get_active_listings(cls, filters=None):
        """
        Retrieves active candidates' resumes.
        Only moderated, non-draft, non-hidden resumes.
        """
        queryset = cls.get_base_queryset().filter(
            moderated=True,
            draft=False,
            is_hidden=False
        )

        if filters:
            q_filter = Q()
            if filters.get('query'):
                keyword = filters['query']
                q_filter &= Q(career_objective__icontains=keyword) | Q(key_skills__icontains=keyword)
            if filters.get('city_id'):
                q_filter &= Q(city_id=filters['city_id'])
            if filters.get('scope_id'):
                q_filter &= Q(scope_id=filters['scope_id'])
            if filters.get('busyness_id'):
                q_filter &= Q(busyness_id=filters['busyness_id'])
            if filters.get('age_from'):
                # Handle age filtration if required
                pass
            
            queryset = queryset.filter(q_filter)

        # Ordering: fixed first, then priority, then updated, then latest
        return queryset.order_by('-is_fixed', '-in_priority', '-updated', '-updated_at')

    @classmethod
    def get_by_id(cls, resume_id):
        """Fetches a single resume by its ID."""
        return cls.get_base_queryset().get(pk=resume_id)

    @classmethod
    def get_candidate_resumes(cls, user_id):
        """Retrieves resumes belonging to a candidate user."""
        return cls.get_base_queryset().filter(user_id=user_id).order_by('-created_at')

    @staticmethod
    def save(resume):
        resume.save()
        return resume

    @classmethod
    @transaction.atomic
    def save_nested_relations(cls, resume, work_experiences_data=None, institutions_data=None, extra_institutions_data=None, resume_languages_data=None):
        """
        Atomically updates nested dynamic structures.
        Deletes old relations and recreates new ones.
        """
        if work_experiences_data is not None:
            # Delete old work experiences
            WorkExperience.objects.filter(resume=resume).delete()
            # Create new ones
            for item in work_experiences_data:
                WorkExperience.objects.create(resume=resume, **item)

        if institutions_data is not None:
            # Delete old education institutions
            Institution.objects.filter(resume=resume).delete()
            # Create new ones
            for item in institutions_data:
                Institution.objects.create(resume=resume, **item)

        if extra_institutions_data is not None:
            # Delete old extra institutions (trainings/courses)
            ExtraInstitutions.objects.filter(resume=resume).delete()
            # Create new ones
            for item in extra_institutions_data:
                ExtraInstitutions.objects.create(resume=resume, **item)

        if resume_languages_data is not None:
            # Delete old spoken languages
            ResumeLanguage.objects.filter(resume=resume).delete()
            # Create new ones
            for item in resume_languages_data:
                # Resolve language and proficiency
                ResumeLanguage.objects.create(
                    resume=resume,
                    language_id=item['language_id'],
                    language_proficiency_id=item['language_proficiency_id']
                )

        return resume


class ResumeLookupRepository:
    @staticmethod
    def get_active_citizenships():
        return Citizenship.objects.filter(active=True).order_by('title')

    @staticmethod
    def get_active_languages():
        return Language.objects.filter(active=True).order_by('title')

    @staticmethod
    def get_active_proficiencies():
        return LanguageProficiency.objects.filter(active=True).order_by('title')
