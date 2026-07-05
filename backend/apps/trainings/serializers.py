from rest_framework import serializers
from apps.trainings.models import Training, TrainingCategory, TrainingResponse
from apps.vacancies.serializers import ScopeSerializer
from apps.resumes.serializers import LanguageSerializer
from apps.users.serializers import CompanySerializer

class TrainingCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingCategory
        fields = '__all__'

class TrainingSerializer(serializers.ModelSerializer):
    category = TrainingCategorySerializer(read_only=True)
    scope = ScopeSerializer(read_only=True)
    language = LanguageSerializer(read_only=True)
    company = serializers.SerializerMethodField()
    
    class Meta:
        model = Training
        fields = '__all__'
        
    def get_company(self, obj):
        if hasattr(obj.user, 'company'):
            return CompanySerializer(obj.user.company).data
        return None

class TrainingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = [
            'category', 'scope', 'language', 'title', 'description', 
            'image', 'location', 'dates', 'price', 'contacts'
        ]

class TrainingResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingResponse
        fields = '__all__'
