"""
Users app models — точная миграция с employment-old.
Таблицы: users, companies, profiles, saved_resume_user, saved_vacancy_user
"""
import secrets
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('activated', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Точная копия таблицы users из employment-old.
    Роли: employers | workers | admin (вместо zizaco/entrust role_user).
    """
    ROLE_EMPLOYERS = 'employers'
    ROLE_WORKERS = 'workers'
    ROLE_ADMIN = 'admin'
    ROLE_CHOICES = [
        (ROLE_EMPLOYERS, 'Работодатель'),
        (ROLE_WORKERS, 'Соискатель'),
        (ROLE_ADMIN, 'Администратор'),
    ]

    # Core
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)

    # Social auth (OAuth)
    photo = models.CharField(max_length=255, null=True, blank=True)
    uid = models.CharField(max_length=255, null=True, blank=True)
    network = models.CharField(max_length=255, null=True, blank=True)
    identity = models.CharField(max_length=255, null=True, blank=True)

    # Activation
    activated = models.BooleanField(default=False)
    activation_token = models.CharField(max_length=255, null=True, blank=True)
    activation_request_date = models.DateTimeField(null=True, blank=True)

    # Billing / balance
    personal_bill = models.CharField(max_length=50, unique=True, null=True, blank=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    # Notifications
    informed = models.BooleanField(default=False)
    informed_at = models.DateTimeField(null=True, blank=True)
    old_email = models.EmailField(null=True, blank=True)

    # Role (replaces zizaco/entrust)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, null=True, blank=True)

    # Django internals
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.name} ({self.email})'

    # --- Role helpers (matches old hasRoleFix) ---
    @property
    def is_employer(self):
        return self.role == self.ROLE_EMPLOYERS

    @property
    def is_worker(self):
        return self.role == self.ROLE_WORKERS

    @property
    def is_active(self):
        """Maps to legacy 'activated' field."""
        return self.activated

    # Legacy activated alias
    @is_active.setter
    def is_active(self, value):
        self.activated = value

    def generate_activation_token(self):
        self.activation_token = secrets.token_urlsafe(32)
        return self.activation_token

    def generate_personal_bill(self):
        """Generates a unique account number like the old generateCode() method."""
        self.personal_bill = str(secrets.randbelow(9_000_000_000) + 1_000_000_000)
        return self.personal_bill


class Company(models.Model):
    """
    Профиль работодателя. Точная копия таблицы companies.
    Содержит всю бизнес-логику из старого Company.php:
    isSuperHr(), vacancyIsFree(), getAccessContacts()
    """
    ORG_TYPE_CHOICES = [
        ('ОсОО', 'ОсОО'),
        ('ЗАО', 'ЗАО'),
        ('ОАО', 'ОАО'),
        ('ИП', 'ИП'),
        ('Представительство / Филиал', 'Представительство / Филиал'),
        ('НКО', 'НКО'),
        ('Международная организация', 'Международная организация'),
        ('Государственная организация', 'Государственная организация'),
    ]
    SIZE_CHOICES = [
        ('1-5', '1–5 сотрудников'),
        ('6-20', '6–20 сотрудников'),
        ('21-50', '21–50 сотрудников'),
        ('51-200', '51–200 сотрудников'),
        ('200+', 'Более 200 сотрудников'),
    ]

    user = models.OneToOneField(
        'users.User', on_delete=models.CASCADE, related_name='company'
    )
    logo = models.CharField(max_length=255, null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    scope = models.ForeignKey(
        'vacancies.Scope', on_delete=models.SET_NULL, null=True, blank=True
    )
    city = models.ForeignKey(
        'resumes.City', on_delete=models.SET_NULL, null=True, blank=True
    )
    address = models.CharField(max_length=255, null=True, blank=True)
    about_company = models.TextField(null=True, blank=True)
    google_map_code = models.TextField(null=True, blank=True)
    org_type = models.CharField(max_length=100, choices=ORG_TYPE_CHOICES, null=True, blank=True)
    size = models.CharField(max_length=50, choices=SIZE_CHOICES, null=True, blank=True)
    inn = models.CharField(max_length=50, null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    # Contact
    fio = models.CharField(max_length=255, null=True, blank=True)
    show_fio = models.BooleanField(default=False)
    phone = models.CharField(max_length=50, null=True, blank=True)
    show_phone = models.BooleanField(default=False)
    email = models.EmailField(null=True, blank=True)
    show_email = models.BooleanField(default=False)
    site = models.CharField(max_length=255, null=True, blank=True)
    show_site = models.BooleanField(default=False)

    # Status
    is_leading = models.BooleanField(default=False)
    get_contacts = models.BooleanField(default=False)
    published = models.BooleanField(default=True)
    personal_bill = models.CharField(max_length=50, null=True, blank=True)
    hide_info = models.BooleanField(default=False)

    # Premium subscription (SuperHR / SuperHR+)
    super_hr_type = models.CharField(max_length=20, null=True, blank=True)   # 'superHr' | 'superHrPlus'
    super_start_at = models.DateTimeField(null=True, blank=True)
    super_expired_at = models.DateTimeField(null=True, blank=True)

    # Free vacancy quota
    free_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'

    def __str__(self):
        return self.title or f'Компания пользователя {self.user.email}'

    # --- Бизнес-методы из старого Company.php ---

    def is_super_hr(self) -> bool:
        """Активный SuperHR или SuperHR+ пакет (любой из двух)."""
        if self.super_hr_type in ('superHr', 'superHrPlus'):
            if self.super_expired_at and self.super_expired_at > timezone.now():
                return True
        return False

    def is_super_hr_plus(self) -> bool:
        """Активный SuperHR+ пакет (только Plus)."""
        if self.super_hr_type == 'superHrPlus':
            if self.super_expired_at and self.super_expired_at > timezone.now():
                return True
        return False

    def get_super_hr_display_name(self) -> str:
        if self.is_super_hr_plus():
            return 'Super HR'
        return 'Pro HR'

    def vacancy_is_free(self) -> bool:
        """
        Компания может разместить вакансию бесплатно если:
        - free_date = None (первая вакансия), ИЛИ
        - активен SuperHR пакет
        """
        if self.free_date is None or self.is_super_hr():
            return True
        return False

    def get_access_contacts(self) -> bool:
        """Может ли работодатель смотреть контакты соискателей."""
        if self.get_contacts:
            return True
        return self.is_super_hr_plus()


class Profile(models.Model):
    """
    Профиль соискателя. Точная копия таблицы profiles из employment-old.
    """
    GENDER_CHOICES = [
        ('M', 'Мужчина'),
        ('F', 'Женщина'),
    ]
    SEARCH_STATUS_CHOICES = [
        ('active', 'Активно ищу работу'),
        ('considering', 'Рассматриваю предложения'),
        ('not_looking', 'Пока не ищу работу'),
    ]

    user = models.OneToOneField(
        'users.User', on_delete=models.CASCADE, related_name='profile'
    )
    name = models.CharField(max_length=100, null=True, blank=True)
    sname = models.CharField(max_length=100, null=True, blank=True)
    mname = models.CharField(max_length=100, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    show_phone = models.BooleanField(default=False)
    citizenship = models.ForeignKey(
        'resumes.Citizenship', on_delete=models.SET_NULL, null=True, blank=True
    )
    city = models.ForeignKey(
        'resumes.City', on_delete=models.SET_NULL, null=True, blank=True
    )
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    search_status = models.CharField(max_length=50, choices=SEARCH_STATUS_CHOICES, null=True, blank=True)
    personal_bill = models.CharField(max_length=50, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'

    def __str__(self):
        return self.full_name or f'Профиль пользователя {self.user.email}'

    @property
    def full_name(self) -> str:
        parts = [self.sname, self.name, self.mname]
        return ' '.join(p for p in parts if p)


class CompanyEmployee(models.Model):
    """
    Модель для хранения HR-сотрудников компании.
    """
    ROLE_MAIN_HR = 'main_hr'
    ROLE_HR_MANAGER = 'hr_manager'
    ROLE_RECRUITER = 'recruiter'

    ROLE_CHOICES = [
        (ROLE_MAIN_HR, 'Основной HR'),
        (ROLE_HR_MANAGER, 'HR-менеджер'),
        (ROLE_RECRUITER, 'Рекрутер'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Ожидает подтверждения'),
        ('active', 'Подтвержден'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='employer_companies', null=True, blank=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default=ROLE_HR_MANAGER)
    
    # Поля для приглашений (до регистрации)
    email = models.EmailField(null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    invite_token = models.CharField(max_length=64, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'company_employees'
        unique_together = ('company', 'user')

    def __str__(self):
        return f'{self.user.name} - {self.get_role_display()} в {self.company.title}'

