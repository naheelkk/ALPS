from app import db
from datetime import datetime

class BanditParam(db.Model):
    """
    Stores the parameters for the Contextual Multi-Armed Bandit (LinUCB) algorithm.
    Each resource (arm) has its own A matrix and b vector.
    """
    __tablename__ = 'bandit_params'
    
    id = db.Column(db.Integer, primary_key=True)
    item_type = db.Column(db.String(50), nullable=False) # 'lesson' or 'resource'
    item_id = db.Column(db.Integer, nullable=False)
    
    __table_args__ = (db.UniqueConstraint('item_type', 'item_id', name='uq_bandit_param_item'),)
    
    # Store A as a flattened JSON array. Default should be Identity matrix I.
    matrix_a = db.Column(db.Text, nullable=False) 
    
    # Store b as a JSON array. Default should be zero vector.
    vector_b = db.Column(db.Text, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Note: No enforced ForeignKey relationship here to allow tracking both Lessons and Resources.
