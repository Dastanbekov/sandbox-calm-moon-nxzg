from django.urls import path
from apps.vacancies.views import (
    VacancyListAPIView,
    VacancyDetailAPIView,
    VacancyCreateAPIView,
    VacancyUpdateAPIView,
    VacancyDestroyAPIView,
    VacancyPublishDraftAPIView,
    VacancyRespondAPIView,
    VacancyDeleteResponseAPIView,
    VacancyFavouriteAPIView,
    VacancyAnonimAPIView,
    VacancyComplainAPIView,
    BillingActionAPIView,
    LookupsAPIView,
    SavedVacancyListAPIView,
    VacancyCabinetAPIView,
    AICandidatesView,
    VacancyResponseStatusAPIView,
    VacancyEmployerResponsesAPIView,
    VacancyAnalyticsAPIView,
    AISuggestSkillsView,
    VacancyMarketStatsAPIView,
    AIGenerateDescriptionView
)

urlpatterns = [
    # Lookups
    path('lookups/', LookupsAPIView.as_view(), name='vacancies-lookups'),
    path('suggest-skills/', AISuggestSkillsView.as_view(), name='vacancies-suggest-skills'),
    path('generate-description/', AIGenerateDescriptionView.as_view(), name='vacancies-generate-description'),
    
    # Cabinet
    path('cabinet/', VacancyCabinetAPIView.as_view(), name='vacancies-cabinet'),
    path('analytics/', VacancyAnalyticsAPIView.as_view(), name='vacancies-analytics'),
    path('market-stats/', VacancyMarketStatsAPIView.as_view(), name='vacancies-market-stats'),
    
    # Public & Listing
    path('', VacancyListAPIView.as_view(), name='vacancies-list'),
    path('bookmarks/', SavedVacancyListAPIView.as_view(), name='vacancies-bookmarks'),
    path('<int:pk>/', VacancyDetailAPIView.as_view(), name='vacancies-detail'),
    path('<int:pk>/ai-candidates/', AICandidatesView.as_view(), name='vacancies-ai-candidates'),
    
    # Employer CRUD
    path('create/', VacancyCreateAPIView.as_view(), name='vacancies-create'),
    path('<int:pk>/update/', VacancyUpdateAPIView.as_view(), name='vacancies-update'),
    path('<int:pk>/destroy/', VacancyDestroyAPIView.as_view(), name='vacancies-destroy'),
    path('<int:pk>/publish/', VacancyPublishDraftAPIView.as_view(), name='vacancies-publish'),
    path('<int:pk>/anonim/', VacancyAnonimAPIView.as_view(), name='vacancies-anonim'),
    
    # Worker Actions
    path('<int:pk>/respond/', VacancyRespondAPIView.as_view(), name='vacancies-respond'),
    path('responses/', VacancyEmployerResponsesAPIView.as_view(), name='vacancies-responses-list'),
    path('responses/<int:pk>/status/', VacancyResponseStatusAPIView.as_view(), name='vacancies-response-status'),
    path('<int:pk>/unrespond/', VacancyDeleteResponseAPIView.as_view(), name='vacancies-unrespond'),
    path('<int:pk>/favourite/', VacancyFavouriteAPIView.as_view(), name='vacancies-favourite'),
    path('<int:pk>/complain/', VacancyComplainAPIView.as_view(), name='vacancies-complain'),
    
    # Billing Actions
    path('<int:pk>/billing/<str:action>/', BillingActionAPIView.as_view(), name='vacancies-billing'),
]
