"""
CMS app models — точная миграция с employment-old.
Таблицы: pages, articles, banners, widgets, contacts, metas,
         main_backgrounds, payment_instructions,
         subscribe_vacancies, mailing_emails, mailings
"""
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings


# ─── Pages / Страницы ────────────────────────────────────────────────────────

class Page(models.Model):
    """CMS-страница. Таблица: pages"""
    name     = models.CharField(max_length=255)
    slug     = models.CharField(max_length=255, unique=True, db_index=True)
    url      = models.CharField(max_length=255, null=True, blank=True)
    position = models.CharField(max_length=50, null=True, blank=True)
    order    = models.IntegerField(default=0)
    active   = models.BooleanField(default=True)
    content  = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pages'
        ordering = ['order']

    def __str__(self):
        return self.name


class Article(models.Model):
    """Статья/новость. Таблица: articles"""
    title   = models.CharField(max_length=255)
    image   = models.CharField(max_length=255, null=True, blank=True)
    url     = models.CharField(max_length=255, null=True, blank=True)
    content = models.TextField(null=True, blank=True)
    active  = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'articles'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Banner(models.Model):
    """Рекламный баннер. Таблица: banners"""
    title        = models.CharField(max_length=255, null=True, blank=True)
    image        = models.CharField(max_length=255, null=True, blank=True)
    image_mobile = models.CharField(max_length=255, null=True, blank=True)
    url          = models.CharField(max_length=255, null=True, blank=True)
    position_id  = models.IntegerField(default=0)
    frequency    = models.IntegerField(default=1)
    clicks       = models.IntegerField(default=0)
    active       = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'banners'

    def __str__(self):
        return self.title or f'Banner #{self.pk}'


class Widget(models.Model):
    """
    Настройки / виджеты сайта (key-value хранилище). Таблица: widgets.
    Используется в старом Vars::getAdminVars().
    """
    key   = models.CharField(max_length=255, unique=True)
    value = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'widgets'

    def __str__(self):
        return f'{self.key} = {self.value}'


class Contact(models.Model):
    """
    Контакты сайта. Таблица: contacts.
    """
    address      = models.CharField(max_length=255, null=True, blank=True)
    email        = models.EmailField(null=True, blank=True)
    phone        = models.CharField(max_length=50, null=True, blank=True)
    phone2       = models.CharField(max_length=50, null=True, blank=True)
    phone3       = models.CharField(max_length=50, null=True, blank=True)
    facebook_url = models.CharField(max_length=255, null=True, blank=True)
    twitter_url  = models.CharField(max_length=255, null=True, blank=True)
    instagram_url = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contacts'

    def __str__(self):
        return self.email or 'Contacts'


class Meta(models.Model):
    """
    SEO-метаданные страниц. Таблица: metas.
    Полиморфная связь с Page, Company, Vacancy и т.д. (metable_id / metable_type).
    """
    slug      = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    metatitle = models.CharField(max_length=500, null=True, blank=True)
    metadesc  = models.TextField(null=True, blank=True)
    metakeyw  = models.TextField(null=True, blank=True)

    # Полиморфная связь
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    metable_id   = models.PositiveIntegerField(null=True, blank=True)
    metable      = GenericForeignKey('content_type', 'metable_id')
    metable_type = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'metas'

    def __str__(self):
        return self.slug or self.metatitle or f'Meta #{self.pk}'


class MainBackground(models.Model):
    """Фоновое изображение главной страницы. Таблица: main_backgrounds"""
    image = models.CharField(max_length=255, null=True, blank=True)
    url   = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'main_backgrounds'

    def __str__(self):
        return f'Background: {self.image}'


class PaymentInstruction(models.Model):
    """Инструкции по оплате. Таблица: payment_instructions"""
    title   = models.CharField(max_length=255, null=True, blank=True)
    content = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_instructions'

    def __str__(self):
        return self.title or f'Instruction #{self.pk}'


# ─── Subscribe / Mailing ─────────────────────────────────────────────────────

class SubscribeVacancy(models.Model):
    """
    Подписка соискателя на вакансии по сфере деятельности.
    Таблица: subscribe_vacancies.
    """
    user  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vacancy_subscriptions'
    )
    scope = models.ForeignKey(
        'vacancies.Scope',
        on_delete=models.CASCADE,
        related_name='subscribers'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subscribe_vacancies'
        unique_together = ('user', 'scope')

    def __str__(self):
        return f'{self.user.email} → {self.scope.title}'


class MailingEmail(models.Model):
    """
    Email-адрес рассылки. Таблица: mailing_emails.
    user может быть NULL (внешний подписчик).
    """
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='mailing_emails'
    )
    email       = models.EmailField(db_index=True)
    subscribed  = models.BooleanField(default=True)
    last_title  = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mailing_emails'

    def __str__(self):
        return self.email


class Mailing(models.Model):
    """
    Рассылка. Таблица: mailings.
    """
    title        = models.CharField(max_length=255)
    description  = models.TextField(null=True, blank=True)
    sending_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mailings'

    def __str__(self):
        return self.title
