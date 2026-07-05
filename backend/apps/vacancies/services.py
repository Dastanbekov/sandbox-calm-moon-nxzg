"""
Vacancies app services — бизнес-логика из старого Vacancy.php и связанных контроллеров.
"""
from django.db import transaction
from django.utils import timezone
from apps.vacancies.repositories import VacancyRepository
from apps.billing.models import BillingLog
from apps.vacancies.models import VacancyResponse, Vacancy, SavedVacancy
from django.core.exceptions import PermissionDenied, ValidationError


class VacancyService:

    @staticmethod
    def store(user, data: dict):
        # Если это первая вакансия или у юзера SuperHR — бесплатно. Иначе — платная.
        free = False
        try:
            if user.company and user.company.vacancy_is_free():
                free = True
        except Exception:
            pass
        
        vacancy = Vacancy(user=user, **data)
        vacancy.free = free
        
        if vacancy.draft:
            vacancy.moderated = False
            vacancy.checking = False
        else:
            if free:
                vacancy.checking = True
            else:
                # Если платная, отправляем на проверку (или ждём оплаты)
                vacancy.checking = True
                vacancy.waiting_payment = True

        vacancy.save()
        
        # Если мы использовали "первую бесплатную" квоту, надо записать дату использования
        try:
            if free and user.company and not user.company.is_super_hr() and not user.company.free_date:
                user.company.free_date = timezone.now()
                user.company.save()
        except Exception:
            pass

        return {'detail': 'Вакансия сохранена.', 'id': vacancy.id}

    @staticmethod
    def update(user, vacancy, data: dict):
        for k, v in data.items():
            setattr(vacancy, k, v)
            
        vacancy.user_updated_at = timezone.now()

        if vacancy.draft:
            vacancy.moderated = False
            vacancy.checking = False
        else:
            # Если она уже была опубликована, просто оставляем как есть, либо на модерацию 
            # (зависит от логики старого портала — обычно оставляли moderated=True если уже была)
            if not vacancy.moderated:
                vacancy.checking = True

        vacancy.save()
        return {'detail': 'Вакансия обновлена.', 'id': vacancy.id}

    @staticmethod
    def destroy(vacancy):
        # Аналог destroy из старого: не удаляем физически, а архивируем
        vacancy.archive = True
        vacancy.save()
        return 'Вакансия перенесена в архив.'

    @staticmethod
    def publish_draft(vacancy, user):
        """Публикация из черновика. Если бесплатная — сразу checking. Иначе оплата."""
        if not vacancy.draft:
            return 'Вакансия уже не черновик.'
            
        vacancy.draft = False
        
        if vacancy.free:
            vacancy.checking = True
        else:
            vacancy.checking = True
            vacancy.waiting_payment = True
            
        vacancy.save()
        return 'Отправлено на публикацию.'

    @staticmethod
    def send_response(user, vacancy_id, data: dict):
        vacancy = Vacancy.objects.get(pk=vacancy_id)
        
        # Проверка отклика (в Laravel: $response = App\VacancyResponse::where('vacancy_id',...))
        if VacancyResponse.objects.filter(vacancy=vacancy, user=user).exists():
            raise ValidationError('Вы уже откликались на эту вакансию.')
            
        resp = VacancyResponse(
            vacancy=vacancy,
            user=user,
            resume_id=data.get('resume_id'),
            message=data.get('message', ''),
            file1=data.get('file1'),
            filename1=data.get('filename1'),
            file2=data.get('file2'),
            filename2=data.get('filename2'),
            file3=data.get('file3'),
            filename3=data.get('filename3'),
        )
        resp.save()
        
        vacancy.count_response += 1
        vacancy.save()
        return resp

    @staticmethod
    def destroy_response(user, vacancy_id, resume_id):
        resp = VacancyResponse.objects.filter(
            vacancy_id=vacancy_id, user=user, resume_id=resume_id
        ).first()
        if resp:
            resp.delete()

    @staticmethod
    def toggle_favourite(user, vacancy, action):
        """action: 'save' или 'remove'"""
        if action == 'save':
            SavedVacancy.objects.get_or_create(user=user, vacancy=vacancy)
            return 'Вакансия сохранена.'
        else:
            SavedVacancy.objects.filter(user=user, vacancy=vacancy).delete()
            return 'Вакансия удалена из сохраненных.'

    @staticmethod
    def toggle_anonim(vacancy):
        vacancy.anonim = not vacancy.anonim
        vacancy.save()
        return f'Анонимность {"включена" if vacancy.anonim else "выключена"}.'
