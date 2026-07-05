from django.contrib import admin
from .models import Resume, WorkExperience, Institution, Language

class WorkExperienceInline(admin.TabularInline):
    model = WorkExperience
    extra = 0

class InstitutionInline(admin.TabularInline):
    model = Institution
    extra = 0

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'career_objective', 'user', 'salary', 'moderated', 'is_hidden', 'created_at')
    list_filter = ('moderated', 'is_hidden', 'draft', 'is_hot', 'is_fixed')
    search_fields = ('career_objective', 'user__email', 'phone', 'email')
    list_editable = ('moderated', 'is_hidden')
    date_hierarchy = 'created_at'
    inlines = [WorkExperienceInline, InstitutionInline]

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('title',)
    search_fields = ('title',)
