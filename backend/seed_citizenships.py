import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.resumes.models import Citizenship

def seed_citizenships():
    countries = [
        "Кыргызстан", "Россия", "Казахстан", "Узбекистан", "Таджикистан",
        "Беларусь", "Армения", "Азербайджан", "Грузия", "Молдова", "Украина",
        "Турция", "ОАЭ", "США", "Великобритания", "Германия", "Франция",
        "Италия", "Испания", "Китай", "Южная Корея", "Япония", "Индия"
    ]
    print("Seeding citizenships...")
    for index, title in enumerate(countries):
        Citizenship.objects.get_or_create(title=title, defaults={'order': index, 'active': True})
    print(f"Created/verified {len(countries)} citizenships.")

if __name__ == '__main__':
    seed_citizenships()
