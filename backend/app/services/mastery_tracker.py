from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func
from app import db
from app.models import Answer, Submission
import numpy as np

class MasteryTracker:
    """
    Tracks and calculates concept mastery levels for learners.
    Uses a weighted scoring system with recency decay.
    """
    
    # Decay factors
    RECENCY_DECAY = 0.9  # Per week decay
    CORRECT_WEIGHT = 0.15
    INCORRECT_WEIGHT = -0.2
    INITIAL_MASTERY = 0.5
    
    def __init__(self):
        pass
    
    def calculate_mastery(self, user_id: int, course_id: Optional[int] = None) -> Dict[str, float]:
        """
        Calculate mastery levels for all concepts for a user, optionally filtered by course.
        
        Returns:
            Dict mapping concept names to mastery scores (0-1)
        """
        from app.models import Question
        
        # Get answers for user, optionally filtered by course
        query = Answer.query.join(Submission).filter(
            Submission.user_id == user_id
        )
        
        if course_id is not None:
            query = query.join(Question).filter(Question.quiz.has(course_id=course_id))
            
        answers = query.order_by(Submission.submitted_at.desc()).all()
        
        if not answers:
            return {}
        
        # Group by concept
        concept_history = {}
        for answer in answers:
            concept = answer.question.concept or 'General'
            if concept not in concept_history:
                concept_history[concept] = []
            concept_history[concept].append({
                'is_correct': answer.is_correct,
                'timestamp': answer.submission.submitted_at,
                'time_spent': answer.time_spent,
                'difficulty': answer.question.difficulty
            })
        
        # Calculate mastery for each concept
        mastery_scores = {}
        for concept, history in concept_history.items():
            mastery_scores[concept] = self._calculate_concept_mastery(history)
        
        # Note: Dependency application logic is disabled for course-agnostic CMAB.
        # If dynamic dependencies are added later, re-enable _apply_dependencies here.
        
        return mastery_scores
    def _calculate_concept_mastery(self, history: List[Dict]) -> float:
        """Calculate mastery for a single concept based on answer history."""
        if not history:
            return self.INITIAL_MASTERY
        
        mastery = self.INITIAL_MASTERY
        now = datetime.utcnow()
        
        for item in history:
            # Calculate recency weight
            days_ago = (now - item['timestamp']).days if item['timestamp'] else 0
            weeks_ago = days_ago / 7
            recency_weight = self.RECENCY_DECAY ** weeks_ago
            
            # Calculate difficulty weight
            difficulty_weights = {'easy': 0.8, 'medium': 1.0, 'hard': 1.2}
            difficulty_weight = difficulty_weights.get(item.get('difficulty', 'medium'), 1.0)
            
            # Update mastery
            if item['is_correct']:
                mastery += self.CORRECT_WEIGHT * recency_weight * difficulty_weight
            else:
                mastery += self.INCORRECT_WEIGHT * recency_weight * difficulty_weight
            
            # Clamp between 0 and 1
            mastery = max(0, min(1, mastery))
        
        return round(mastery, 3)
    
    def _apply_dependencies(self, mastery_scores: Dict[str, float]) -> Dict[str, float]:
        """
        Apply dependency constraints (Currently disabled for course-agnostic support).
        A concept's mastery is capped by its prerequisites.
        """
        # Return scores unchanged until dynamic dependency loading is implemented
        return mastery_scores
    def get_learning_velocity(self, user_id: int, days: int = 7) -> float:
        """
        Calculate learning velocity (improvement rate) over recent period.
        
        Returns:
            Float representing average daily improvement (-1 to 1)
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        submissions = Submission.query.filter(
            Submission.user_id == user_id,
            Submission.submitted_at >= start_date
        ).order_by(Submission.submitted_at).all()
        
        if len(submissions) < 2:
            return 0.0
        
        scores = [s.score / 100 for s in submissions]
        
        # Calculate trend using simple linear regression
        x = np.arange(len(scores))
        slope = np.polyfit(x, scores, 1)[0]
        
        return round(slope, 4)
    
    def identify_weak_concepts(
        self, 
        user_id: int, 
        threshold: float = 0.6
    ) -> List[Dict]:
        """
        Identify concepts that need improvement.
        
        Args:
            user_id: User ID
            threshold: Mastery threshold below which concept is considered weak
            
        Returns:
            List of weak concepts with their mastery scores
        """
        mastery = self.calculate_mastery(user_id)
        
        weak = [
            {'concept': concept, 'mastery': score}
            for concept, score in mastery.items()
            if score < threshold
        ]
        
        # Sort by mastery (lowest first)
        weak.sort(key=lambda x: x['mastery'])
        
        return weak