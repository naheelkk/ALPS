from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import Assessment, AssessmentSubmission, Enrollment
from datetime import datetime
import os
import uuid

assessments_bp = Blueprint('assessments', __name__)

def allowed_file(filename, allowed_extensions):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def save_file(file, folder):
    if not file:
        return None
    
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], folder)
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    return f"/api/uploads/{folder}/{unique_filename}"


@assessments_bp.route('/courses/<int:course_id>/assessments', methods=['GET'])
@jwt_required()
def get_course_assessments(course_id):
    """Get all published assessments for a course"""
    user_id = int(get_jwt_identity())
    
    # Check if enrolled
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({'message': 'Not enrolled in this course'}), 403
    
    assessments = Assessment.query.filter_by(
        course_id=course_id,
        is_published=True
    ).order_by(Assessment.order).all()
    
    result = []
    for assessment in assessments:
        data = assessment.to_dict()
        
        # Check if user has submitted
        submission = AssessmentSubmission.query.filter_by(
            assessment_id=assessment.id,
            user_id=user_id
        ).first()
        
        data['has_submitted'] = submission is not None
        data['submission'] = submission.to_dict() if submission else None
        
        result.append(data)
    
    return jsonify({'assessments': result}), 200


@assessments_bp.route('/assessments/<int:assessment_id>', methods=['GET'])
@jwt_required()
def get_assessment(assessment_id):
    """Get assessment details"""
    user_id = int(get_jwt_identity())
    
    assessment = Assessment.query.get_or_404(assessment_id)
    
    # Check if enrolled
    enrollment = Enrollment.query.filter_by(
        user_id=user_id, 
        course_id=assessment.course_id
    ).first()
    
    if not enrollment:
        return jsonify({'message': 'Not enrolled in this course'}), 403
    
    data = assessment.to_dict()
    
    # Get user's submission if exists
    submission = AssessmentSubmission.query.filter_by(
        assessment_id=assessment_id,
        user_id=user_id
    ).first()
    
    data['submission'] = submission.to_dict() if submission else None
    
    return jsonify(data), 200


@assessments_bp.route('/assessments/<int:assessment_id>/submit', methods=['POST'])
@jwt_required()
def submit_assessment(assessment_id):
    print(f"DEBUG: Processing submission for assessment {assessment_id}")
    print(f"DEBUG: Request files: {request.files}")
    print(f"DEBUG: Request headers: {request.headers}")
    
    """Submit an assessment"""
    user_id = int(get_jwt_identity())
    print(f"DEBUG: User ID: {user_id}")
    
    assessment = Assessment.query.get_or_404(assessment_id)
    
    # Check if enrolled
    enrollment = Enrollment.query.filter_by(
        user_id=user_id, 
        course_id=assessment.course_id
    ).first()
    
    if not enrollment:
        return jsonify({'message': 'Not enrolled in this course'}), 403
    
    # Check due date
    if assessment.due_date and datetime.utcnow() > assessment.due_date:
        return jsonify({'message': 'Assessment deadline has passed'}), 400
    
    # Check if already submitted
    existing = AssessmentSubmission.query.filter_by(
        assessment_id=assessment_id,
        user_id=user_id
    ).first()
    
    if existing:
        return jsonify({'message': 'You have already submitted this assessment'}), 400
    
    # Handle file upload
    if 'file' not in request.files:
        return jsonify({'message': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    # Check file type
    allowed_types = set(assessment.file_types_allowed.split(','))
    if not allowed_file(file.filename, allowed_types):
        return jsonify({
            'message': f'File type not allowed. Allowed types: {assessment.file_types_allowed}'
        }), 400
    
    # Save file
    file_url = save_file(file, 'submissions')
    
    submission = AssessmentSubmission(
        assessment_id=assessment_id,
        user_id=user_id,
        file_url=file_url,
        file_name=secure_filename(file.filename),
        file_size=file.content_length or 0,
        comments=request.form.get('comments', ''),
        status='submitted'
    )
    
    db.session.add(submission)
    db.session.commit()
    
    return jsonify({
        'message': 'Assessment submitted successfully',
        'submission': submission.to_dict()
    }), 201


@assessments_bp.route('/my-submissions', methods=['GET'])
@jwt_required()
def get_my_submissions():
    """Get all submissions for current user"""
    user_id = int(get_jwt_identity())
    
    submissions = AssessmentSubmission.query.filter_by(
        user_id=user_id
    ).order_by(AssessmentSubmission.submitted_at.desc()).all()
    
    return jsonify({
        'submissions': [s.to_dict() for s in submissions]
    }), 200