import os
import json
import logging
import urllib.request
import urllib.error
from django.conf import settings
import pdfplumber

logger = logging.getLogger(__name__)

def parse_pdf_to_text(pdf_file):
    """Извлекает текст из загруженного PDF файла"""
    text = ""
    try:
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        logger.error(f"Failed to parse PDF: {e}")
    return text

def extract_resume_data_with_deepseek(text: str) -> dict:
    """Отправляет текст в DeepSeek и возвращает структурированный JSON"""
    api_key = os.environ.get("DEEPSEEK_API_KEY", settings.DEEPSEEK_API_KEY if hasattr(settings, 'DEEPSEEK_API_KEY') else "")
    if not api_key:
        return {"error": "DeepSeek API key is not configured"}
        
    prompt = f"""
Ты — профессиональный AI HR-ассистент. Твоя задача — извлечь данные из текста резюме и вернуть их в строгом JSON формате, без дополнительных комментариев, markdown-оформления (без ```json) или текста.

Текст резюме:
{text}

Ожидаемая структура JSON:
{{
  "career_objective": "Желаемая должность (строка)",
  "name": "Имя",
  "sname": "Фамилия",
  "mname": "Отчество (если есть)",
  "phone": "Телефон",
  "salary": "Ожидаемая зарплата (число или null)",
  "city": "Город",
  "about_me": "О себе (строка)",
  "key_skills": "Ключевые навыки (строка, через запятую)",
  "work_experiences": [
    {{
      "company_name": "Название компании",
      "position": "Должность",
      "exp_start_work": "Дата начала в формате YYYY-MM-DD",
      "exp_end_work": "Дата окончания в формате YYYY-MM-DD (или null, если по настоящее время)",
      "exp_is_working": true или false,
      "duties": "Обязанности"
    }}
  ],
  "institutions": [
    {{
      "institution_name": "Название учебного заведения",
      "faculty": "Факультет",
      "specialization": "Специальность",
      "inst_start_study": "Год начала (строка, например '2015')",
      "inst_end_study": "Год окончания (строка, например '2019')"
    }}
  ]
}}

Если какое-то поле не найдено, установи значение null или пустую строку.
Верни ТОЛЬКО валидный JSON!
"""

    url = "https://api.deepseek.com/chat/completions"
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that only outputs raw JSON. No explanations, no markdown blocks."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.0
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            content = result["choices"][0]["message"]["content"].strip()
            
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            return json.loads(content)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        logger.error(f"DeepSeek API HTTPError: {err_msg}")
        return {"error": f"Ошибка сервиса DeepSeek: {e.code}"}
    except Exception as e:
        logger.error(f"DeepSeek API Error: {e}")
        return {"error": str(e)}

def parse_resume_document(file_obj) -> dict:
    """Главная функция для парсинга документа"""
    text = parse_pdf_to_text(file_obj)
    if not text.strip():
        return {"error": "Не удалось извлечь текст из PDF. Возможно, это скан-копия."}
        
    return extract_resume_data_with_deepseek(text)
