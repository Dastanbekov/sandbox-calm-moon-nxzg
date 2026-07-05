"""
Vacancies app repositories — репозиторий-слой запросов к БД.
Реализует все Eloquent-скоупы из старого Vacancy.php:
  scopeModeratedFixed, scopeModeratedHot, scopeSearched, scopeModerated
"""
from django.db.models import Q, F, Count
from django.utils import timezone

from apps.vacancies.models import Vacancy, Scope, Busyness, Education, Currency, Complain
from apps.resumes.models import City


class VacancyRepository:

    @staticmethod
    def base_qs():
        """Оптимизированный queryset — избегает N+1."""
        return Vacancy.objects.select_related(
            'user', 'user__company',
            'city', 'scope', 'busyness', 'education', 'currency', 'language'
        )

    @classmethod
    def get_moderated_fixed(cls, filters=None):
        """
        Аналог scopeModeratedFixed из старого Vacancy.php.
        moderated=true, draft=false, archive=false,
        сортировка: is_fixed → in_priority → upped → created_at
        """
        qs = cls.base_qs().filter(
            moderated=True, draft=False, archive=False
        )
        if filters:
            qs = cls._apply_search_filters(qs, filters)
        return qs.order_by('-is_fixed', '-in_priority', '-upped', '-created_at')

    @classmethod
    def get_moderated_hot(cls):
        """Вакансии дня (is_hot=True)."""
        return cls.base_qs().filter(moderated=True, draft=False, archive=False, is_hot=True)

    @classmethod
    def get_checking(cls):
        """На модерации: checking=true, moderated=false."""
        return cls.base_qs().filter(checking=True, moderated=False, archive=False)

    @classmethod
    def get_for_user(cls, user_id, tab=None):
        """
        Вакансии пользователя по вкладкам кабинета работодателя.
        tab: 'active' | 'checking' | 'drafts' | 'archive' | None (все)
        """
        qs = cls.base_qs().filter(user_id=user_id)
        if tab == 'active':
            return qs.filter(moderated=True, draft=False, archive=False)
        if tab == 'checking':
            return qs.filter(checking=True, moderated=False, archive=False)
        if tab == 'drafts':
            return qs.filter(draft=True, archive=False)
        if tab == 'archive':
            return qs.filter(archive=True)
        return qs.order_by('-created_at')

    @classmethod
    def get_by_id(cls, vacancy_id):
        return cls.base_qs().get(pk=vacancy_id)

    @classmethod
    def get_similar(cls, vacancy, limit=3):
        """Похожие вакансии: та же сфера + приоритет по городу."""
        from django.db.models import Case, When, Value, IntegerField
        return cls.base_qs().filter(
            scope_id=vacancy.scope_id, moderated=True, archive=False, draft=False
        ).exclude(pk=vacancy.pk).annotate(
            match_score=Case(
                When(city_id=vacancy.city_id, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        ).order_by('-match_score', '-created_at')[:limit]

    @classmethod
    def get_company_vacancies(cls, user_id, exclude_id, limit=3):
        return cls.base_qs().filter(
            user_id=user_id, moderated=True, archive=False, draft=False
        ).exclude(pk=exclude_id).order_by('-created_at')[:limit]

    @staticmethod
    def increment_view(vacancy_id):
        Vacancy.objects.filter(pk=vacancy_id).update(count_view=F('count_view') + 1)

    @staticmethod
    def increment_response(vacancy_id):
        Vacancy.objects.filter(pk=vacancy_id).update(count_response=F('count_response') + 1)

    @staticmethod
    def _apply_search_filters(qs, filters: dict):
        """Аналог scopeSearched из старого Vacancy.php."""
        if q := filters.get('query'):
            qs = qs.filter(Q(position__icontains=q) | Q(overview__icontains=q))
        if city_id := filters.get('city_id'):
            qs = qs.filter(city_id=city_id)
        if scope_id := filters.get('scope_id'):
            qs = qs.filter(scope_id=scope_id)
        if busyness_id := filters.get('busyness_id'):
            qs = qs.filter(busyness_id=busyness_id)
        return qs


class LookupRepository:
    """Справочные данные — используются в фильтрах и формах."""

    @staticmethod
    def get_scopes():
        return Scope.objects.filter(active=True).annotate(
            vacancies_count=Count('vacancies', filter=Q(vacancies__moderated=True, vacancies__archive=False, vacancies__draft=False))
        ).order_by('order', 'title')

    @staticmethod
    def get_cities():
        return City.objects.filter(active=True).order_by('order', 'title')

    @staticmethod
    def get_cities_for_resumes():
        """Только города без привязки к вакансиям (used_for=None)."""
        return City.objects.filter(active=True, used_for__isnull=True).order_by('order', 'title')

    @staticmethod
    def get_busynesses():
        return Busyness.objects.filter(active=True).order_by('order')

    @staticmethod
    def get_educations():
        return Education.objects.filter(active=True).order_by('order')

    @staticmethod
    def get_currencies():
        return Currency.objects.filter(active=True).order_by('order')

    @staticmethod
    def get_complains():
        return Complain.objects.filter(active=True)
