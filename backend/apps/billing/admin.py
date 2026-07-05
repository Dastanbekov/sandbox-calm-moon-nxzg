from django.contrib import admin
from .models import BillingLog, OnlinePayment, MobilnikPayment, Payment

@admin.register(BillingLog)
class BillingLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'description', 'change', 'created_at')
    search_fields = ('user__email', 'description')
    date_hierarchy = 'created_at'

@admin.register(OnlinePayment)
class OnlinePaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'created_at')
    search_fields = ('user__email',)
    date_hierarchy = 'created_at'

@admin.register(MobilnikPayment)
class MobilnikPaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'created_at')
    search_fields = ('user__email',)
    date_hierarchy = 'created_at'

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'created_at')
    search_fields = ('user__email',)
    date_hierarchy = 'created_at'
