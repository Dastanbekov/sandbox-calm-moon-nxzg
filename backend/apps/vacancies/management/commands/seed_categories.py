from django.core.management.base import BaseCommand
from apps.vacancies.models import Scope

class Command(BaseCommand):
    help = 'Seeds the database with real-world job categories (Scopes)'

    def handle(self, *args, **kwargs):
        categories = [
            {'title': 'IT, телеком', 'slug_en': 'it'},
            {'title': 'Финансы, бухгалтерия', 'slug_en': 'finance'},
            {'title': 'Маркетинг, PR, реклама', 'slug_en': 'marketing'},
            {'title': 'Продажи', 'slug_en': 'sales'},
            {'title': 'Строительство, недвижимость', 'slug_en': 'construction'},
            {'title': 'Дизайн, искусство', 'slug_en': 'design'},
            {'title': 'Медицина, фармацевтика', 'slug_en': 'medicine'},
            {'title': 'Транспорт, логистика', 'slug_en': 'logistics'},
            {'title': 'Образование, наука', 'slug_en': 'education'},
            {'title': 'Производство', 'slug_en': 'production'},
            {'title': 'Сфера услуг, туризм', 'slug_en': 'services'},
            {'title': 'HR, управление персоналом', 'slug_en': 'hr'},
            {'title': 'Юриспруденция', 'slug_en': 'law'},
            {'title': 'Студенты, начало карьеры', 'slug_en': 'students'},
        ]

        for i, cat in enumerate(categories):
            scope, created = Scope.objects.update_or_create(
                slug_en=cat['slug_en'],
                defaults={
                    'title': cat['title'],
                    'order': i + 1,
                    'active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {scope.title}'))
            else:
                self.stdout.write(self.style.WARNING(f'Updated category: {scope.title}'))
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded categories!'))
