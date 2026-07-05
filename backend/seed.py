import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.vacancies.models import Scope, Busyness, Education
from apps.resumes.models import City, Language, LanguageProficiency

def seed_scopes():
    scopes_data = [
        "Финансы, Бухгалтерия, Аудит",
        "Банковское дело",
        "Страхование",
        "Юриспруденция",
        "Информационные и коммуникационные технологии (ICT)",
        "Маркетинг и реклама",
        "Продажи",
        "Административный персонал",
        "HR и рекрутинг",
        "Консалтинг",
        "Образование",
        "Медицина и фармацевтика",
        "Производство",
        "Строительство и недвижимость",
        "Логистика и транспорт",
        "Закупки и снабжение",
        "Туризм и гостиничный бизнес",
        "Рестораны и питание",
        "Медиа, Контент, Дизайн",
        "Государственная служба",
        "НКО / Международные организации",
        "Сервис и обслуживание"
    ]
    
    print("Seeding scopes...")
    for index, title in enumerate(scopes_data):
        Scope.objects.get_or_create(title=title, defaults={'order': index})
    print(f"Created/verified {len(scopes_data)} scopes.")

def seed_cities():
    cities_data = [
        "Бишкек", "Ош", "Джалал-Абад", "Каракол", "Токмок", 
        "Кара-Балта", "Нарын", "Талас", "Баткен", "Другой город"
    ]
    
    print("Seeding cities...")
    for index, title in enumerate(cities_data):
        City.objects.get_or_create(title=title, defaults={'order': index})
    print(f"Created/verified {len(cities_data)} cities.")

def seed_educations():
    data = ["Высшее", "Высшее неоконченное", "Среднее специальное", "Среднее"]
    print("Seeding educations...")
    for index, title in enumerate(data):
        Education.objects.get_or_create(title=title, defaults={'order': index})
    print(f"Created/verified {len(data)} educations.")

def seed_busynesses():
    data = ["Полная занятость", "Частичная занятость", "Проектная работа / Разовая", "Стажировка", "Волонтерство"]
    print("Seeding busynesses...")
    for index, title in enumerate(data):
        Busyness.objects.get_or_create(title=title, defaults={'order': index})
    print(f"Created/verified {len(data)} busynesses.")

def seed_languages():
    data = ["Английский", "Русский", "Кыргызский", "Казахский", "Турецкий", "Китайский", "Немецкий", "Французский", "Арабский", "Другой"]
    print("Seeding languages...")
    for index, title in enumerate(data):
        Language.objects.get_or_create(title=title, defaults={'order': index})
    print(f"Created/verified {len(data)} languages.")

def seed_proficiencies():
    data = ["Базовый", "Средний", "Продвинутый", "Свободный"]
    print("Seeding proficiencies...")
    for index, title in enumerate(data):
        LanguageProficiency.objects.get_or_create(title=title, defaults={'order': index})
    print(f"Created/verified {len(data)} proficiencies.")

if __name__ == '__main__':
    seed_scopes()
    seed_cities()
    seed_educations()
    seed_busynesses()
    seed_languages()
    seed_proficiencies()
