from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import Recommendation

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('', methods=['GET'])
@jwt_required()
def get_recommendations():
    user_id = get_jwt_identity()
    
    status = request.args.get('status', 'active')
    
    query = Recommendation.query.filter_by(user_id=user_id)
    
    if status != 'all':
        query = query.filter_by(status=status)
    
    recommendations = query.order_by(
        Recommendation.created_at.desc()
    ).all()
    
    return jsonify({
        'recommendations': [r.to_dict() for r in recommendations]
    }), 200


@recommendations_bp.route('/<int:recommendation_id>/complete', methods=['POST'])
@jwt_required()
def complete_recommendation(recommendation_id):
    user_id = get_jwt_identity()
    
    recommendation = Recommendation.query.filter_by(
        id=recommendation_id, 
        user_id=user_id
    ).first_or_404()
    
    recommendation.status = 'completed'
    recommendation.completed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Recommendation marked as completed',
        'recommendation': recommendation.to_dict()
    }), 200


@recommendations_bp.route('/<int:recommendation_id>/dismiss', methods=['POST'])
@jwt_required()
def dismiss_recommendation(recommendation_id):
    user_id = get_jwt_identity()
    
    recommendation = Recommendation.query.filter_by(
        id=recommendation_id, 
        user_id=user_id
    ).first_or_404()
    
    recommendation.status = 'dismissed'
    
    db.session.commit()
    
    return jsonify({
        'message': 'Recommendation dismissed'
    }), 200


@recommendations_bp.route('/<int:recommendation_id>/rate', methods=['POST'])
@jwt_required()
def rate_recommendation(recommendation_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    recommendation = Recommendation.query.filter_by(
        id=recommendation_id, 
        user_id=user_id
    ).first_or_404()
    
    recommendation.user_rating = data.get('rating')
    recommendation.user_feedback = data.get('feedback', '')
    
    db.session.commit()
    
    return jsonify({
        'message': 'Rating submitted',
        'recommendation': recommendation.to_dict()
    }), 200


@recommendations_bp.route('/by-submission/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_recommendations_by_submission(submission_id):
    user_id = get_jwt_identity()
    
    recommendations = Recommendation.query.filter_by(
        user_id=user_id,
        submission_id=submission_id
    ).all()
    
    return jsonify({
        'recommendations': [r.to_dict() for r in recommendations]
    }), 200