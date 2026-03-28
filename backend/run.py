import os
from app import create_app, db
from app.models import User, Course, Quiz, Question, Submission, Recommendation

app = create_app(os.getenv('FLASK_ENV', 'development'))

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Course': Course,
        'Quiz': Quiz,
        'Question': Question,
        'Submission': Submission,
        'Recommendation': Recommendation
    }

@app.cli.command()
def seed():
    """Seed the database with sample data."""
    from app.utils.seed_data import seed_database
    seed_database()
    print('Database seeded!')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)