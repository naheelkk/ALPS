from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime
from app import db
from app.models import Quiz, Question, Submission, Answer, Enrollment
from app.models.resource import Resource
from app.services.adaptive_engine import AdaptiveEngine

quizzes_bp = Blueprint('quizzes', __name__)

@quizzes_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
@jwt_required(optional=True)
def get_quiz(quiz_id):
    """Get quiz details without questions"""
    quiz = Quiz.query.get_or_404(quiz_id)
    return jsonify(quiz.to_dict(include_questions=False)), 200


@quizzes_bp.route('/quizzes/<int:quiz_id>/start', methods=['POST'])
@jwt_required()
def start_quiz(quiz_id):
    """Start a quiz - return quiz with questions"""
    user_id = int(get_jwt_identity())
    
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Check if user is enrolled in the course
    enrollment = Enrollment.query.filter_by(
        user_id=user_id,
        course_id=quiz.course_id
    ).first()
    
    if not enrollment:
        return jsonify({'message': 'You must be enrolled in this course to take the quiz'}), 403
    
    # Return quiz with questions
    return jsonify({
        'quiz': quiz.to_dict(),
        'questions': [q.to_dict(hide_answer=True) for q in quiz.questions.all()]
    }), 200


@quizzes_bp.route('/quizzes/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(quiz_id):
    """Submit quiz answers"""
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json()
    
    # Check enrollment
    enrollment = Enrollment.query.filter_by(
        user_id=user_id,
        course_id=quiz.course_id
    ).first()
    
    if not enrollment:
        return jsonify({'message': 'You must be enrolled in this course'}), 403
    
    answers_data = data.get('answers', [])
    
    # Calculate score
    correct_count = 0
    total_time = 0
    
    # Create submission
    submission = Submission(
        user_id=user_id,
        quiz_id=quiz_id,
        score=0,
        total_questions=quiz.questions.count(),
        correct_answers=0,
        started_at=datetime.utcnow()
    )
    db.session.add(submission)
    db.session.flush()
    
    # Process answers
    concept_results = {}
    
    for answer_data in answers_data:
        question_id = answer_data.get('question_id')
        selected_answer = answer_data.get('selected_answer')
        time_spent = answer_data.get('time_spent', 0)
        
        question = Question.query.get(question_id)
        if not question or question.quiz_id != quiz_id:
            continue
        
        is_correct = selected_answer == question.correct_answer
        if is_correct:
            correct_count += 1
        
        total_time += time_spent
        
        # Track by concept
        concept = question.concept or 'General'
        if concept not in concept_results:
            concept_results[concept] = {'correct': 0, 'total': 0}
        concept_results[concept]['total'] += 1
        if is_correct:
            concept_results[concept]['correct'] += 1
        
        # Create answer record
        answer = Answer(
            submission_id=submission.id,
            question_id=question_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            time_spent=time_spent
        )
        db.session.add(answer)
    
    # Update submission
    submission.correct_answers = correct_count
    submission.score = (correct_count / submission.total_questions) * 100 if submission.total_questions > 0 else 0
    submission.time_taken = total_time
    
    db.session.commit()
    
    # Generate recommendations
    try:
        adaptive_engine = AdaptiveEngine()
        recommendations = adaptive_engine.generate_recommendations(
            user_id=user_id,
            submission_id=submission.id,
            concept_results=concept_results
        )
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        recommendations = []
    
    # Calculate concept scores
    concept_scores = {
        concept: data['correct'] / data['total'] if data['total'] > 0 else 0
        for concept, data in concept_results.items()
    }
    
    # Update course progress
    update_course_progress(user_id, quiz.course_id)
    
    return jsonify({
        'message': 'Quiz submitted successfully',
        'submission_id': submission.id,
        'score': submission.score,
        'correct_answers': submission.correct_answers,
        'total_questions': submission.total_questions,
        'time_taken': submission.time_taken,
        'concept_scores': concept_scores,
        'recommendations_count': len(recommendations)
    }), 201


@quizzes_bp.route('/submissions/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_submission(submission_id):
    """Get detailed quiz results"""
    user_id = int(get_jwt_identity())
    
    submission = Submission.query.filter_by(
        id=submission_id,
        user_id=user_id
    ).first_or_404()
    
    # Get detailed results
    result = submission.to_dict(include_answers=True)
    
    # Calculate concept scores
    concept_results = {}
    for answer in submission.answers.all():
        concept = answer.question.concept or 'General'
        if concept not in concept_results:
            concept_results[concept] = {'correct': 0, 'total': 0}
        concept_results[concept]['total'] += 1
        if answer.is_correct:
            concept_results[concept]['correct'] += 1
    
    result['concept_scores'] = {
        concept: data['correct'] / data['total'] if data['total'] > 0 else 0
        for concept, data in concept_results.items()
    }
    
    return jsonify(result), 200


@quizzes_bp.route('/quizzes/<int:quiz_id>/history', methods=['GET'])
@jwt_required()
def get_quiz_history(quiz_id):
    """Get user's quiz attempt history"""
    user_id = int(get_jwt_identity())
    
    submissions = Submission.query.filter_by(
        user_id=user_id,
        quiz_id=quiz_id
    ).order_by(Submission.submitted_at.desc()).all()
    
    return jsonify({
        'history': [s.to_dict() for s in submissions]
    }), 200


def update_course_progress(user_id, course_id):
    """Update course progress based on completed quizzes and lessons"""
    from app.models import Lesson, LessonProgress
    
    enrollment = Enrollment.query.filter_by(
        user_id=user_id,
        course_id=course_id
    ).first()
    
    if not enrollment:
        return
    
    # Get total items (lessons + quizzes)
    total_lessons = Lesson.query.filter_by(course_id=course_id).count()
    total_quizzes = Quiz.query.filter_by(course_id=course_id).count()
    total_items = total_lessons + total_quizzes
    
    if total_items == 0:
        return
    
    # Count completed items
    completed_lessons = LessonProgress.query.filter_by(
        user_id=user_id,
        completed=True
    ).join(Lesson).filter(
        Lesson.course_id == course_id
    ).count()
    
    completed_quizzes = Submission.query.join(Quiz).filter(
        Submission.user_id == user_id,
        Quiz.course_id == course_id
    ).distinct(Submission.quiz_id).count()
    
    completed_items = completed_lessons + completed_quizzes
    
    # Calculate progress
    enrollment.progress = (completed_items / total_items) * 100
    
    # Check if course is completed
    if enrollment.progress >= 100 and not enrollment.completed_at:
        enrollment.completed_at = datetime.utcnow()
        enrollment.status = 'completed'
    
    db.session.commit()