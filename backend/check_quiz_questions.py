from app import create_app, db
from app.models import Quiz, Question

app = create_app()

with app.app_context():
    quiz_id = 2
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        print(f"Quiz {quiz_id} not found!")
    else:
        print(f"Quiz: {quiz.title}")
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        print(f"Found {len(questions)} questions.")
        for q in questions:
            print(f"- {q.id}: {q.question[:30]}...")
