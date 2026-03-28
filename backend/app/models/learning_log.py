from datetime import datetime
from app import db
import json

class LearningLog(db.Model):
    """
    Stores learning interaction data for future RL training.
    This is the experience replay buffer for the RL module.
    """
    __tablename__ = 'learning_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # State representation
    state = db.Column(db.Text)  # JSON: mastery levels, recent errors, velocity
    
    # Action taken
    action_type = db.Column(db.String(50))  # recommendation, quiz, lesson
    action_id = db.Column(db.Integer)  # ID of the recommended resource
    
    # Outcome/Reward signals
    immediate_outcome = db.Column(db.Float)  # immediate performance change
    delayed_outcome = db.Column(db.Float)  # measured after N days
    engagement_score = db.Column(db.Float)  # completion rate, time spent
    
    # Next state
    next_state = db.Column(db.Text)  # JSON: updated state after action
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    outcome_measured_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', back_populates='learning_logs')
    
    @property
    def state_dict(self):
        return json.loads(self.state) if self.state else {}
    
    @state_dict.setter
    def state_dict(self, value):
        self.state = json.dumps(value)
    
    @property
    def next_state_dict(self):
        return json.loads(self.next_state) if self.next_state else {}
    
    @next_state_dict.setter
    def next_state_dict(self, value):
        self.next_state = json.dumps(value)
    
    def to_experience_tuple(self):
        """Convert to RL experience tuple format."""
        return {
            'state': self.state_dict,
            'action': {
                'type': self.action_type,
                'id': self.action_id
            },
            'reward': {
                'immediate': self.immediate_outcome,
                'delayed': self.delayed_outcome,
                'engagement': self.engagement_score
            },
            'next_state': self.next_state_dict,
            'timestamp': self.created_at.isoformat() if self.created_at else None
        }