from datetime import datetime
from app import db

class Recommendation(db.Model):
    __tablename__ = 'recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'))
    concept = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text)
    priority = db.Column(db.String(20), default='medium')  # high, medium, low
    resource_type = db.Column(db.String(20), default='article')  # video, article, practice
    resource_title = db.Column(db.String(255))
    resource_url = db.Column(db.String(500))
    estimated_time = db.Column(db.String(20))
    status = db.Column(db.String(20), default='active')  # active, completed, dismissed
    user_rating = db.Column(db.Integer)  # 1 (helpful) or -1 (not helpful)
    user_feedback = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', back_populates='recommendations')
    submission = db.relationship('Submission', back_populates='recommendations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'concept': self.concept,
            'reason': self.reason,
            'priority': self.priority,
            'resource_type': self.resource_type,
            'resource_title': self.resource_title,
            'resource_url': self.resource_url,
            'estimated_time': self.estimated_time,
            'status': self.status,
            'userRating': self.user_rating,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }