import requests
import json
from django.conf import settings
from apps.vacancies.models import Vacancy
from apps.resumes.models import Resume

def get_ai_candidates_for_vacancy(vacancy_id, limit=5):
    """
    Fetches the vacancy, finds some base resumes, and scores them using Groq API.
    """
    try:
        vacancy = Vacancy.objects.get(id=vacancy_id)
    except Vacancy.DoesNotExist:
        return []

    # Multi-stage filtering (Воронка подбора)
    # 1. Hard Filter (База данных): Берем только активные резюме
    qs = Resume.objects.filter(draft=False, archive=False)
    
    # Жесткий фильтр по сфере (чтобы не предлагать поваров на позицию IT)
    if vacancy.scope_id:
        qs = qs.filter(scope_id=vacancy.scope_id)
        
    # Жесткий фильтр по городу
    if vacancy.city_id:
        qs = qs.filter(city_id=vacancy.city_id)

    # 2. Soft Filter / Sorting (Самые свежие)
    resumes = qs.order_by('-created_at')[:limit]
    
    if not resumes:
        return []

    # Prepare payload for the LLM
    vacancy_text = f"Title: {vacancy.position}\nRequirements: {vacancy.requirements}\nDuties: {vacancy.duties}"
    
    candidates_data = []
    for r in resumes:
        # Build a safe string representation of the resume
        skills = ", ".join([s.title for s in r.skills.all()]) if hasattr(r, 'skills') else ''
        resume_text = f"Position: {r.career_objective}\nSkills: {skills}\nAbout: {r.about}"
        
        candidates_data.append({
            "id": r.id,
            "resume_text": resume_text,
            "obj": r
        })

    # Use DEEPSEEK_API_KEY from settings, fallback to GROQ_API_KEY for backward compatibility if needed, or just require DEEPSEEK_API_KEY
    api_key = getattr(settings, 'DEEPSEEK_API_KEY', getattr(settings, 'GROQ_API_KEY', None))

    results = []

    for cand in candidates_data:
        # If API key is missing, mock the result
        if not api_key:
            import random
            results.append({
                "resume_id": cand['id'],
                "aiScore": random.randint(60, 95),
                "aiReasoning": [
                    "Резюме соответствует базовым требованиям",
                    "(Mocked - API key not set)"
                ],
                "resume_obj": cand['obj']
            })
            continue

        # Real LLM call using DeepSeek
        prompt = f"""
        You are an expert IT recruiter. Evaluate how well this candidate matches the vacancy.
        Vacancy: {vacancy_text}
        
        Candidate: {cand['resume_text']}
        
        Return a JSON object with:
        "score": integer from 0 to 100 representing the match percentage.
        "reasoning": array of 2-3 short strings in Russian explaining why they match or don't match.
        Only return the raw JSON, no markdown formatting.
        """

        try:
            response = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": "You output strict JSON without markdown formatting."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2
                },
                timeout=15
            )
            response.raise_for_status()
            llm_reply = response.json()['choices'][0]['message']['content']
            
            # Basic cleanup in case it returns markdown blocks despite prompt
            llm_reply = llm_reply.replace('```json', '').replace('```', '').strip()
            
            parsed = json.loads(llm_reply)
            results.append({
                "resume_id": cand['id'],
                "aiScore": parsed.get('score', 50),
                "aiReasoning": parsed.get('reasoning', []),
                "resume_obj": cand['obj']
            })
        except Exception as e:
            print(f"Groq API Error for resume {cand['id']}: {str(e)}")
            results.append({
                "resume_id": cand['id'],
                "aiScore": 50,
                "aiReasoning": ["Не удалось проанализировать с помощью AI"],
                "resume_obj": cand['obj']
            })

    # Sort descending by score
    results.sort(key=lambda x: x['aiScore'], reverse=True)
    return results
