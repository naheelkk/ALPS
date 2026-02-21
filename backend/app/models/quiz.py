from datetime import datetime
from app import db
import json

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    time_limit = db.Column(db.Integer)  # in minutes
    passing_score = db.Column(db.Float, default=0.6)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    course = db.relationship('Course', back_populates='quizzes')
    questions = db.relationship('Question', back_populates='quiz', lazy='dynamic', order_by='Question.order', cascade='all, delete-orphan')
    submissions = db.relationship('Submission', back_populates='quiz', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_questions=False, hide_answers=True):
        data = {
            'id': self.id,
            'course_id': self.course_id,
            'title': self.title,
            'description': self.description,
            'time_limit': self.time_limit,
            'passing_score': self.passing_score,
            'question_count': self.questions.count()
        }
        
        if include_questions:
            data['questions'] = [
                q.to_dict(hide_answer=hide_answers) 
                for q in self.questions.all()
            ]
        
        return data


class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, nullable=False)  # JSON array
    correct_answer = db.Column(db.String(255), nullable=False)
    concept = db.Column(db.String(100))
    subconcept = db.Column(db.String(100))
    difficulty = db.Column(db.String(20), default='medium')
    explanation = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    
    # Relationships
    quiz = db.relationship('Quiz', back_populates='questions')
    
    @property
    def options_list(self):
        return json.loads(self.options) if self.options else []
    
    @options_list.setter
    def options_list(self, value):
        self.options = json.dumps(value)
    
    def to_dict(self, hide_answer=True):
        data = {
            'id': self.id,
            'question': self.question,
            'options': self.options_list,
            'concept': self.concept,
            'subconcept': self.subconcept,
            'difficulty': self.difficulty
        }
        
        if not hide_answer:
            data['correct_answer'] = self.correct_answer
            data['explanation'] = self.explanation
        
        return data


class Submission(db.Model):
    __tablename__ = 'submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    correct_answers = db.Column(db.Integer, nullable=False)
    time_taken = db.Column(db.Integer)  # in seconds
    started_at = db.Column(db.DateTime)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='submissions')
    quiz = db.relationship('Quiz', back_populates='submissions')
    answers = db.relationship('Answer', back_populates='submission', lazy='dynamic', cascade='all, delete-orphan')
    recommendations = db.relationship('Recommendation', back_populates='submission', lazy='dynamic')
    
    def to_dict(self, include_answers=False):
        data = {
            'id': self.id,
            'submission_id': self.id,
            'quiz_id': self.quiz_id,
            'score': self.score,
            'total_questions': self.total_questions,
            'correct_answers': self.correct_answers,
            'time_taken': self.time_taken,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }
        
        if include_answers:
            data['questions_detail'] = [
                answer.to_dict() for answer in self.answers.all()
            ]
        
        return data


class Answer(db.Model):
    __tablename__ = 'answers'
    
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    selected_answer = db.Column(db.String(255))
    is_correct = db.Column(db.Boolean, nullable=False)
    time_spent = db.Column(db.Integer)  # in seconds
    
    # Relationships
    submission = db.relationship('Submission', back_populates='answers')
    question = db.relationship('Question')
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'question': self.question.question,
            'concept': self.question.concept,
            'user_answer': self.selected_answer,
            'correct_answer': self.question.correct_answer,
            'is_correct': self.is_correct,
            'explanation': self.question.explanation,
            'time_spent': self.time_spent
        }