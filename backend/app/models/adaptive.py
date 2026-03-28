from app import db
from datetime import datetime

class AdaptiveRule(db.Model):
    __tablename__ = 'adaptive_rules'

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    concept = db.Column(db.String(100), nullable=False)
    threshold = db.Column(db.Float, nullable=False) # e.g., 0.6 for 60%
    resource_title = db.Column(db.String(200), nullable=False)
    resource_url = db.Column(db.String(500), nullable=False)
    resource_type = db.Column(db.String(50), default='article') # video, article, etc.
    priority = db.Column(db.String(20), default='medium') # high, medium, low
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    course = db.relationship('Course', backref=db.backref('adaptive_rules', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'concept': self.concept,
            'threshold': self.threshold,
            'resource_title': self.resource_title,
            'resource_url': self.resource_url,
            'resource_type': self.resource_type,
            'priority': self.priority,
            'created_at': self.created_at.isoformat()
        }
