from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.vacancies.models import City, Scope, Busyness, Education, Currency, Vacancy
from apps.resumes.models import Citizenship, Language, LanguageProficiency, Resume, WorkExperience, Institution, ResumeLanguage
from apps.cms.models import ComplainReason
from apps.users.models import Company, Profile
from django.utils import timezone
from decimal import Decimal
import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial lookup and test data for local environment'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database lookup tables...')

        # 1. Cities
        cities = ['Бишкек', 'Ош', 'Джалал-Абад', 'Каракол', 'Чолпон-Ата']
        city_objs = {}
        for c in cities:
            obj, created = City.objects.get_or_create(title=c)
            city_objs[c] = obj

        # 2. Scopes
        scopes = ['Информационные технологии (IT)', 'Продажи / Коммерция', 'Маркетинг / Реклама / PR', 'Административный персонал', 'Бухгалтерия / Финансы']
        scope_objs = {}
        for s in scopes:
            obj, created = Scope.objects.get_or_create(title=s)
            scope_objs[s] = obj

        # 3. Busynesses
        busynesses = ['Полная занятость', 'Частичная занятость', 'Удаленная работа', 'Стажировка', 'Проектная работа']
        busyness_objs = {}
        for b in busynesses:
            obj, created = Busyness.objects.get_or_create(title=b)
            busyness_objs[b] = obj

        # 4. Educations
        educations = ['Высшее образование', 'Неоконченное высшее', 'Среднее специальное', 'Среднее образование']
        education_objs = {}
        for e in educations:
            obj, created = Education.objects.get_or_create(title=e)
            education_objs[e] = obj

        # 5. Currencies
        currencies = ['KGS', 'USD', 'EUR', 'RUB']
        currency_objs = {}
        for cur in currencies:
            obj, created = Currency.objects.get_or_create(title=cur)
            currency_objs[cur] = obj

        # 6. Citizenships
        citizenships = ['Кыргызстан', 'Казахстан', 'Россия', 'Узбекистан']
        citizenship_objs = {}
        for cit in citizenships:
            obj, created = Citizenship.objects.get_or_create(title=cit)
            citizenship_objs[cit] = obj

        # 7. Languages
        languages = ['Кыргызский', 'Русский', 'Английский', 'Немецкий', 'Китайский']
        language_objs = {}
        for l in languages:
            obj, created = Language.objects.get_or_create(title=l)
            language_objs[l] = obj

        # 8. Language Proficiencies
        proficiencies = ['A1 - Начальный', 'A2 - Элементарный', 'B1 - Средний', 'B2 - Выше среднего', 'C1 - Продвинутый / Свободный', 'C2 - В совершенстве']
        proficiency_objs = {}
        for p in proficiencies:
            obj, created = LanguageProficiency.objects.get_or_create(title=p)
            proficiency_objs[p] = obj

        # 9. Complain Reasons
        complain_reasons = ['Неактуальное объявление/резюме', 'Мошенничество или спам', 'Некорректное/грубое содержание', 'Неверный номер телефона или контакты']
        for cr in complain_reasons:
            ComplainReason.objects.get_or_create(title=cr)

        self.stdout.write(self.style.SUCCESS('Lookup tables seeded successfully!'))

        # 10. Users
        self.stdout.write('Seeding mock users...')
        
        # Candidate User
        cand_user, created = User.objects.get_or_create(
            email='candidate@example.com',
            defaults={
                'name': 'Алексей Иванов',
                'balance': Decimal('500.00'),
                'personal_bill': 100001,
                'is_active': True,
            }
        )
        if created:
            cand_user.set_password('password123')
            cand_user.save()
            Profile.objects.create(
                user=cand_user,
                name='Алексей',
                sname='Иванов',
                mname='Петрович',
                phone='+996 555 12-34-56',
                show_phone=True,
                address='г. Бишкек, ул. Киевская 100',
                citizenship=citizenship_objs['Кыргызстан']
            )
            self.stdout.write(f"Created candidate user: {cand_user.email}")
        
        # Employer User
        emp_user, created = User.objects.get_or_create(
            email='employer@example.com',
            defaults={
                'name': 'HR Менеджер',
                'balance': Decimal('2000.00'),
                'personal_bill': 100002,
                'is_active': True,
            }
        )
        if created:
            emp_user.set_password('password123')
            emp_user.save()
            Company.objects.create(
                user=emp_user,
                title='Codify Technology',
                scope=scope_objs['Информационные технологии (IT)'],
                city=city_objs['Бишкек'],
                address='г. Бишкек, пр. Чуй 120',
                about_company='Разработка ПО и обучение ИТ-специалистов.',
                phone='+996 700 11-22-33',
                show_phone=True,
                site='https://codify.kg',
                show_site=True,
                published=True
            )
            self.stdout.write(f"Created employer user: {emp_user.email}")

        # 11. Mock Vacancy (moderated and published)
        if Vacancy.objects.count() == 0:
            Vacancy.objects.create(
                user=emp_user,
                position='Senior Python / Django Developer',
                scope=scope_objs['Информационные технологии (IT)'],
                city=city_objs['Бишкек'],
                education=education_objs['Высшее образование'],
                busyness=busyness_objs['Полная занятость'],
                work_graphite='Гибкий график',
                experience='Более 5 лет',
                wages_from=Decimal('150000.00'),
                wages_to=Decimal('250000.00'),
                currency=currency_objs['KGS'],
                overview='Мы ищем талантливого Senior Python/Django разработчика для проектирования архитектуры корпоративных сервисов...',
                qualification_requirements='— Опыт разработки на Python/Django от 5 лет;\n— Отличное знание SQL и PostgreSQL;\n— Опыт проектирования микросервисов;\n— Умение писать Unit-тесты.',
                duties='— Проектирование и разработка API-сервисов;\n— Оптимизация баз данных и запросов;\n— Проведение код-ревью и менторство.',
                conditions='— Современный офис в центре города;\n— Официальное оформление;\n— Оплачиваемое обучение и конференции.',
                draft=False,
                moderated=True,
                is_fixed=True,
                is_hot=True,
                published_at=timezone.now(),
                count_view=42,
                count_response=5
            )
            self.stdout.write(self.style.SUCCESS("Created mock vacancy 'Senior Python / Django Developer'"))

        # 12. Mock Resume (moderated and active)
        if Resume.objects.count() == 0:
            resume = Resume.objects.create(
                user=cand_user,
                name='Алексей',
                sname='Иванов',
                mname='Петрович',
                date_of_birth=datetime.date(1996, 5, 20),
                phone='+996 555 12-34-56',
                citizenship=citizenship_objs['Кыргызстан'],
                native_language=language_objs['Русский'],
                career_objective='Senior Python/Django разработчик',
                city=city_objs['Бишкек'],
                salary=Decimal('150000.00'),
                currency=currency_objs['KGS'],
                scope=scope_objs['Информационные технологии (IT)'],
                busyness=busyness_objs['Полная занятость'],
                key_skills='Python, Django, FastAPI, PostgreSQL, Redis, Celery, Docker, Git, CI/CD',
                about_me='Более 6 лет коммерческой разработки высоконагруженных систем. Опыт проектирования API и оптимизации СУБД.',
                draft=False,
                moderated=True
            )
            
            # Work Experience
            WorkExperience.objects.create(
                resume=resume,
                position='Senior Backend Developer',
                organization='Codify Technology',
                scope='Разработка ПО',
                exp_scope=scope_objs['Информационные технологии (IT)'],
                exp_city=city_objs['Бишкек'],
                exp_org_site='codify.kg',
                exp_start_work=datetime.date(2023, 1, 1),
                exp_is_working=True,
                exp_achievements='— Перепроектировал ядро платформы, увеличив скорость отклика API на 40%;\n— Настроил масштабируемую очередь задач с использованием Celery и Redis;'
            )
            
            # Institution
            Institution.objects.create(
                resume=resume,
                education=education_objs['Высшее образование'],
                institution='Кыргызский Государственный Технический Университет (КГТУ)',
                department='Информационные технологии',
                specialty='Программное обеспечение вычислительной техники',
                year_of_ending=2019
            )
            
            # Resume Language
            ResumeLanguage.objects.create(
                resume=resume,
                language=language_objs['Английский'],
                language_proficiency=proficiency_objs['C1 - Продвинутый / Свободный']
            )
            
            self.stdout.write(self.style.SUCCESS("Created mock resume for Алексей Иванов"))

        self.stdout.write(self.style.SUCCESS('Database seeding finished successfully!'))
