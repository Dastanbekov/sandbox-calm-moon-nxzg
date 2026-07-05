from django.contrib import admin
from .models import Vacancy, VacancyResponse, Currency

@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ('id', 'position', 'user', 'wages_from', 'wages_to', 'moderated', 'draft', 'archive', 'created_at')
    list_filter = ('moderated', 'draft', 'archive', 'is_hot')
    search_fields = ('position', 'user__email')
    list_editable = ('moderated', 'draft', 'archive')
    date_hierarchy = 'created_at'

@admin.register(VacancyResponse)
class VacancyResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'vacancy', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('vacancy__position', 'user__email')
    date_hierarchy = 'created_at'

@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'slug', 'active', 'order')
    search_fields = ('title', 'slug')
    list_editable = ('active', 'order')
