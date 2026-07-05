"""
Resumes app models — точная миграция с employment-old.
Таблицы: cities, citizenships, languages, language_proficiencies,
         resumes, work_experiences, institutions, extra_institutions,
         resume_languages, resume_responses, complain_resumes, resume_user (saved)
"""
from django.db import models
from django.conf import settings


# ─── Lookup / Справочники ────────────────────────────────────────────────────

class City(models.Model):
    """
    Город. Таблица: cities.
    used_for — для фильтрации (например, только для резюме или для вакансий).
    """
    title    = models.CharField(max_length=255)
    slug     = models.CharField(max_length=255, null=True, blank=True)
    slug_en  = models.CharField(max_length=255, null=True, blank=True)
    active   = models.BooleanField(default=True)
    order    = models.IntegerField(default=0)
    used_for = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'cities'
        verbose_name_plural = 'Cities'
        ordering = ['order', 'title']

    def __str__(self):
        return self.title


class Citizenship(models.Model):
    """Гражданство. Таблица: citizenships"""
    title  = models.CharField(max_length=255)
    slug   = models.CharField(max_length=255, null=True, blank=True)
    active = models.BooleanField(default=True)
    order  = models.IntegerField(default=0)

    class Meta:
        db_table = 'citizenships'
        ordering = ['order']

    def __str__(self):
        return self.title


class Language(models.Model):
    """Язык. Таблица: languages"""
    title  = models.CharField(max_length=255)
    slug   = models.CharField(max_length=255, null=True, blank=True)
    active = models.BooleanField(default=True)
    order  = models.IntegerField(default=0)

    class Meta:
        db_table = 'languages'
        ordering = ['order']

    def __str__(self):
        return self.title


class LanguageProficiency(models.Model):
    """Уровень владения языком. Таблица: language_proficiencies"""
    title  = models.CharField(max_length=255)
    slug   = models.CharField(max_length=255, null=True, blank=True)
    active = models.BooleanField(default=True)
    order  = models.IntegerField(default=0)

    class Meta:
        db_table = 'language_proficiencies'
        verbose_name_plural = 'Language Proficiencies'
        ordering = ['order']

    def __str__(self):
        return self.title


# ─── Resume ──────────────────────────────────────────────────────────────────

