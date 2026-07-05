"""
Vacancies app views — точная миграция с employment-old.
Реализует все эндпоинты из VacanciesController.php и BillingLogsController.php.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from apps.users.permissions import IsActiveAndVerified

from apps.vacancies.models import Vacancy, SavedVacancy, ComplainVacancy, Complain, VacancyResponse
from apps.vacancies.repositories import VacancyRepository, LookupRepository
from apps.vacancies.services import VacancyService
from apps.vacancies.serializers import (
    VacancyListSerializer,
    VacancyDetailSerializer,
    VacancyWriteSerializer,
    VacancyResponseSerializer,
    ScopeSerializer,
    BusynessSerializer,
    EducationSerializer,
    CurrencySerializer,
)
from apps.resumes.models import City
from apps.resumes.serializers import (
    CitySerializer,
    CitizenshipSerializer,
    LanguageSerializer,
    LanguageProficiencySerializer,
)


class VacancyPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


# ─── Public ──────────────────────────────────────────────────────────────────

class VacancyListAPIView(APIView):
    """GET /api/vacancies/ — Каталог вакансий с фильтрацией."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        filters = {
            'query':       request.query_params.get('query'),
            'city_id':     request.query_params.get('city_id'),
            'scope_id':    request.query_params.get('scope_id'),
            'busyness_id': request.query_params.get('busyness_id'),
        }
        qs = VacancyRepository.get_moderated_fixed(filters)
        paginator = VacancyPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(
            VacancyListSerializer(page, many=True, context={'request': request}).data
        )

    def post(self, request):
        if not request.user.is_authenticated or not request.user.is_employer:
            return Response({'detail': 'Только работодатели могут размещать вакансии.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        mapping = {
            'city_id': 'city',
            'scope_id': 'scope',
            'busyness_id': 'busyness',
            'currency_id': 'currency',
            'description': 'overview'
        }
        for f_key, b_key in mapping.items():
            if f_key in data and data[f_key]:
                val = data.pop(f_key)
                data[b_key] = val[0] if isinstance(val, list) else val

        serializer = VacancyWriteSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            vacancy = serializer.save(user=request.user)
            return Response({'id': vacancy.id, 'message': 'Вакансия успешно создана.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VacancyCabinetAPIView(APIView):
    """GET /api/vacancies/cabinet/ — Вакансии работодателя в личном кабинете."""
    permission_classes = [IsActiveAndVerified]

    def get(self, request):
        status_tab = request.query_params.get('status_tab')
        qs = VacancyRepository.get_for_user(request.user.id, tab=status_tab)
        paginator = VacancyPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(
            VacancyListSerializer(page, many=True, context={'request': request}).data
        )

class SavedVacancyListAPIView(APIView):
    """GET /api/vacancies/bookmarks/ — Сохраненные вакансии пользователя."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        saved = SavedVacancy.objects.filter(user=request.user).select_related('vacancy')
        vacancies = [s.vacancy for s in saved]
        paginator = VacancyPagination()
        page = paginator.paginate_queryset(vacancies, request)
        return paginator.get_paginated_response(
            VacancyListSerializer(page, many=True, context={'request': request}).data
        )

class VacancyDetailAPIView(APIView):
    """GET /api/vacancies/{id}/ — Детали вакансии."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        vacancy = get_object_or_404(Vacancy, pk=pk)

        # Модерированные или собственные (как в старом show())
        user = request.user
        if not vacancy.moderated and (not user.is_authenticated or vacancy.user_id != user.id):
            return Response({'detail': 'Вакансия не найдена.'}, status=status.HTTP_404_NOT_FOUND)

        if not vacancy.draft and not vacancy.archive:
            VacancyRepository.increment_view(pk)

        similar = VacancyRepository.get_similar(vacancy, limit=3)
        company_vacancies = VacancyRepository.get_company_vacancies(vacancy.user_id, pk)
        
        data = VacancyDetailSerializer(vacancy, context={'request': request}).data
        data['similar'] = VacancyListSerializer(similar, many=True, context={'request': request}).data
        data['company_vacancies'] = VacancyListSerializer(company_vacancies, many=True, context={'request': request}).data
        
        return Response(data)


# ─── Employer CRUD ────────────────────────────────────────────────────────────

class VacancyCreateAPIView(APIView):
    """POST /api/vacancies/ — Создание вакансии."""
    permission_classes = [IsActiveAndVerified]

    def post(self, request):
        if not request.user.is_employer:
            return Response({'detail': 'Только работодатели могут публиковать вакансии.'},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = VacancyWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = VacancyService.store(request.user, serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

class AICandidatesView(APIView):
    """GET /api/vacancies/{id}/ai-candidates/ — Умный подбор кандидатов с помощью LLM (Groq)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        if not request.user.is_employer:
            return Response({'detail': 'Только работодатели могут просматривать подходящих кандидатов.'}, status=status.HTTP_403_FORBIDDEN)
        
        from apps.vacancies.ai_matcher import get_ai_candidates_for_vacancy
        from apps.resumes.serializers import ResumeListSerializer

        # Проверим, что вакансия принадлежит этому юзеру
        vacancy = get_object_or_404(Vacancy, pk=pk, user=request.user)
        
        try:
            # Получаем данные от AI
            ai_results = get_ai_candidates_for_vacancy(pk, limit=5)

            # Сериализуем резюме и добавляем AI-метаданные
            serialized_results = []
            for res in ai_results:
                resume_data = ResumeListSerializer(res['resume_obj'], context={'request': request}).data
                resume_data['aiScore'] = res['aiScore']
                resume_data['aiReasoning'] = res['aiReasoning']
                serialized_results.append(resume_data)

            return Response(serialized_results, status=status.HTTP_200_OK)
        except Exception as e:
            # Логируем ошибку, но не роняем фронтенд
            import logging
            logging.error(f"AI Matcher Error: {str(e)}")
            return Response({'detail': f'Ошибка при поиске AI-кандидатов: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AISuggestSkillsView(APIView):
    """GET /api/vacancies/suggest-skills/?profession=XYZ — Генерация профессиональных навыков через DeepSeek."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        position = request.query_params.get('position') or request.query_params.get('profession')
        if not position:
            return Response({'detail': 'Параметр position обязателен.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.conf import settings
        import requests
        
        deepseek_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
        groq_key = getattr(settings, 'GROQ_API_KEY', None)
        
        if not deepseek_key and not groq_key:
            return Response({'error': 'No AI API key configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        prompt = f"""
        Вы эксперт в области HR. Для указанной должности: "{position}", сделайте следующее:
        1. Определите одну самую подходящую стандартизированную профессию из списка ниже. В поле "profession" укажите ТОЛЬКО ОДНО название без запятых, слешай и синонимов — например: "Юрист" или "Преподаватель" — ни в коем случае не возвращай два слова через запятую.
        2. Перечислите профессиональные (hard) навыки, которые соответствуют этой профессии. Выберите их из предложенных для этой профессии, при необходимости добавьте 1-2 своих.
        3. Перечислите 3-5 цифровых навыков для этой профессии.
        
        СПИСОК ПРОФЕССИЙ, СИНОНИМОВ И НАВЫКОВ:
        - Юрист (Синонимы: юрист, юрисконсульт, legal advisor, lawyer, legal officer, legal counsel, law consoler)
          Навыки: Договорное право, Корпоративное право, Трудовое право, Судебная практика / представительство, Юридический анализ, Подготовка договоров, Compliance / комплаенс, Regulatory / работа с госорганами, Legal research, Знание законодательства КР.
        
        - Финансист (Синонимы: бухгалтер, главный бухгалтер, accountant, chief accountant, финансист, финансовый аналитик, finance specialist, financial analyst, аудитор, internal auditor, external auditor)
          Навыки: Бухгалтерский учет, Налоговый учет, Финансовый анализ, Управленческий учет, 1С, Excel (продвинутый уровень), Финансовое моделирование, Аудит (внутренний/внешний), Бюджетирование, IFRS / МСФО.
          
        - HR-специалист (Синонимы: HR менеджер, рекрутер, специалист по персоналу, HR manager, recruiter, talent acquisition)
          Навыки: Подбор персонала (recruitment), Интервьюирование, Адаптация сотрудников, Оценка персонала, HR администрирование, Кадровое делопроизводство, Employer branding, Обучение и развитие, HR аналитика, Работа с HR системами.
          
        - Администрация (Синонимы: офис-менеджер, административный ассистент, ресепшн, ресепшионист, secretary, receptionist, office manager, admin assistant)
          Навыки: Организация офиса, Документооборот, Деловая переписка, Работа с клиентами, Планирование встреч, MS Office, Телефонные коммуникации, Координация процессов, Поддержка руководителя.
          
        - Специалист по продажам (Синонимы: специалист по продажам, менеджер по продажам, sales manager, sales executive, account manager)
          Навыки: Активные продажи, Ведение переговоров, Работа с возражениями, CRM системы, Управление клиентами (account management), Холодные звонки, B2B продажи, B2C продажи, Закрытие сделок, Выполнение KPI.
          
        - Маркетолог (Синонимы: маркетолог, marketing specialist, digital marketer, SMM менеджер, social media manager)
          Навыки: Digital маркетинг, SMM, Контент-маркетинг, Таргетированная реклама, Google Ads, Аналитика (Google Analytics), SEO, Email маркетинг, Брендинг, Копирайтинг.
          
        - Программист (Синонимы: разработчик, программист, software engineer, backend developer, frontend developer, fullstack developer, тестировщик, QA engineer, QA tester, системный администратор, system administrator, IT support)
          Навыки: Программирование, Базы данных, Разработка ПО, Тестирование (QA), Системное администрирование, DevOps, Сетевые технологии.
        - Дизайнер (Синонимы: графический дизайнер, UI/UX дизайнер, graphic designer, UX designer)
          Навыки: Adobe Photoshop, Adobe Illustrator, Figma, UI/UX дизайн, Веб-дизайн, Прототипирование, Брендинг, Работа с типографикой, Motion дизайн (базово).
          
        - Логист (Синонимы: логист, специалист по логистике, logistics specialist)
          Навыки: Управление поставками, Планирование маршрутов, Таможенные процедуры, Работа с перевозчиками, Складская логистика, Документооборот, Контроль доставки, Оптимизация затрат.
          
        - Специалист по закупкам (Синонимы: procurement specialist, purchasing manager)
          Навыки: Проведение тендеров, Переговоры с поставщиками, Контракты, Анализ цен, Управление поставщиками, Планирование закупок, Supply chain.
          
        - Банковский специалист (Синонимы: кредитный специалист, loan officer, banking specialist)
          Навыки: Кредитный анализ, Финансовая оценка клиентов, Работа с кредитами, Банковские продукты, Риск-анализ, Работа с клиентами, Compliance.
          
        - Оператор колл-центра (Синонимы: оператор, call center agent, customer support)
          Навыки: Обслуживание клиентов, Телефонные продажи, Обработка обращений, Работа с CRM, Решение конфликтов, Скрипты общения.
          
        - Преподаватель (Синонимы: учитель, преподаватель, тренер, teacher, lecturer, trainer)
          Навыки: Проведение занятий, Разработка программ обучения, Публичные выступления, Оценка знаний, Онлайн-обучение, Методология обучения.
          
        - Врач (Синонимы: врач, doctor, Physician, врач дантолог)
          Навыки: Медицинская практика, Диагностика, Лечение пациентов, Оказание первой помощи, Работа с медицинской документацией.
          
        - Медсестра (Синонимы: медсестра, nurse)
          Навыки: Уход за больными, Выполнение предписаний врача, Медицинские процедуры, Ведение карт пациентов.
          
        - Инженер (Синонимы: инженер, civil engineer, project engineer)
          Навыки: Проектирование, AutoCAD, Технические расчеты, Контроль строительства, Работа с чертежами, Управление проектами.
          
        - Водитель (Синонимы: водитель, driver)
          Навыки: Вождение (категории B, C и т.д.), Знание города, Безопасность, Обслуживание авто.
          
        - Продавец (Синонимы: продавец, sales assistant)
          Навыки: Обслуживание клиентов, Работа с кассой, Продажи, Консультирование, Выкладка товаров.
          
        - Повар (Синонимы: повар, chef, Cook)
          Навыки: Приготовление блюд, Работа по техкартам, Соблюдение санитарных норм (HACCP), Работа с кухонным оборудованием, Заготовки, Разработка меню.
          
        - Официант (Синонимы: официант, waiter)
          Навыки: Обслуживание гостей, Принятие заказов, Работа с POS-системой, Знание меню, Продажи (upselling), Работа с кассой.

        Если должности нет в списке синонимов, выберите наиболее близкую по смыслу стандартизированную профессию.
        
        Верните ТОЛЬКО валидный JSON объект со структурой:
        {{
            "profession": "Стандартизированная профессия",
            "key_skills": ["Навык 1", "Навык 2"],
            "digital_skills": ["Программа 1", "Программа 2"]
        }}
        Без markdown разметки.
        """
        try:
            if deepseek_key:
                response = requests.post(
                    "https://api.deepseek.com/chat/completions",
                    headers={
                        "Authorization": f"Bearer {deepseek_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": [
                            {"role": "system", "content": "You output strict JSON object without markdown formatting. Only return the JSON object, no explanation."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3
                    },
                    timeout=15
                )
            else:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama3-8b-8192",
                        "messages": [
                            {"role": "system", "content": "You output strict JSON object without markdown formatting. Only return the JSON object, no explanation."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3
                    },
                    timeout=15
                )
                
            response.raise_for_status()
            llm_reply = response.json()['choices'][0]['message']['content']
            
            # Clean possible markdown wrap
            llm_reply = llm_reply.strip()
            if llm_reply.startswith("```json"):
                llm_reply = llm_reply[7:]
            if llm_reply.startswith("```"):
                llm_reply = llm_reply[3:]
            if llm_reply.endswith("```"):
                llm_reply = llm_reply[:-3]
                
            import json
            data = json.loads(llm_reply.strip())
            
            # Ensure it's the right format
            result = {
                "profession": data.get("profession", position),
                "key_skills": data.get("key_skills", []),
                "digital_skills": data.get("digital_skills", [])
            }
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            import logging
            logging.error(f"AI Suggest Skills Error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIGenerateDescriptionView(APIView):
    """POST /api/vacancies/generate-description/ — Генерация Требований и Обязанностей с помощью ИИ."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import requests
        from django.conf import settings
        
        data = request.data
        position = data.get('position', '')
        profession = data.get('profession', '')
        experience = data.get('experience', '')
        key_skills = data.get('key_skills', [])
        
        if not position:
            return Response({'detail': 'Укажите должность.'}, status=status.HTTP_400_BAD_REQUEST)
            
        groq_key = getattr(settings, 'GROQ_API_KEY', None)
        deepseek_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
        
        if not groq_key and not deepseek_key:
            return Response({'detail': 'AI сервис не настроен (отсутствуют ключи).'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        prompt = f"""
        Вы профессиональный HR-копирайтер. 
        На основе следующих данных создайте профессиональные описания для вакансии.
        Должность: {position}
        Категория: {profession}
        Опыт работы: {experience}
        Ключевые навыки: {', '.join(key_skills) if key_skills else 'Не указаны'}
        
        Сгенерируйте 4 раздела для описания вакансии:
        1. overview - Общие сведения о вакансии и компании (1-2 абзаца, можно использовать <p> теги)
        2. qualification_requirements - Требования к кандидату (список, маркированный HTML тегами <ul><li>...</li></ul>)
        3. duties - Обязанности кандидата (список, маркированный HTML тегами <ul><li>...</li></ul>)
        4. conditions - Условия работы (список, маркированный HTML тегами <ul><li>...</li></ul>)
        
        Верните ТОЛЬКО валидный JSON объект со структурой:
        {{
            "overview": "html текст",
            "qualification_requirements": "html текст",
            "duties": "html текст",
            "conditions": "html текст"
        }}
        Без markdown разметки типа ```json ... ```. 
        """
        try:
            if deepseek_key:
                response = requests.post(
                    "https://api.deepseek.com/chat/completions",
                    headers={
                        "Authorization": f"Bearer {deepseek_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": [
                            {"role": "system", "content": "You output strict JSON object without markdown formatting. Only return the JSON object, no explanation."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.4
                    },
                    timeout=20
                )
            else:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama3-8b-8192",
                        "messages": [
                            {"role": "system", "content": "You output strict JSON object without markdown formatting. Only return the JSON object, no explanation."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.4
                    },
                    timeout=20
                )
                
            response.raise_for_status()
            llm_reply = response.json()['choices'][0]['message']['content']
            
            # Clean possible markdown wrap
            llm_reply = llm_reply.strip()
            if llm_reply.startswith("```json"):
                llm_reply = llm_reply[7:]
            if llm_reply.startswith("```"):
                llm_reply = llm_reply[3:]
            if llm_reply.endswith("```"):
                llm_reply = llm_reply[:-3]
                
            import json
            data_resp = json.loads(llm_reply.strip())
            
            return Response({
                "overview": data_resp.get("overview", ""),
                "qualification_requirements": data_resp.get("qualification_requirements", ""),
                "duties": data_resp.get("duties", ""),
                "conditions": data_resp.get("conditions", "")
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import logging
            logging.error(f"AI Generate Description Error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VacancyUpdateAPIView(APIView):
    """PUT /api/vacancies/{id}/ — Обновление вакансии."""
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        vacancy = get_object_or_404(Vacancy, pk=pk, user=request.user)
        serializer = VacancyWriteSerializer(vacancy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = VacancyService.update(request.user, vacancy, serializer.validated_data)
        return Response(result)


class VacancyDestroyAPIView(APIView):
    """DELETE /api/vacancies/{id}/ — Архивирование или удаление вакансии."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        vacancy = get_object_or_404(Vacancy, pk=pk, user=request.user)
        msg = VacancyService.destroy(vacancy)
        return Response({'detail': msg})


class VacancyPublishDraftAPIView(APIView):
    """POST /api/vacancies/{id}/publish/ — Публикация черновика."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        vacancy = get_object_or_404(Vacancy, pk=pk, user=request.user)
        msg = VacancyService.publish_draft(vacancy, request.user)
        return Response({'detail': msg})


# ─── Worker actions ───────────────────────────────────────────────────────────

class VacancyRespondAPIView(APIView):
    """POST /api/vacancies/{id}/respond/ — Отклик соискателя."""
    permission_classes = [IsActiveAndVerified]

    def post(self, request, pk):
        if not request.user.is_worker:
            return Response({'detail': 'Только соискатели могут откликаться.'},
                            status=status.HTTP_403_FORBIDDEN)
        resp = VacancyService.send_response(request.user, pk, request.data)
        return Response(VacancyResponseSerializer(resp).data, status=status.HTTP_201_CREATED)


class VacancyDeleteResponseAPIView(APIView):
    """DELETE /api/vacancies/{id}/respond/ — Отзыв отклика."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        resume_id = request.data.get('resume_id')
        VacancyService.destroy_response(request.user, pk, resume_id)
        return Response({'detail': 'Отклик удалён.'})


class VacancyResponseStatusAPIView(APIView):
    """PATCH /api/vacancies/responses/{id}/status/ — Обновление статуса отклика (ATS)."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_employer:
            return Response({'detail': 'Только работодатели могут менять статус.'}, status=status.HTTP_403_FORBIDDEN)
            
        new_status = request.data.get('status')
        if new_status not in dict(VacancyResponse.STATUS_CHOICES):
            return Response({'detail': 'Неверный статус.'}, status=status.HTTP_400_BAD_REQUEST)
            
        response_obj = get_object_or_404(VacancyResponse, pk=pk)
        
        # Проверка прав: работодатель должен быть владельцем вакансии
        if response_obj.vacancy.user_id != request.user.id:
            return Response({'detail': 'У вас нет доступа к этой вакансии.'}, status=status.HTTP_403_FORBIDDEN)
            
        response_obj.status = new_status
        response_obj.save()
        
        return Response({'detail': 'Статус обновлен.', 'status': new_status})


class VacancyEmployerResponsesAPIView(APIView):
    """GET /api/vacancies/responses/ — Получить список откликов для пользователя (работодателя или соискателя)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_employer:
            responses = VacancyResponse.objects.filter(vacancy__user=request.user).select_related('vacancy', 'resume', 'user')
        else:
            responses = VacancyResponse.objects.filter(user=request.user).select_related('vacancy', 'resume', 'user')
        
        # Для простоты вернем плоский список, а фронтенд сам сгруппирует
        # Мы можем переиспользовать VacancyResponseSerializer или создать простой
        data = []
        for r in responses:
            # Чтобы не делать тяжелый сериализатор, соберем нужные поля для UI
            data.append({
                'id': r.id,
                'vacancy_id': r.vacancy.id,
                'vacancy_title': r.vacancy.position,
                'status': r.status,
                'created_at': r.created_at,
                'resume': {
                    'id': r.resume.id,
                    'career_objective': r.resume.career_objective,
                    'wages': r.resume.wages,
                    'currency_detail': {'title': r.resume.currency.title} if r.resume.currency else None,
                    'city_detail': {'title': r.resume.city.title} if r.resume.city else None,
                    'profile': {
                        'name': r.resume.user.name,
                        'sname': r.resume.user.sname,
                    }
                },
                'vacancy': {
                    'id': r.vacancy.id,
                    'position': r.vacancy.position,
                    'company': r.vacancy.user.company.title if hasattr(r.vacancy.user, 'company') and r.vacancy.user.company else r.vacancy.user.name,
                }
            })
        return Response(data)

class VacancyFavouriteAPIView(APIView):
    """POST /api/vacancies/{id}/favourite/ — Сохранить / убрать из избранного."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        vacancy = get_object_or_404(Vacancy, pk=pk)
        action = request.data.get('action')
        msg = VacancyService.toggle_favourite(request.user, vacancy, action)
        return Response({'detail': msg})


class VacancyAnonimAPIView(APIView):
    """POST /api/vacancies/{id}/anonim/ — Переключить анонимность."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        vacancy = get_object_or_404(Vacancy, pk=pk, user=request.user)
        msg = VacancyService.toggle_anonim(vacancy)
        return Response({'detail': msg})


class VacancyComplainAPIView(APIView):
    """POST /api/vacancies/{id}/complain/ — Жалоба на вакансию."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        vacancy = get_object_or_404(Vacancy, pk=pk, moderated=True)
        complain = get_object_or_404(Complain, pk=request.data.get('complain_id'), active=True)

        if ComplainVacancy.objects.filter(vacancy=vacancy, user=request.user).exists():
            return Response({'detail': 'Вы уже жаловались на данную вакансию.'},
                            status=status.HTTP_400_BAD_REQUEST)

        ComplainVacancy.objects.create(
            vacancy=vacancy,
            user=request.user,
            complain=complain,
            description=request.data.get('description', '')
        )
        return Response({'detail': 'Жалоба отправлена!'})


# ─── Employer billing actions ─────────────────────────────────────────────────

class BillingActionAPIView(APIView):
    """
    POST /api/billing/{action}/{id}/ — Биллинговые операции.
    action: makeInPriority | makeFixed | makeHot | sendNotification |
            renewVacancy | newVacancy | makeLeading | getContacts |
            superHr | superHrPlus
    """
    permission_classes = [IsActiveAndVerified]

    def post(self, request, action, pk):
        from apps.billing.services import BillingService
        item_type = request.data.get('type', 'vacancy')
        duration  = int(request.data.get('duration', 0))
        try:
            msg = BillingService.bill_action(request.user, action, pk, item_type, duration)
            return Response({'detail': msg})
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VacancyAnalyticsAPIView(APIView):
    """GET /api/vacancies/analytics/ — Аналитика для дашборда работодателя."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_employer:
            return Response({'detail': 'Только работодатели могут просматривать аналитику.'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.db import models
        from django.utils import timezone
        from datetime import timedelta
        
        # 1. Total active vacancies
        total_vacancies = Vacancy.objects.filter(
            user=request.user, moderated=True, archive=False, draft=False
        ).count()
        
        # 2. Total views across all vacancies
        total_views_result = Vacancy.objects.filter(user=request.user).aggregate(total_views=models.Sum('count_view'))
        total_views = total_views_result['total_views'] or 0
        
        # 3. Total responses
        total_responses = VacancyResponse.objects.filter(vacancy__user=request.user).count()
        
        # 4. New responses
        new_responses = VacancyResponse.objects.filter(vacancy__user=request.user, status='new').count()
        
        # 5. Chart Data (responses over last 7 days)
        today = timezone.now().date()
        chart_data = []
        for i in range(6, -1, -1):
            target_date = today - timedelta(days=i)
            daily_count = VacancyResponse.objects.filter(
                vacancy__user=request.user,
                created_at__date=target_date
            ).count()
            
            chart_data.append({
                'name': target_date.strftime('%d %b'),
                'responses': daily_count
            })

        return Response({
            'total_vacancies': total_vacancies,
            'total_views': total_views,
            'total_responses': total_responses,
            'new_responses': new_responses,
            'chart_data': chart_data
        })


# ─── Lookups ──────────────────────────────────────────────────────────────────

class LookupsAPIView(APIView):
    """GET /api/lookups/ — Все справочники одним запросом."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.resumes.models import Citizenship, Language, LanguageProficiency
        return Response({
            'scopes':       ScopeSerializer(LookupRepository.get_scopes(), many=True).data,
            'cities':       CitySerializer(LookupRepository.get_cities(), many=True).data,
            'busynesses':   BusynessSerializer(LookupRepository.get_busynesses(), many=True).data,
            'educations':   EducationSerializer(LookupRepository.get_educations(), many=True).data,
            'currencies':   CurrencySerializer(LookupRepository.get_currencies(), many=True).data,
            'citizenships': CitizenshipSerializer(
                Citizenship.objects.filter(active=True).order_by('order'), many=True).data,
            'languages':    LanguageSerializer(
                Language.objects.filter(active=True).order_by('order'), many=True).data,
            'proficiencies': LanguageProficiencySerializer(
                LanguageProficiency.objects.filter(active=True).order_by('order'), many=True).data,
            'complains':    [{'id': c.id, 'title': c.title}
                             for c in LookupRepository.get_complains()],
        })


class VacancyMarketStatsAPIView(APIView):
    """
    GET /api/vacancies/market-stats/?scope_id=X&city_id=Y
    Returns salary statistics and market data for a given scope/city combo.
    Used in vacancy creation form analytics widget.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.db.models import Avg, Min, Max, Count

        profession = request.query_params.get('profession')
        position = request.query_params.get('position')
        city_id = request.query_params.get('city_id')

        # Filter active (moderated) vacancies with a salary floor defined
        qs = Vacancy.objects.filter(
            moderated=True, archive=False, draft=False,
            wages_from__isnull=False
        )
        if profession:
            qs = qs.filter(profession=profession)
        elif position:
            qs = qs.filter(position__icontains=position)
            
        if city_id:
            qs = qs.filter(city_id=city_id)

        agg = qs.aggregate(
            avg_salary=Avg('wages_from'),
            min_salary=Min('wages_from'),
            max_salary=Max('wages_from'),
            total_vacancies=Count('id'),
        )

        return Response({
            'avg_salary_from': round(agg['avg_salary'] or 0),
            'min_salary_from': round(agg['min_salary'] or 0),
            'max_salary_from': round(agg['max_salary'] or 0),
            'total_vacancies': agg['total_vacancies'],
        })
