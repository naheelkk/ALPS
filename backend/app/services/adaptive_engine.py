from typing import Dict, List, Optional
from app import db
from app.models import Recommendation, LearningLog, Resource, AdaptiveRule
from app.services.mastery_tracker import MasteryTracker
class AdaptiveEngine:
    """
    Rule-based adaptive engine for generating personalized recommendations.
    This serves as the initial system before RL takes over.
    """
    
    # Concept dependency graph
    CONCEPT_DEPENDENCIES = {
        'Functions': ['Variables'],
        'Loops': ['Variables'],
        'Arrays': ['Variables', 'Loops'],
        'Objects': ['Variables', 'Functions'],
        'Async': ['Functions', 'Objects'],
        'Closures': ['Functions', 'Objects']
    }
    
    def __init__(self):
        self.mastery_tracker = MasteryTracker()
    
    def generate_recommendations(
        self, 
        user_id: int, 
        submission_id: int,
        concept_results: Dict[str, Dict]
    ) -> List[Recommendation]:
        """
        Generate recommendations based on quiz performance.
        
        Args:
            user_id: The user's ID
            submission_id: The submission ID
            concept_results: Dict mapping concept to {'correct': int, 'total': int}
        
        Returns:
            List of Recommendation objects
        """
        recommendations = []
        
        # Analyze each concept
        for concept, results in concept_results.items():
            mastery = results['correct'] / results['total'] if results['total'] > 0 else 0
            
            # Determine priority based on mastery level
            if mastery < 0.4:
                priority = 'high'
                reason = f"You scored {int(mastery * 100)}% on {concept}. This concept needs immediate attention."
            elif mastery < 0.7:
                priority = 'medium'
                reason = f"You scored {int(mastery * 100)}% on {concept}. Some review would be beneficial."
            else:
                # Don't create recommendations for well-understood concepts
                continue
            
            # Get appropriate resource
            resource = self._select_resource(concept, mastery)
            
            if resource:
                rec = Recommendation(
                    user_id=user_id,
                    submission_id=submission_id,
                    concept=concept,
                    reason=reason,
                    priority=priority,
                    resource_type=resource['type'],
                    resource_title=resource['title'],
                    resource_url=resource['url'],
                    estimated_time=resource['time']
                )
                recommendations.append(rec)
                db.session.add(rec)
        
        # Check prerequisite concepts
        prerequisite_recs = self._check_prerequisites(user_id, concept_results)
        recommendations.extend(prerequisite_recs)
        
        # Log for RL training
        self._log_for_rl(user_id, submission_id, concept_results, recommendations)
        
        db.session.commit()
        
        return recommendations

    def generate_recommendations_from_assessment(
        self,
        user_id: int,
        submission_id: int,
        concept_scores: Dict[str, float],
        course_id: int = None
    ) -> List[Recommendation]:
        """
        Generate recommendations based on assessment grading.
        """
        recommendations = []
        
        for concept, score in concept_scores.items():
            # If score is low (e.g., < 60%), recommend resources
            if score < 0.6:
                priority = 'high' if score < 0.4 else 'medium'
                reason = f"Based on your assessment, you need to review {concept}."
                
                # Need to pass course_id. For now, we need to fetch it or pass it in.
                # Assuming assessment is linked to course, we can get it via submission linkage if we had it here.
                # Since we don't have course_id in arguments, we'll need to fetch it or update signature.
                # Updating signature is better but requires caller change.
                # Let's fetch it via submission_id if possible, or update caller.
                # Caller is admin.py, let's update caller to pass course_id.
                
                resource = self._select_resource(concept, score, course_id=course_id)
                
                if resource:
                    rec = Recommendation(
                        user_id=user_id,
                        submission_id=submission_id, # Link to assessment submission if schema supports generic ID or add separate field
                        # Note: Recommendation model might need 'assessment_submission_id' or generic FK. 
                        # For now, assuming submission_id is generic or we just log it.
                        concept=concept,
                        reason=reason,
                        priority=priority,
                        resource_type=resource['type'],
                        resource_title=resource['title'],
                        resource_url=resource['url'],
                        estimated_time=resource['time']
                    )
                    recommendations.append(rec)
                    db.session.add(rec)
        
        db.session.commit()
        return recommendations
    
    def _select_resource(self, concept: str, mastery: float, course_id: int = None) -> Optional[Dict]:
        """Select the most appropriate resource based on mastery level and rules."""
        
        # 1. Check for specific Adaptive Rules first
        if course_id:
            rules = AdaptiveRule.query.filter_by(course_id=course_id, concept=concept).all()
            for rule in rules:
                if mastery < (rule.threshold / 100.0): # Threshold stored as percentage e.g. 60
                    return {
                        'type': rule.resource_type,
                        'title': rule.resource_title,
                        'url': rule.resource_url,
                        'time': '15 mins' # Default or added to model
                    }
        
        # 2. Fallback to generic logic
        
        # Determine target difficulty
        if mastery < 0.3:
            target_difficulty = 'beginner'
        elif mastery < 0.6:
            target_difficulty = 'intermediate'
        else:
            target_difficulty = 'advanced'
        
        # Query database for resources matching concept and difficulty
        # We use a LIKE query for simple JSON list matching or just reliance on text search if needed
        # For now, assuming we can filter by concept string being present in the concepts list (stored as text)
        
        # Try to find specific resource
        resource = Resource.query.filter(
            Resource.concepts.ilike(f'%"{concept}"%'),
            Resource.difficulty == target_difficulty
        ).first()
        
        # Fallback to any resource for the concept
        if not resource:
            resource = Resource.query.filter(
                Resource.concepts.ilike(f'%"{concept}"%')
            ).first()
            
        # Fallback to General resources
        if not resource:
            resource = Resource.query.filter(
                Resource.concepts.ilike('%"General"%'),
                Resource.difficulty == target_difficulty
            ).first()
            
        if resource:
            return resource.to_dict()
            
        return None
    
    def _check_prerequisites(
        self, 
        user_id: int, 
        concept_results: Dict[str, Dict]
    ) -> List[Recommendation]:
        """Check if user is struggling due to missing prerequisites."""
        recommendations = []
        
        for concept, results in concept_results.items():
            mastery = results['correct'] / results['total'] if results['total'] > 0 else 0
            
            if mastery < 0.5:  # Struggling with this concept
                # Check prerequisites
                prerequisites = self.CONCEPT_DEPENDENCIES.get(concept, [])
                for prereq in prerequisites:
                    # Check if prerequisite was also weak in this quiz
                    if prereq in concept_results:
                        prereq_mastery = concept_results[prereq]['correct'] / concept_results[prereq]['total']
                        if prereq_mastery < 0.6:
                            # Recommend prerequisite first
                            resource = self._select_resource(prereq, prereq_mastery)
                            if resource:
                                rec = Recommendation(
                                    user_id=user_id,
                                    concept=prereq,
                                    reason=f"Strengthen your {prereq} skills to better understand {concept}.",
                                    priority='high',
                                    resource_type=resource['type'],
                                    resource_title=resource['title'],
                                    resource_url=resource['url'],
                                    estimated_time=resource['time']
                                )
                                recommendations.append(rec)
                                db.session.add(rec)
        
        return recommendations
    
    def _log_for_rl(
        self, 
        user_id: int, 
        submission_id: int,
        concept_results: Dict,
        recommendations: List[Recommendation]
    ):
        """
        Log interaction data for future RL training.
        This builds the experience replay buffer.
        """
        # Create state representation
        state = {
            'concept_mastery': {
                concept: results['correct'] / results['total'] if results['total'] > 0 else 0
                for concept, results in concept_results.items()
            },
            'timestamp': str(db.func.now())
        }
        
        # Log each recommendation as a potential action
        for rec in recommendations:
            log = LearningLog(
                user_id=user_id,
                action_type='recommendation',
                action_id=rec.id if rec.id else None
            )
            log.state_dict = state
            db.session.add(log)