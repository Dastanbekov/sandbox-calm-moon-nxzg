"""
Vacancies app models — точная миграция с employment-old.
Таблицы: scopes, busynesses, currencies, educations, vacancies,
         vacancy_responses, complains, complain_vacancies, resume_user (saved)
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


# ─── Lookup / Справочники ────────────────────────────────────────────────────

class Scope(models.Model):
    """Сфера деятельности. Таблица: scopes"""
    title = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, null=True, blank=True)
    slug_en = models.CharField(max_length=255, null=True, blank=True)
    icon = models.FileField(upload_to='scopes/icons/', null=True, blank=True)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'scopes'
        ordering = ['order', 'title']

    def __str__(self):
        return self.title


class Busyness(models.Model):
    """Занятость (полная, частичная, удалённая…). Таблица: busynesses"""
    title = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, null=True, blank=True)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'busynesses'
        verbose_name_plural = 'Busynesses'
        ordering = ['order']

    def __str__(self):
        return self.title


class Currency(models.Model):
    """Валюта. Таблица: currencies"""
    title = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, null=True, blank=True)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'currencies'
        verbose_name_plural = 'Currencies'
        ordering = ['order']

    def __str__(self):
        return self.title


class Education(models.Model):
    """Требования к образованию. Таблица: education"""
    title = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, null=True, blank=True)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'education'
        ordering = ['order']

    def __str__(self):
        return self.title


class Complain(models.Model):
    """
    Справочник причин жалоб. Таблица: complains
    Это LOOKUP-таблица, не путать с жалобами ComplainVacancy/ComplainResume.
    """
    title = models.CharField(max_length=255)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'complains'

    def __str__(self):
        return self.title


# ─── Vacancy ─────────────────────────────────────────────────────────────────

class Vacancy(models.Model):
    """
    Главная модель вакансии. Точная копия таблицы vacancies из employment-old.
    Жизненный цикл: draft → checking → moderated → archive
    Все методы из старого Vacancy.php перенесены.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vacancies'
    )
    position = models.CharField(max_length=255, db_index=True)
    scope = models.ForeignKey(
        Scope, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='vacancies'
    )
    place_of_work = models.CharField(max_length=255, null=True, blank=True)
    city = models.ForeignKey(
        'resumes.City', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='vacancies'
    )
    education = models.ForeignKey(
        Education, on_delete=models.SET_NULL, null=True, blank=True
    )
    busyness = models.ForeignKey(
        Busyness, on_delete=models.SET_NULL, null=True, blank=True
    )
    work_graphite = models.CharField(max_length=255, null=True, blank=True)
    experience = models.CharField(max_length=255, null=True, blank=True)

    wages_from = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    wages_to   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    currency = models.ForeignKey(
        Currency, on_delete=models.SET_NULL, null=True, blank=True
    )

    overview                    = models.TextField(null=True, blank=True)
    qualification_requirements  = models.TextField(null=True, blank=True)
    duties                      = models.TextField(null=True, blank=True)
    conditions                  = models.TextField(null=True, blank=True)

    response_email_notifications = models.BooleanField(default=True)
    only_in_english              = models.BooleanField(default=False)

    request_type    = models.CharField(max_length=50, null=True, blank=True)
    form_from_file  = models.CharField(max_length=255, null=True, blank=True)
    link_online_form = models.CharField(max_length=255, null=True, blank=True)

    language = models.ForeignKey(
        'resumes.Language', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='vacancies'
    )

    # ── Новые поля из макета ──────────────────────────────────────────────────
    profession = models.CharField(max_length=255, null=True, blank=True)
    key_skills = models.JSONField(default=list, blank=True)
    digital_skills = models.JSONField(default=list, blank=True)
    work_format = models.CharField(max_length=50, null=True, blank=True)
    vacancy_languages = models.JSONField(default=list, blank=True)
    
    salary_type = models.CharField(max_length=50, null=True, blank=True)
    salary_net = models.BooleanField(default=True)
    
    bonuses = models.JSONField(default=dict, blank=True)
    
    deadline_date = models.DateField(null=True, blank=True)
    deadline_time = models.TimeField(null=True, blank=True)
    
    email_notification_frequency = models.CharField(max_length=50, null=True, blank=True)
    application_languages = models.JSONField(default=list, blank=True)

    # ── Язык вакансии (ENG/РУС/КЫР) ──────────────────────────────────────────
    POSTING_LANGUAGE_CHOICES = (
        ('en', 'ENG'),
        ('ru', 'РУС'),
        ('ky', 'КЫР'),
    )
    posting_language = models.CharField(
        max_length=2,
        choices=POSTING_LANGUAGE_CHOICES,
        default='ru',
        verbose_name='Язык вакансии'
    )

    # ── Статусы жизненного цикла ────────────────────────────────────────────
    moderated       = models.BooleanField(default=False, db_index=True)
    draft           = models.BooleanField(default=False, db_index=True)
    archive         = models.BooleanField(default=False, db_index=True)
    checking        = models.BooleanField(default=False)
    waiting_payment = models.BooleanField(default=False)
    free            = models.BooleanField(default=False)

    # ── Платные функции ─────────────────────────────────────────────────────
    is_fixed          = models.BooleanField(default=False)
    is_hot            = models.BooleanField(default=False)
    in_priority       = models.DateTimeField(null=True, blank=True)
    upped             = models.BooleanField(default=False)
    send_notification = models.BooleanField(default=False)
    send_email        = models.BooleanField(default=False)
    anonim            = models.BooleanField(default=False)

    # ── Даты ────────────────────────────────────────────────────────────────
    published_at    = models.DateTimeField(null=True, blank=True)
    recreated_at    = models.DateTimeField(null=True, blank=True)
    user_updated_at = models.DateTimeField(null=True, blank=True)

    # ── Счётчики ────────────────────────────────────────────────────────────
    count_view     = models.IntegerField(default=0)
    count_response = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vacancies'
        indexes = [
            models.Index(fields=['moderated', 'draft', 'archive']),
            models.Index(fields=['is_fixed', 'in_priority']),
        ]

    def __str__(self):
        return self.position

    # ── Методы из старого Vacancy.php ───────────────────────────────────────

    def is_published(self) -> bool:
        """moderated=true, archive=false, draft=false"""
        return self.moderated and not self.archive and not self.draft

    def get_published_at(self):
        """Возвращает дату истечения вакансии (published_at или created_at+30)."""
        if self.published_at:
            return self.published_at
        return self.created_at + timedelta(days=30)

    def is_expired(self) -> bool:
        """
        Вакансия ещё активна (True) или просрочена (False).
        Логика из старого Vacancy.isExpired().
        """
        if self.expires_at is not None:
            return timezone.now() <= self.expires_at + timedelta(days=1)
        if not self.recreated_at:
            return timezone.now() <= self.created_at + timedelta(days=30)
        return timezone.now() <= self.recreated_at + timedelta(days=30)


