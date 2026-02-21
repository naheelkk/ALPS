from datetime import datetime
from app import db

class Assessment(db.Model):
    __tablename__ = 'assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    instructions = db.Column(db.Text)
    max_score = db.Column(db.Integer, default=100)
    due_date = db.Column(db.DateTime)
    file_types_allowed = db.Column(db.String(200), default='pdf,doc,docx,zip')
    is_published = db.Column(db.Boolean, default=True)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    course = db.relationship('Course', back_populates='assessments')
    submissions = db.relationship('AssessmentSubmission', back_populates='assessment', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_submissions=False):
        data = {
            'id': self.id,
            'course_id': self.course_id,
            'title': self.title,
            'description': self.description,
            'instructions': self.instructions,
            'max_score': self.max_score,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'file_types_allowed': self.file_types_allowed,
            'is_published': self.is_published,
            'submissions_count': self.submissions.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_submissions:
            data['submissions'] = [s.to_dict() for s in self.submissions.all()]
        
        return data


class AssessmentSubmission(db.Model):
    __tablename__ = 'assessment_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    file_url = db.Column(db.String(500))
    file_name = db.Column(db.String(255))
    file_size = db.Column(db.Integer)
    comments = db.Column(db.Text)
    
    # Store concept breakdown: {'Concept1': 0.8, 'Concept2': 0.4}
    concept_scores = db.Column(db.Text)  # JSON string
    
    score = db.Column(db.Float)
    feedback = db.Column(db.Text)
    graded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    graded_at = db.Column(db.DateTime)
    
    status = db.Column(db.String(20), default='submitted')
    
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assessment = db.relationship('Assessment', back_populates='submissions')
    
    __table_args__ = (
        db.UniqueConstraint('assessment_id', 'user_id', name='unique_assessment_submission'),
    )
    
    def to_dict(self):
        from app.models import User
        user = User.query.get(self.user_id)
        grader = User.query.get(self.graded_by) if self.graded_by else None
        
        return {
            'id': self.id,
            'assessment_id': self.assessment_id,
            'assessment_title': self.assessment.title if self.assessment else None,
            'user_id': self.user_id,
            'student_name': user.name if user else None,
            'student_email': user.email if user else None,
            'file_url': self.file_url,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'comments': self.comments,
            'score': self.score,
            'max_score': self.assessment.max_score if self.assessment else 100,
            'feedback': self.feedback,
            'graded_by': grader.name if grader else None,
            'graded_at': self.graded_at.isoformat() if self.graded_at else None,
            'status': self.status,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }