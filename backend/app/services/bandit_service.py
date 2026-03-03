import numpy as np
import json
import logging
import os
from dataclasses import dataclass
from app import db
from app.models import BanditParam, Resource, Lesson

@dataclass
class BanditArm:
    item_type: str # 'lesson' or 'resource'
    item_id: int
    title: str
    difficulty: str
    url: str
    estimated_time: str

# Configure CMAB logger
cmab_logger = logging.getLogger('cmab_logger')
cmab_logger.setLevel(logging.DEBUG)

# Ensure it doesn't add handlers multiple times if module reloads
if not cmab_logger.handlers:
    # Log to backend/cmab_debug.log
    file_handler = logging.FileHandler('cmab_debug.log')
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    cmab_logger.addHandler(file_handler)

class LinUCBAgent:
    """
    Contextual Multi-Armed Bandit using the LinUCB algorithm.
    Optimizes recommendations based on student context.
    """
    def __init__(self, alpha=0.5, d=12):
        self.alpha = alpha # Exploration parameter
        self.d = d # Dimension of context vector
        
    def _get_params(self, item_type: str, item_id: int):
        """Fetch or initialize A and b for a given polymorphic arm."""
        param = BanditParam.query.filter_by(
            item_type=item_type, 
            item_id=item_id
        ).first()
        
        if not param:
            # Initialize A as Identity Matrix, b as Zero Vector
            A = np.identity(self.d)
            b = np.zeros(self.d)
            
            param = BanditParam(
                item_type=item_type,
                item_id=item_id,
                matrix_a=json.dumps(A.tolist()),
                vector_b=json.dumps(b.tolist())
            )
            db.session.add(param)
            db.session.flush() # Flush to assign param an ID but don't commit yet
        else:
            A = np.array(json.loads(param.matrix_a))
            b = np.array(json.loads(param.vector_b))
            
        return param, A, b

    def select_action(self, context_vector: np.ndarray, available_arms: list) -> BanditArm:
        """
        Selects the best arm to recommend based on the UCB score.
        Score = Expected Reward + Exploration Bonus.
        """
        best_score = float('-inf')
        best_arm = None
        
        # Ensure context vector is shaped (d, 1) for math
        x_t = context_vector.reshape(-1, 1)
        
        cmab_logger.debug(f"Action Selection - Context Vector: {context_vector.tolist()}")
        
        for arm in available_arms:
            param, A, b = self._get_params(arm.item_type, arm.item_id)
            
            # 1. Compute Theta (A^-1 * b)
            # Use pseudo-inverse for stability just in case A gets close to singular
            A_inv = np.linalg.pinv(A)
            theta_a = np.dot(A_inv, b).reshape(-1, 1)
            
            # 2. Compute Expected Reward
            expected_reward = np.dot(x_t.T, theta_a)[0][0]
            
            # 3. Compute Exploration Bonus
            exploration_bonus = self.alpha * np.sqrt(np.dot(np.dot(x_t.T, A_inv), x_t)[0][0])
            
            # 4. Final Score
            ucb_score = expected_reward + exploration_bonus
            
            cmab_logger.debug(f"Arm {arm.item_type}:{arm.item_id} ({arm.title}) | Expected: {expected_reward:.4f} | Bonus: {exploration_bonus:.4f} | Final UCB: {ucb_score:.4f}")
            
            if ucb_score > best_score:
                best_score = ucb_score
                best_arm = arm
                
        cmab_logger.info(f"WINNER: Arm {best_arm.item_type}:{best_arm.item_id} with highest UCB score {best_score:.4f}\n")
        
        # Optional: Save any new parameters initialized during this pass
        db.session.commit()
        
        return best_arm

    def update(self, item_type: str, item_id: int, context_vector: np.ndarray, reward: float):
        """
        Update the parameters for the selected action after observing the reward.
        """
        param, A, b = self._get_params(item_type, item_id)
        
        x_t = context_vector.reshape(-1, 1)
        
        # Ridge regression parameter update rules
        # A = A + x_t * x_t^T
        A_new = A + np.dot(x_t, x_t.T)
        
        # b = b + reward * x_t
        b_new = b + (reward * x_t.flatten())
        
        # Save back to database
        param.matrix_a = json.dumps(A_new.tolist())
        param.vector_b = json.dumps(b_new.tolist())
        db.session.commit()

def process_rewards_and_update(user_id: int, current_accuracy: float, agent: LinUCBAgent):
    """
    Finds unrewarded learning logs for the user, calculates the reward using the CMAB formula, 
    and updates the bandit parameters.
    """
    from app.models import LearningLog, Resource
    
    pending_logs = LearningLog.query.filter_by(user_id=user_id, immediate_outcome=None).all()
    
    for log in pending_logs:
        # Reconstruct old context
        old_context_list = log.state_dict.get('context_vector')
        if not old_context_list:
            continue
        old_context = np.array(old_context_list, dtype=np.float32)
        
        # Calculate Improvement (Accuracy - old_accuracy)
        old_accuracy = log.state_dict.get('last_quiz_score', 0.5)
        improvement = current_accuracy - old_accuracy
        
        # Calculate Difficulty Mismatch
        item_type = log.action_type
        item_id = log.action_id
        
        # Polymorphic record fetch depending on what the action was
        item = None
        if item_type == 'lesson':
            item = Lesson.query.get(item_id)
        elif item_type == 'resource':
            item = Resource.query.get(item_id)
            
        if item:
            # Both Lesson and Resource should have a difficulty string, but default to intermediate just in case
            diff_str = getattr(item, 'difficulty', 'intermediate')
            diff_map = {'beginner': 0.3, 'easy': 0.3, 'intermediate': 0.6, 'advanced': 0.9, 'hard': 0.9}
            res_diff = diff_map.get(diff_str.lower() if diff_str else 'intermediate', 0.6)
            
            # Simple average of core concept mastery (first 8 dims)
            mastery_avg = np.mean(old_context[:8]) if len(old_context) >= 8 else 0.5
            
            mismatch = abs(res_diff - mastery_avg)
            
            # CMAB Reward Formula: r = 0.5(Accuracy) + 0.3(Improvement) - 0.2(Difficulty Mismatch)
            reward = (0.5 * current_accuracy) + (0.3 * improvement) - (0.2 * mismatch)
            
            cmab_logger.info(f"Processing Reward for User {user_id}, Arm {item_type}:{item_id} ({getattr(item, 'title', 'Unknown')})")
            cmab_logger.debug(f"Accuracy: {current_accuracy:.4f} (Old: {old_accuracy:.4f} -> Improv: {improvement:.4f})")
            cmab_logger.debug(f"Difficulty Mismatch: {mismatch:.4f} (Item Diff: {res_diff} vs Mastery Avg: {mastery_avg:.4f})")
            cmab_logger.info(f"Calculated Final Reward: {reward:.4f} [Weights: 0.5(Acc) + 0.3(Imp) - 0.2(Mis)]\n")
            
            # Update the agent
            agent.update(item_type, item_id, old_context, reward)
            
            # Save outcome
            log.immediate_outcome = reward
            db.session.add(log)
            
    db.session.commit()
