from app import db
from datetime import datetime

class BanditParam(db.Model):
    """
    Stores the parameters for the Contextual Multi-Armed Bandit (LinUCB) algorithm.
    Each resource (arm) has its own A matrix and b vector.
    """
    __tablename__ = 'bandit_params'
    
    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'), nullable=False, unique=True)
    
    # Store A as a flattened JSON array. Default should be Identity matrix I.
    matrix_a = db.Column(db.Text, nullable=False) 
    
    # Store b as a JSON array. Default should be zero vector.
    vector_b = db.Column(db.Text, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    resource = db.relationship('Resource', backref=db.backref('bandit_params', uselist=False))
