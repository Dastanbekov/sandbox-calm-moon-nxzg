import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.resumes.serializers import ResumeCreateUpdateSerializer
from apps.resumes.models import Resume
import logging
logging.basicConfig(level=logging.DEBUG)

data = {
    "career_objective": "Test",
    "photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
}
serializer = ResumeCreateUpdateSerializer(data=data)
serializer.is_valid(raise_exception=True)
print("Validated data length of photo:", len(serializer.validated_data.get('photo', '')))
print("Validated data:", serializer.validated_data)
