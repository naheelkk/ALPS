from app import db
from datetime import datetime
import json

class Resource(db.Model):
    __tablename__ = 'resources'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # article, video, practice
    difficulty = db.Column(db.String(20), default='beginner')
    estimated_time = db.Column(db.String(20))
    concepts = db.Column(db.Text)  # JSON list of concepts
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'url': self.url,
            'type': self.type,
            'difficulty': self.difficulty,
            'estimated_time': self.estimated_time,
            'concepts': json.loads(self.concepts) if self.concepts else [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
