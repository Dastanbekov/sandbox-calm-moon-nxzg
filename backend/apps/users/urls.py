from django.urls import path
from apps.users.views import (
    RegisterView, LoginView, TokenRefreshView, LogoutView, MeView, SubscriptionsView,
    ForgotPasswordView, ResetPasswordView, VerifyEmailView,
    HeaderStatsAPIView, ChangePasswordAPIView, DeactivateAccountAPIView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('subscriptions/', SubscriptionsView.as_view(), name='auth_subscriptions'),
    path('password/forgot/', ForgotPasswordView.as_view(), name='auth_password_forgot'),
    path('password/reset/', ResetPasswordView.as_view(), name='auth_password_reset'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('header-stats/', HeaderStatsAPIView.as_view(), name='auth-header-stats'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='auth-change-password'),
    path('account/', DeactivateAccountAPIView.as_view(), name='auth-account-delete'),
]