class Resume(models.Model):
    """
    Резюме соискателя. Точная копия таблицы resumes из employment-old.
    Жизненный цикл: draft → checking → moderated (+ is_hidden для скрытия).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resumes'
    )

    # Личные данные
    photo  = models.CharField(max_length=255, null=True, blank=True)
    name   = models.CharField(max_length=255, null=True, blank=True)
    sname  = models.CharField(max_length=255, null=True, blank=True)
    mname  = models.CharField(max_length=255, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone  = models.CharField(max_length=50, null=True, blank=True)

    citizenship = models.ForeignKey(
        Citizenship, on_delete=models.SET_NULL, null=True, blank=True
    )
    native_language = models.ForeignKey(
        Language, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='native_resumes'
    )

    # Профессиональные данные
    career_objective = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    city = models.ForeignKey(
        City, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='resumes'
    )
    salary    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency  = models.ForeignKey(
        'vacancies.Currency', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='resumes'
    )
    scope     = models.ForeignKey(
        'vacancies.Scope', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='resumes'
    )
    busyness  = models.ForeignKey(
        'vacancies.Busyness', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='resumes'
    )
    key_skills = models.TextField(null=True, blank=True)
    about_me   = models.TextField(null=True, blank=True)

    # Прикреплённые файлы (3 штуки, как в оригинале)
    filename1 = models.CharField(max_length=255, null=True, blank=True)
    file1     = models.CharField(max_length=255, null=True, blank=True)
    filename2 = models.CharField(max_length=255, null=True, blank=True)
    file2     = models.CharField(max_length=255, null=True, blank=True)
    filename3 = models.CharField(max_length=255, null=True, blank=True)
    file3     = models.CharField(max_length=255, null=True, blank=True)

    language = models.ForeignKey(
        Language, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='resumes'
    )
    
    # Новые поля для 5-шагового мастера резюме
    search_status = models.CharField(max_length=50, null=True, blank=True)
    ready_for_relocation = models.BooleanField(default=False)
    ready_for_trips = models.BooleanField(default=False)
    work_format = models.CharField(max_length=50, null=True, blank=True)
    schedule = models.CharField(max_length=50, null=True, blank=True)
    ready_to_start = models.CharField(max_length=50, null=True, blank=True)
    driver_license = models.BooleanField(default=False)
    driver_license_categories = models.CharField(max_length=255, null=True, blank=True)
    has_car = models.BooleanField(default=False)
    digital_skills = models.JSONField(default=list, blank=True)

    # ── Статусы жизненного цикла ─────────────────────────────────────────────
    moderated = models.BooleanField(default=False, db_index=True)
    draft     = models.BooleanField(default=False, db_index=True)
    is_hidden = models.BooleanField(default=False)
    is_ai_translated = models.BooleanField(default=False)

    # ── Платные функции ──────────────────────────────────────────────────────
    is_fixed    = models.BooleanField(default=False)
    is_hot      = models.BooleanField(default=False)
    in_priority = models.DateTimeField(null=True, blank=True)
    updated     = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resumes'
        indexes = [
            models.Index(fields=['moderated', 'draft']),
            models.Index(fields=['is_fixed', 'in_priority']),
        ]

    def __str__(self):
        return f'Резюме: {self.career_objective} ({self.sname or ""} {self.name or ""})'

    @property
    def full_name(self) -> str:
        parts = [self.sname, self.name, self.mname]
        return ' '.join(p for p in parts if p)


class WorkExperience(models.Model):
    """
    Опыт работы соискателя. Таблица: work_experiences.
    exp_is_working = NULL если работает по сей день.
    """
    resume = models.ForeignKey(
        Resume, on_delete=models.CASCADE, related_name='work_experiences'
    )
    company_name  = models.CharField(max_length=255, null=True, blank=True)
    position      = models.CharField(max_length=255, null=True, blank=True)
    exp_start_work = models.DateField(null=True, blank=True)
    exp_end_work   = models.DateField(null=True, blank=True)
    exp_is_working = models.BooleanField(null=True, blank=True)   # NULL = "по настоящее время"
    achievements   = models.TextField(null=True, blank=True)
    duties         = models.TextField(null=True, blank=True)
    
    level          = models.CharField(max_length=50, null=True, blank=True)
    company_type   = models.CharField(max_length=50, null=True, blank=True)
    company_size   = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'work_experiences'

    def __str__(self):
        return f'{self.company_name} — {self.position}'


class Institution(models.Model):
    """
    Образование (вуз, колледж). Таблица: institutions.
    Поля точно соответствуют старым миграциям.
    """
    resume = models.ForeignKey(
        Resume, on_delete=models.CASCADE, related_name='institutions'
    )
    education = models.ForeignKey(
        'vacancies.Education', on_delete=models.SET_NULL, null=True, blank=True
    )
    institution_name = models.CharField(max_length=255, null=True, blank=True)
    faculty          = models.CharField(max_length=255, null=True, blank=True)
    specialization   = models.CharField(max_length=255, null=True, blank=True)
    inst_start_study = models.CharField(max_length=10, null=True, blank=True)  # год или дата
    inst_end_study   = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        db_table = 'institutions'

    def __str__(self):
        return self.institution_name or ''


class ExtraInstitutions(models.Model):
    """
    Дополнительное образование (курсы, тренинги). Таблица: extra_institutions.
    """
    resume = models.ForeignKey(
        Resume, on_delete=models.CASCADE, related_name='extra_institutions'
    )
    extra_inst_title     = models.CharField(max_length=255, null=True, blank=True)
    extra_inst_organizer = models.CharField(max_length=255, null=True, blank=True)
    extra_inst_date      = models.CharField(max_length=50, null=True, blank=True)
    extra_inst_location  = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'extra_institutions'
        verbose_name_plural = 'Extra Institutions'

    def __str__(self):
        return self.extra_inst_title or ''


class ResumeLanguage(models.Model):
    """
    Языки соискателя + уровень владения. Таблица: resume_languages.
    """
    resume              = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='resume_languages')
    language            = models.ForeignKey(Language, on_delete=models.CASCADE)
    language_proficiency = models.ForeignKey(LanguageProficiency, on_delete=models.CASCADE)

    class Meta:
        db_table = 'resume_languages'
        unique_together = ('resume', 'language')

    def __str__(self):
        return f'{self.language.title}: {self.language_proficiency.title}'


class ResumeResponse(models.Model):
    """
    Предложение от работодателя соискателю (ответ на резюме).
    Таблица: resume_responses.
    """
    vacancy = models.ForeignKey(
        'vacancies.Vacancy', on_delete=models.CASCADE, related_name='resume_responses'
    )
    resume = models.ForeignKey(
        Resume, on_delete=models.CASCADE, related_name='responses'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='resume_responses'
    )
    viewed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resume_responses'
        unique_together = ('vacancy', 'resume', 'user')

    def __str__(self):
        return f'Предложение на {self.resume.career_objective}'


class ComplainResume(models.Model):
    """
    Жалоба на резюме. Таблица: complain_resumes.
    """
    resume = models.ForeignKey(
        Resume, on_delete=models.CASCADE, related_name='complaints'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='resume_complaints'
    )
    complain = models.ForeignKey(
        'vacancies.Complain', on_delete=models.SET_NULL, null=True, blank=True
    )
    description = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complain_resumes'
        unique_together = ('resume', 'user')

    def __str__(self):
        return f'Жалоба на резюме #{self.resume_id}'


class SavedResume(models.Model):
    """
    Сохранённые резюме работодателем. Таблица: resume_user.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='saved_resumes'
    )
    resume = models.ForeignKey(
        Resume, on_delete=models.CASCADE, related_name='saved_by_users'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'resume_user'
        unique_together = ('user', 'resume')

    def __str__(self):
        return f'{self.user.email} сохранил резюме #{self.resume_id}'
