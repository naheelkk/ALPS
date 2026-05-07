import os
import json
from app import create_app, db
from app.models import Question, Lesson, BanditParam, Resource

app = create_app()

MAPPING = {
    'Variables': 'Data Representation',
    'Functions': 'Logic & Flow',
    'Loops': 'Logic & Flow',
    'Arrays': 'Data Representation',
    'Objects': 'Data Representation',
    'Async': 'Architecture & Design',
    'Closures': 'Logic & Flow',
    'Classes': 'Architecture & Design',
    'General': 'Theory & Concepts'
}

def migrate():
    with app.app_context():
        print("Starting Concept Migration...")
        
        # 1. Update Questions
        questions = Question.query.all()
        q_updated = 0
        for q in questions:
            if q.concept:
                new_concept = MAPPING.get(q.concept, 'Theory & Concepts')
                if q.concept != new_concept:
                    q.concept = new_concept
                    q_updated += 1
        print(f"Updated {q_updated} Questions.")

        # 2. Update Lessons
        lessons = Lesson.query.all()
        l_updated = 0
        for l in lessons:
            if l.topics:
                try:
                    topics_list = json.loads(l.topics)
                    new_topics = [MAPPING.get(t, 'Theory & Concepts') for t in topics_list]
                    # Unique and back to JSON
                    l.topics = json.dumps(list(set(new_topics)))
                    l_updated += 1
                except:
                    pass
        print(f"Updated {l_updated} Lessons.")
        
        # 3. Update Resources (if they have a concept field)
        try:
            resources = Resource.query.all()
            r_updated = 0
            for r in resources:
                if hasattr(r, 'concept') and r.concept:
                    new_concept = MAPPING.get(r.concept, 'Theory & Concepts')
                    if r.concept != new_concept:
                        r.concept = new_concept
                        r_updated += 1
            print(f"Updated {r_updated} Resources.")
        except Exception as e:
            print(f"Skipped Resources: {e}")

        # 4. Clear Bandit Memory
        deleted_params = db.session.query(BanditParam).delete()
        print(f"Deleted {deleted_params} BanditParam records (Resetting CMAB Memory).")

        db.session.commit()
        print("Migration Complete!")

if __name__ == '__main__':
    migrate()
