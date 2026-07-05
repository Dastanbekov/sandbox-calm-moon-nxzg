from django.urls import path
from apps.billing.views import PayboxInitAPIView, PayboxResultAPIView, BillingHistoryAPIView

urlpatterns = [
    path('paybox/init/', PayboxInitAPIView.as_view(), name='paybox-init'),
    path('paybox/result/', PayboxResultAPIView.as_view(), name='paybox-result'),
    path('history/', BillingHistoryAPIView.as_view(), name='billing-history'),
]
