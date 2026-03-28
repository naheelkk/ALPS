import os
import json
import re
import google.generativeai as genai

# Attempt to configure exactly once; if API key is missing, handle errors gracefully later
try:
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
except Exception:
    pass

# Use the smallest, cheapest model that has widespread free-tier availability
MODEL = "gemini-flash-lite-latest"

SYSTEM_PROMPT = """You are a computer science education assistant.
Given a quiz question from a programming/tech course, identify the most
specific concept it tests. Always respond with valid JSON only — no markdown fences."""

def suggest_topic(question_text: str, options: list, course_title: str = "", quiz_title: str = "") -> dict:
    """
    Uses Gemini Flash to suggest a concept tag for a quiz question.

    Returns:
        {
            "concept": str,
            "subconcept": str,
            "suggested_quiz_topics": [str],
            "confidence": float,
            "reasoning": str,
            "error": str | None
        }
    """
    if not os.environ.get("GEMINI_API_KEY"):
        return {
            "concept": "General",
            "subconcept": "",
            "suggested_quiz_topics": [],
            "confidence": 0.0,
            "reasoning": "",
            "error": "GEMINI_API_KEY not found in environment."
        }

    user_prompt = f"""Course: {course_title or 'Unknown'}
Quiz: {quiz_title or 'Unknown'}
Question: {question_text}
Options: {json.dumps(options)}

Respond with JSON only in this exact shape:
{{
  "concept": "short concept name (e.g. JWT Authentication)",
  "subconcept": "more specific sub-topic (e.g. Token Expiry)",
  "suggested_quiz_topics": ["topic1", "topic2"],
  "confidence": 0.0,
  "reasoning": "one sentence"
}}"""

    try:
        model = genai.GenerativeModel(MODEL, system_instruction=SYSTEM_PROMPT)
        response = model.generate_content(user_prompt)
        raw = response.text.strip()

        # Strip markdown fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        result = json.loads(raw)
        return {
            "concept": result.get("concept", "General"),
            "subconcept": result.get("subconcept", ""),
            "suggested_quiz_topics": result.get("suggested_quiz_topics", []),
            "confidence": float(result.get("confidence", 0.5)),
            "reasoning": result.get("reasoning", ""),
            "error": None
        }
    except Exception as e:
        return {
            "concept": "General",
            "subconcept": "",
            "suggested_quiz_topics": [],
            "confidence": 0.0,
            "reasoning": "",
            "error": str(e)
        }

def suggest_lesson_topic(lesson_title: str, lesson_description: str, content_blocks: list, course_title: str = "") -> dict:
    """
    Uses Gemini Flash to suggest a concept tag for a lesson based on its contents.
    """
    if not os.environ.get("GEMINI_API_KEY"):
        return {
            "concept": "General",
            "subconcept": "",
            "suggested_quiz_topics": [],
            "confidence": 0.0,
            "reasoning": "",
            "error": "GEMINI_API_KEY not found in environment."
        }

    # Extract some text from content blocks
    content_summaries = []
    for b in content_blocks:
        stype = b.get('type', 'text')
        if stype in ['text', 'code']:
            content_summaries.append(f"[{stype.upper()}] {b.get('body', '')[:200]}")
        else:
            content_summaries.append(f"[{stype.upper()}] URL: {b.get('url', '')}")
            
    content_text = "\n".join(content_summaries)[:1500] # Limit context size
    
    user_prompt = f"""Course: {course_title or 'Unknown'}
Lesson Title: {lesson_title}
Description: {lesson_description}
Lesson Contents Preview: {content_text}

Respond with JSON only in this exact shape:
{{
  "concept": "short concept name (e.g. Array Methods)",
  "subconcept": "more specific sub-topic (e.g. Map and Filter)",
  "suggested_quiz_topics": ["topic1", "topic2"],
  "confidence": 0.0,
  "reasoning": "one sentence"
}}"""

    try:
        model = genai.GenerativeModel(MODEL, system_instruction=SYSTEM_PROMPT)
        response = model.generate_content(user_prompt)
        raw = response.text.strip()

        # Strip markdown fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        result = json.loads(raw)
        return {
            "concept": result.get("concept", "General"),
            "subconcept": result.get("subconcept", ""),
            "suggested_quiz_topics": result.get("suggested_quiz_topics", []),
            "confidence": float(result.get("confidence", 0.5)),
            "reasoning": result.get("reasoning", ""),
            "error": None
        }
    except Exception as e:
        return {
            "concept": "General",
            "subconcept": "",
            "suggested_quiz_topics": [],
            "confidence": 0.0,
            "reasoning": "",
            "error": str(e)
        }
