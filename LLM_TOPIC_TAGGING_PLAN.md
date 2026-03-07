# LLM-Assisted Question Topic Tagging — Implementation Plan

## Overview

When a tutor creates or edits a quiz question, instead of manually typing the `concept`
field, a small LLM reads the question text and suggests the topic automatically.
The tutor can accept or override the suggestion before saving.

---

## Architecture

```
Tutor types question in the admin UI
        ↓
"✨ Auto-tag" button click
        ↓
Frontend → POST /api/admin/questions/suggest-topic
        ↓
Backend → topic_tagger.py → Gemini Flash 2.0 API
        ↓
Returns: { concept, subconcept, suggested_quiz_topics, confidence }
        ↓
UI pre-fills concept/subconcept fields (tutor can edit)
        ↓
Tutor saves → question stored with correct concept
```

---

## Step 1 — Install the Gemini SDK

Inside your backend virtual environment:

```bash
pip install google-generativeai
```

Add to `backend/requirements.txt`:
```
google-generativeai>=0.8.0
```

---

## Step 2 — Add Your Gemini API Key

In your `.env` file (backend):

```
GEMINI_API_KEY=your_api_key_here
```

Get a free key at: https://aistudio.google.com/app/apikey

---

## Step 3 — Create `app/services/topic_tagger.py`

Create the file `backend/app/services/topic_tagger.py`:

```python
import os
import json
import re
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Use the smallest, cheapest model
MODEL = "gemini-2.0-flash"

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
            "reasoning": str
        }
    """
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
```

---

## Step 4 — Add the API Endpoint in `app/routes/admin.py`

Add this new route anywhere in the QUIZ MANAGEMENT section of `admin.py`:

```python
@admin_bp.route('/questions/suggest-topic', methods=['POST'])
@tutor_required
def suggest_question_topic():
    """
    Given a question text + options, ask the LLM to suggest a concept tag.
    Used by the frontend auto-tag button.
    """
    data = request.get_json()

    question_text = data.get('question', '').strip()
    if not question_text:
        return jsonify({'message': 'question is required'}), 400

    options       = data.get('options', [])
    course_title  = data.get('course_title', '')
    quiz_title    = data.get('quiz_title', '')

    from app.services.topic_tagger import suggest_topic
    result = suggest_topic(question_text, options, course_title, quiz_title)

    if result['error']:
        return jsonify({'message': f"LLM error: {result['error']}"}), 500

    return jsonify(result), 200
```

---

## Step 5 — Add the Batch Backfill Script

Create `backend/backfill_topics.py` to fix all existing questions stuck on `"General"`:

```python
"""
Run once to auto-tag all existing questions that have concept = 'General' or concept = None.

Usage:
    cd backend
    python backfill_topics.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import Question, Quiz, Course
from app.services.topic_tagger import suggest_topic
import time

app = create_app()

with app.app_context():
    questions = Question.query.filter(
        (Question.concept == None) | (Question.concept == 'General')
    ).all()

    print(f"Found {len(questions)} questions to tag.")

    for i, q in enumerate(questions):
        quiz = Quiz.query.get(q.quiz_id)
        course = Course.query.get(quiz.course_id) if quiz else None

        result = suggest_topic(
            question_text=q.question,
            options=q.options_list,
            course_title=course.title if course else "",
            quiz_title=quiz.title if quiz else ""
        )

        if result['error']:
            print(f"  [{i+1}] ERROR on Q#{q.id}: {result['error']}")
            continue

        q.concept = result['concept']
        q.subconcept = result['subconcept']
        db.session.commit()

        print(f"  [{i+1}] Q#{q.id} → concept='{q.concept}', subconcept='{q.subconcept}' (confidence={result['confidence']:.2f})")
        time.sleep(0.3)  # gentle rate-limit

    print("Done.")
```

---

## Step 6 — Frontend Changes

Find the question creation/edit modal in the React frontend (likely in an admin page component).

### 6a — Add state for suggestion

```jsx
const [isTagging, setIsTagging] = useState(false);
const [tagSuggestion, setTagSuggestion] = useState(null);
```

### 6b — Add the auto-tag function

```jsx
const autoTagQuestion = async () => {
  if (!questionForm.question.trim()) return;
  setIsTagging(true);
  try {
    const res = await fetch('/api/admin/questions/suggest-topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        question: questionForm.question,
        options: questionForm.options,
        course_title: currentCourse?.title || '',
        quiz_title: currentQuiz?.title || ''
      })
    });
    const data = await res.json();
    if (res.ok) {
      setTagSuggestion(data);
      // Pre-fill the form fields
      setQuestionForm(prev => ({
        ...prev,
        concept: data.concept,
        subconcept: data.subconcept || prev.subconcept
      }));
    }
  } catch (err) {
    console.error('Auto-tag failed:', err);
  } finally {
    setIsTagging(false);
  }
};
```

### 6c — Add the button next to the concept input

```jsx
{/* Concept field */}
<div className="form-group">
  <label>Concept / Topic</label>
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <input
      type="text"
      value={questionForm.concept}
      onChange={e => setQuestionForm({ ...questionForm, concept: e.target.value })}
      placeholder="e.g. JWT Authentication"
    />
    <button
      type="button"
      onClick={autoTagQuestion}
      disabled={isTagging || !questionForm.question.trim()}
      title="Auto-detect topic using AI"
    >
      {isTagging ? '...' : '✨ Auto-tag'}
    </button>
  </div>

  {/* Show confidence badge if suggestion exists */}
  {tagSuggestion && (
    <small style={{ color: tagSuggestion.confidence > 0.7 ? 'green' : 'orange' }}>
      AI suggestion (confidence: {Math.round(tagSuggestion.confidence * 100)}%)
      — {tagSuggestion.reasoning}
    </small>
  )}
</div>
```

---

## Step 7 — Also Update Quiz-Level Topics (Optional but Recommended)

When the tutor saves a question, the parent quiz's `topics` JSON array should be
updated to include the new concept (if not already present).

Add this logic to `create_question` and `update_question` in `admin.py`:

```python
# After saving the question, sync quiz.topics
import json as _json

quiz = Question.query.get(question.id).quiz  # or just use the quiz already loaded
existing_topics = _json.loads(quiz.topics) if quiz.topics else []
if question.concept and question.concept not in existing_topics and question.concept != 'General':
    existing_topics.append(question.concept)
    quiz.topics = _json.dumps(existing_topics)
    db.session.commit()
```

---

## File Checklist

| File | Action |
|---|---|
| `backend/requirements.txt` | Add `google-generativeai>=0.8.0` |
| `backend/.env` | Add `GEMINI_API_KEY=...` |
| `backend/app/services/topic_tagger.py` | **NEW** — LLM wrapper |
| `backend/app/routes/admin.py` | Add `suggest_question_topic` route |
| `backend/backfill_topics.py` | **NEW** — one-off backfill script |
| `frontend/.../QuestionModal.jsx` (or similar) | Add auto-tag button + logic |

---

## Notes

- The Gemini Flash 2.0 model is free-tier eligible and very fast (~300–500ms per call)
- The tutor override is always possible — the LLM suggestion is never forced
- Run the backfill script **once** after deployment to tag existing questions
- If you'd prefer to use OpenAI instead, swap `google-generativeai` for `openai` and
  adjust `topic_tagger.py` accordingly — the prompt is identical
