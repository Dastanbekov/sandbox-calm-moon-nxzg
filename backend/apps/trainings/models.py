"""
Trainings app models — точная миграция с employment-old.
Таблицы: training_categories, trainings, training_responses
"""
from django.db import models
from django.conf import settings


class TrainingCategory(models.Model):
    """Категория курса/тренинга. Таблица: training_categories"""
    title    = models.CharField(max_length=255)
    slug     = models.CharField(max_length=255, null=True, blank=True)
    active   = models.BooleanField(default=True)
    order    = models.IntegerField(default=0)
    location = models.IntegerField(default=0)  # позиция расположения в меню

    class Meta:
        db_table = 'training_categories'
        verbose_name_plural = 'Training Categories'
        ordering = ['order']

    def __str__(self):
        return self.title


class Training(models.Model):
    """
    Курс/тренинг работодателя. Таблица: trainings.
    Точно соответствует таблице из employment-old (включая scope, language_id).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trainings'
    )
    category = models.ForeignKey(
        TrainingCategory,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='trainings'
    )
    scope = models.ForeignKey(
        'vacancies.Scope',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='trainings'
    )
    language = models.ForeignKey(
        'resumes.Language',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='trainings'
    )

    title       = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    image       = models.CharField(max_length=255, null=True, blank=True)
    location    = models.CharField(max_length=255, null=True, blank=True)
    dates       = models.CharField(max_length=255, null=True, blank=True)
    price       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    contacts    = models.TextField(null=True, blank=True)
    slug        = models.CharField(max_length=255, null=True, blank=True)

    moderated  = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trainings'

    def __str__(self):
        return self.title


class TrainingResponse(models.Model):
    """
    Заявка на участие в курсе/тренинге. Таблица: training_responses.
    """
    user     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='training_responses'
    )
    training = models.ForeignKey(
        Training,
        on_delete=models.CASCADE,
        related_name='responses'
    )

    name    = models.CharField(max_length=255, null=True, blank=True)
    phone   = models.CharField(max_length=50, null=True, blank=True)
    email   = models.EmailField(null=True, blank=True)
    message = models.TextField(null=True, blank=True)

    contacted    = models.BooleanField(default=False)
    contacted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'training_responses'

    def __str__(self):
        return f'Заявка на {self.training.title} от {self.user.email}'
