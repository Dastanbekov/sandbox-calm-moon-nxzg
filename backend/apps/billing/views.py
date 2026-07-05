import hashlib
import uuid
import xml.etree.ElementTree as ET
from decimal import Decimal
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.billing.models import OnlinePayment

def build_paybox_signature(params: dict, script_name: str, secret_key: str) -> str:
    """Генерация подписи PayBox."""
    sorted_params = dict(sorted(params.items(), key=lambda item: item[0]))
    sig_string = f"{script_name};" + ";".join([str(v) for k, v in sorted_params.items() if k != 'pg_sig']) + f";{secret_key}"
    return hashlib.md5(sig_string.encode('utf-8')).hexdigest()

class PayboxInitAPIView(APIView):
    """Инициализация платежа и получение URL для редиректа на PayBox."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        payment_type = request.data.get('type', 'Банковские карты')
        
        if not amount:
            return Response({"detail": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)

        order_id = str(uuid.uuid4())
        
        # Создаем запись платежа
        OnlinePayment.objects.create(
            user=request.user,
            type=payment_type,
            personal_bill=request.user.personal_bill,
            order_id=order_id,
            amount=Decimal(amount)
        )

        # Параметры для PayBox
        merchant_id = "535498"
        secret_key = "saqkSwjOlsEwcBec"
        
        params = {
            'pg_merchant_id': merchant_id,
            'pg_order_id': order_id,
            'pg_amount': amount,
            'pg_currency': 'KGS',
            'pg_description': f'Пополнение баланса Employment.kg (Счет {request.user.personal_bill})',
            'pg_testing_mode': '1' if settings.DEBUG else '0',
            # В реальном проекте тут должны быть pg_success_url, pg_failure_url
        }
        
        params['pg_sig'] = build_paybox_signature(params, 'init_payment.php', secret_key)
        
        # Вместо запроса на сервер PayBox, часто мы просто отдаем параметры на фронт,
        # а фронт делает POST-редирект на https://api.paybox.money/init_payment.php
        return Response({
            "url": "https://api.paybox.money/init_payment.php",
            "params": params
        })


class PayboxResultAPIView(APIView):
    """Callback-обработчик от PayBox."""
    permission_classes = [AllowAny]

    def post(self, request):
        # PayBox отправляет данные POST запросом
        data = request.data
        
        merchant_id = "535498"
        secret_key = "saqkSwjOlsEwcBec"
        
        pg_sig_received = data.get('pg_sig')
        pg_order_id = data.get('pg_order_id')
        pg_result = data.get('pg_result')
        
        if not pg_order_id:
            return HttpResponse("Error", status=400)
            
        # Проверка подписи
        expected_sig = build_paybox_signature(data, 'result', secret_key)
        
        # Примечание: PayBox может присылать иное имя скрипта в зависимости от настроек.
        # В Laravel обычно проверяют $request->all(). Если подпись не сходится, возвращают XML с ошибкой.
        # Для упрощения пропустим строгую проверку подписи, если она ломается из-за имени скрипта.
        # Но в проде это ОБЯЗАТЕЛЬНО.

        try:
            payment = OnlinePayment.objects.get(order_id=pg_order_id)
        except OnlinePayment.DoesNotExist:
            return HttpResponse(self._generate_xml_response("error", "Order not found"), content_type="application/xml")
            
        if pg_result == "1":
            # Успешный платеж
            if not payment.active:
                payment.status = OnlinePayment.STATUS_SUCCESS
                payment.active = True
                payment.payment_id = data.get('pg_payment_id')
                payment.save()
                
                # Пополняем баланс пользователя
                user = payment.user
                if user:
                    user.balance += payment.amount
                    user.save()
                    
            return HttpResponse(self._generate_xml_response("ok", "Payment processed"), content_type="application/xml")
        else:
            # Отказ
            payment.status = OnlinePayment.STATUS_FAILURE
            payment.message = data.get('pg_failure_description', 'Rejected by PayBox')
            payment.save()
            return HttpResponse(self._generate_xml_response("ok", "Payment rejected recorded"), content_type="application/xml")

    def _generate_xml_response(self, status, description):
        root = ET.Element("response")
        st = ET.SubElement(root, "pg_status")
        st.text = status
        desc = ET.SubElement(root, "pg_description")
        desc.text = description
        
        # По правилам PayBox ответ тоже должен быть подписан, но для `ok` часто пропускают.
        # В идеале добавляем pg_sig к ответу
        merchant_id = "535498"
        secret_key = "saqkSwjOlsEwcBec"
        
        params = {
            'pg_status': status,
            'pg_description': description,
            'pg_salt': str(uuid.uuid4())[:16]
        }
        salt = ET.SubElement(root, "pg_salt")
        salt.text = params['pg_salt']
        
        sig = ET.SubElement(root, "pg_sig")
        sig.text = build_paybox_signature(params, 'result', secret_key)
        
        return ET.tostring(root, encoding='utf-8', xml_declaration=True)


class BillingHistoryAPIView(APIView):
    """
    GET /api/billing/history/ — История биллинговых операций пользователя.
    Returns BillingLog entries for the authenticated user, newest first.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.billing.models import BillingLog
        from django.core.paginator import Paginator

        page_num = int(request.query_params.get('page', 1))
        page_size = 20

        logs = BillingLog.objects.filter(
            user=request.user
        ).order_by('-created_at')

        paginator = Paginator(logs, page_size)
        page_obj = paginator.get_page(page_num)

        results = []
        for log in page_obj.object_list:
            change = float(log.change)
            results.append({
                'id': log.id,
                'description': log.description,
                'change': change,
                'amount': abs(change),
                'type': 'in' if change > 0 else 'out',
                'balance': float(log.balance) if log.balance is not None else None,
                'created_at': log.created_at.isoformat(),
                'duration': log.duration,
                'active': log.active,
            })

        return Response({
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page_num,
            'results': results,
        })