class VacancyResponse(models.Model):
    """
    Отклик соискателя на вакансию. Таблица: vacancy_responses.
    Поддерживает 3 прикреплённых файла (как в старом проекте).
    """
    vacancy = models.ForeignKey(
        Vacancy, on_delete=models.CASCADE, related_name='responses'
    )
    resume = models.ForeignKey(
        'resumes.Resume', on_delete=models.CASCADE, related_name='vacancy_offers'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='vacancy_responses'
    )

    message = models.TextField(null=True, blank=True)

    filename1 = models.CharField(max_length=255, null=True, blank=True)
    file1     = models.CharField(max_length=255, null=True, blank=True)
    filename2 = models.CharField(max_length=255, null=True, blank=True)
    file2     = models.CharField(max_length=255, null=True, blank=True)
    filename3 = models.CharField(max_length=255, null=True, blank=True)
    file3     = models.CharField(max_length=255, null=True, blank=True)

    STATUS_CHOICES = (
        ('new', 'Новый'),
        ('reviewed', 'Рассмотрен'),
        ('invited', 'Приглашен на интервью'),
        ('interviewed', 'Прошел интервью'),
        ('rejected', 'Отказ'),
        ('hired', 'Нанят'),
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    viewed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vacancy_responses'
        unique_together = ('vacancy', 'resume', 'user')

    def __str__(self):
        return f'Отклик на {self.vacancy.position}'


class ComplainVacancy(models.Model):
    """
    Жалоба на вакансию. Таблица: complain_vacancies.
    """
    vacancy = models.ForeignKey(
        Vacancy, on_delete=models.CASCADE, related_name='complaints'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='vacancy_complaints'
    )
    complain = models.ForeignKey(
        Complain, on_delete=models.SET_NULL, null=True, blank=True
    )
    description = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complain_vacancies'
        unique_together = ('vacancy', 'user')

    def __str__(self):
        return f'Жалоба на {self.vacancy.position} от {self.user.email}'


class SavedVacancy(models.Model):
    """
    Сохранённые вакансии соискателя. Таблица: resume_user (Laravel many-to-many).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='saved_vacancies'
    )
    vacancy = models.ForeignKey(
        Vacancy, on_delete=models.CASCADE, related_name='saved_by_users'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vacancy_user'
        unique_together = ('user', 'vacancy')

    def __str__(self):
        return f'{self.user.email} → {self.vacancy.position}'
