from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.billing.models import get_billing_rate, BillingLog
from apps.vacancies.models import Vacancy
from django.contrib.contenttypes.models import ContentType

class BillingService:
    @staticmethod
    @transaction.atomic
    def bill_action(user, action, billable_id, item_type='vacancy', duration=0):
        """
        Универсальный метод для покупок услуг/тарифов за счет баланса пользователя.
        Поддерживаемые action: superHr, superHrPlus, makeInPriority, makeFixed, makeHot, etc.
        """
        # Определяем стоимость
        cost = Decimal(get_billing_rate(action, item_type, duration))
        
        if cost <= 0:
            raise ValueError(f"Неизвестная услуга {action} (тип {item_type}, {duration} дн) или стоимость 0.")
            
        if user.balance < cost:
            raise ValueError(f"Недостаточно средств. Необходимо: {cost} KGS. У вас: {user.balance} KGS.")
            
        # Списываем баланс
        user.balance -= cost
        user.save(update_fields=['balance'])
        
        # Записываем лог
        content_type = None
        if item_type == 'vacancy' and billable_id:
            try:
                content_type = ContentType.objects.get_for_model(Vacancy)
            except Exception:
                pass
        
        log = BillingLog.objects.create(
            user=user,
            billable_id=billable_id if billable_id != 0 else None,
            content_type=content_type,
            billable_type=item_type,
            description=action,
            change=-cost,
            balance=user.balance,
            duration=duration,
            active=True,
            started_at=timezone.now()
        )
        
        # Применяем услугу в зависимости от экшена
        if action in ['superHr', 'superHrPlus']:
            if not hasattr(user, 'company') or not user.company:
                raise ValueError("Только работодатели могут покупать этот тариф.")
                
            company = user.company
            company.super_hr_type = action
            
            # Если пакет уже есть и еще не истек, продлеваем его
            current_expiry = company.super_expired_at
            if current_expiry and current_expiry > timezone.now():
                company.super_expired_at = current_expiry + timedelta(days=duration)
            else:
                company.super_expired_at = timezone.now() + timedelta(days=duration)
                
            company.save(update_fields=['super_hr_type', 'super_expired_at'])
            return f"Тариф {action} успешно активирован на {duration} дней!"
            
        elif action in ['makeInPriority', 'makeFixed', 'makeHot']:
            try:
                vacancy = Vacancy.objects.get(id=billable_id, owner=user)
                if action == 'makeInPriority':
                    vacancy.in_priority = True
                elif action == 'makeFixed':
                    vacancy.is_fixed = True
                elif action == 'makeHot':
                    vacancy.is_hot = True
                vacancy.save()
                return f"Услуга {action} успешно применена к вакансии."
            except Vacancy.DoesNotExist:
                raise ValueError("Вакансия не найдена или вы не являетесь ее владельцем.")
                
        # Дополнительные action можно добавлять здесь
        
        return f"Оплата в размере {cost} KGS прошла успешно."
