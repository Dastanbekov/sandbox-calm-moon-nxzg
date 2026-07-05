"""
Billing app models — точная миграция с employment-old.
Таблицы: billing_logs, online_payments (=mobilnik_payments), payments
Константы биллинга перенесены из Vars.php дословно.
"""
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


# ─── Реальные цены из Vars::getBillingVars() ─────────────────────────────────

BILLING_RATES = {
    'makeLeading': {
        'company': {30: 3000},
    },
    'getContacts': {
        'company': {3: 2400, 7: 4500, 15: 8000, 30: 14000},
    },
    'makeInPriority': {
        'vacancy': {0: 120},
    },
    'makeFixed': {
        'vacancy': {7: 650},
    },
    'makeHot': {
        'vacancy': {7: 650},
    },
    'publish': {
        'training': {30: 720},
    },
    'sendNotification': {
        'vacancy': {0: 150},
    },
    'superHr': {
        'company': {30: 6800, 92: 19890, 183: 38760, 365: 73440},
    },
    'superHrPlus': {
        'company': {30: 13600, 92: 39780, 183: 77520, 365: 146880},
    },
    'renewVacancy': {
        'vacancy': {30: 720},
    },
    'newVacancy': {
        'vacancy': {30: 720},
    },
}

# Маппинг описания → имя поля в БД (из Vars::getBillingColumnNameVars())
BILLING_COLUMN_MAP = {
    'makeInPriority':  'in_priority',
    'makeFixed':       'is_fixed',
    'makeHot':         'is_hot',
    'makeLeading':     'is_leading',
    'getContacts':     'get_contacts',
    'sendNotification':'send_notification',
    'superHr':         'super_hr_type',
    'superHrPlus':     'super_hr_type',
    'renewVacancy':    'published_at',
    'newVacancy':      'checking',
    'publish':         'moderated',
}


def get_billing_rate(description: str, item_type: str, duration: int) -> int:
    """
    Возвращает стоимость операции по её описанию, типу объекта и длительности.
    Аналог array_get(array_get(Vars::getBillingVars()->{$description}, $type), $duration)
    """
    type_rates = BILLING_RATES.get(description, {}).get(item_type, {})
    return type_rates.get(duration, 0)


# ─── BillingLog ───────────────────────────────────────────────────────────────

class BillingLog(models.Model):
    """
    Лог всех биллинговых операций. Таблица: billing_logs.
    Полиморфная связь через ContentType (замена Laravel morphTo).
    billable_type может быть: 'vacancy' | 'resume' | 'company' | 'training'
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='billing_logs'
    )

    # Полиморфная связь (замена Laravel morphMany)
    content_type   = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    billable_id    = models.PositiveIntegerField(null=True, blank=True)
    billable       = GenericForeignKey('content_type', 'billable_id')

    # Для совместимости с Laravel-форматом (хранится тип как строка)
    billable_type  = models.CharField(max_length=255, null=True, blank=True)

    description = models.CharField(max_length=100)   # makeFixed, makeHot, newVacancy…
    duration    = models.IntegerField(default=0)       # дней
    change      = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    balance     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    active     = models.BooleanField(default=False)
    expired    = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'billing_logs'
        indexes = [
            models.Index(fields=['billable_id', 'billable_type']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f'{self.user.email} | {self.description} | {self.change} KGS'


# ─── Online Payments (PayBox) ─────────────────────────────────────────────────

class OnlinePayment(models.Model):
    """
    Онлайн-платежи через PayBox. Таблица: online_payments.
    Поле billing_account_user_id — для случаев когда счёт оплачивает другой пользователь.
    """
    STATUS_PROGRESS = 'PAYMENT IN PROGRESS'
    STATUS_SUCCESS  = 'SUCCESS'
    STATUS_FAILURE  = 'FAILURE'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='online_payments'
    )
    type         = models.CharField(max_length=100)  # Банковские карты / Электронные кошельки / Платёжные терминалы
    personal_bill = models.CharField(max_length=50)
    order_id     = models.CharField(max_length=100, unique=True)
    payment_id   = models.CharField(max_length=255, null=True, blank=True)  # PayBox payment_id
    amount       = models.DecimalField(max_digits=10, decimal_places=2)
    status       = models.CharField(max_length=50, default=STATUS_PROGRESS)
    message      = models.TextField(null=True, blank=True)
    active       = models.BooleanField(default=False)

    # Для оплаты через чужой счёт (billing_account_user_id из старой миграции)
    billing_account_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='billed_payments'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'online_payments'

    def __str__(self):
        return f'Order {self.order_id}: {self.amount} KGS ({self.status})'


class MobilnikPayment(models.Model):
    """
    Платежи через терминалы Mobilnik. Таблица: mobilnik_payments.
    """
    query_id      = models.CharField(max_length=255, unique=True)
    user          = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='mobilnik_payments'
    )
    personal_bill = models.CharField(max_length=50)
    amount        = models.DecimalField(max_digits=10, decimal_places=2)

    billing_account_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='mobilnik_billed_payments'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mobilnik_payments'

    def __str__(self):
        return f'Mobilnik {self.query_id}: {self.amount} KGS'


class Payment(models.Model):
    """
    Банковские / ручные платежи. Таблица: payments.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    type          = models.CharField(max_length=100, null=True, blank=True)
    personal_bill = models.CharField(max_length=50, null=True, blank=True)
    order_id      = models.CharField(max_length=100, null=True, blank=True)
    amount        = models.DecimalField(max_digits=10, decimal_places=2)
    status        = models.CharField(max_length=50, null=True, blank=True)
    message       = models.TextField(null=True, blank=True)
    active        = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f'Payment {self.order_id}: {self.amount} KGS'
