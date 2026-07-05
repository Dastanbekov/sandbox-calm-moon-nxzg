from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from django.utils.html import format_html
from .models import User, Company, Profile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'name', 'role', 'is_staff', 'activated')
    list_filter = ('role', 'is_staff', 'activated', 'is_superuser')
    search_fields = ('email', 'name')
    ordering = ('-id',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'photo')}),
        ('Role', {'fields': ('role',)}),
        ('Permissions', {'fields': ('activated', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display  = ('title', 'inn', 'user', 'is_verified', 'is_leading', 'logo_preview')
    list_filter   = ('is_verified', 'is_leading', 'super_hr_type')
    search_fields = ('title', 'inn', 'user__email')
    list_editable = ('is_verified', 'is_leading')
    readonly_fields = ('logo_preview',)

    @admin.display(description='Логотип')
    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="height:40px;border-radius:6px;" />', obj.logo)
        return '—'


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display  = ('name', 'sname', 'user')
    search_fields = ('name', 'sname', 'user__email')
