from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from werkzeug.utils import secure_filename
from app import db
from app.models import User, Course, Quiz, Question, Lesson, LessonContent, Enrollment, Submission, Assessment, AssessmentSubmission, AdaptiveRule
from sqlalchemy import func
from datetime import datetime, timedelta
import json
import os
import uuid

admin_bp = Blueprint('admin', __name__)

# Utility functions
def allowed_file(filename, allowed_extensions):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def save_file(file, folder):
    """Save uploaded file and return the path"""
    if not file:
        return None
    
    filename = secure_filename(file.filename)
    # Add unique id to prevent overwrites
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], folder)
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    return f"/api/uploads/{folder}/{unique_filename}"

# Decorators
def tutor_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role not in ['tutor', 'admin']:
            return jsonify({'message': 'Tutor or Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


# ============== DASHBOARD STATS ==============

@admin_bp.route('/stats', methods=['GET'])
@tutor_required
def get_admin_stats():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    # Get stats based on role
    if user.role == 'admin':
        total_courses = Course.query.count()
        total_students = User.query.filter_by(role='student').count()
        total_enrollments = Enrollment.query.count()
    else:
        # Tutor sees only their courses
        total_courses = Course.query.filter_by(instructor_id=user_id).count()
        course_ids = [c.id for c in Course.query.filter_by(instructor_id=user_id).all()]
        total_enrollments = Enrollment.query.filter(Enrollment.course_id.in_(course_ids)).count() if course_ids else 0
        total_students = db.session.query(func.count(func.distinct(Enrollment.user_id))).filter(
            Enrollment.course_id.in_(course_ids)
        ).scalar() if course_ids else 0
    
    total_submissions = Submission.query.count()
    pending_assessments = AssessmentSubmission.query.filter_by(status='submitted').count()
    
    avg_score = db.session.query(func.avg(Submission.score)).scalar() or 0
    
    # Recent activity
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_enrollments = Enrollment.query.filter(Enrollment.enrolled_at >= week_ago).count()
    
    # Top courses
    top_courses = db.session.query(
        Course.id,
        Course.title,
        func.count(Enrollment.id).label('enrollment_count')
    ).outerjoin(Enrollment).group_by(Course.id).order_by(
        func.count(Enrollment.id).desc()
    ).limit(5).all()
    
    return jsonify({
        'total_courses': total_courses,
        'total_students': total_students,
        'total_enrollments': total_enrollments,
        'total_submissions': total_submissions,
        'pending_assessments': pending_assessments,
        'recent_enrollments': recent_enrollments,
        'average_score': round(avg_score, 1),
        'top_courses': [
            {'id': c[0], 'title': c[1], 'enrollments': c[2]}
            for c in top_courses
        ]
    }), 200


# ============== COURSE MANAGEMENT ==============

@admin_bp.route('/courses', methods=['GET'])
@tutor_required
def get_admin_courses():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role == 'admin':
        courses = Course.query.order_by(Course.created_at.desc()).all()
    else:
        courses = Course.query.filter_by(instructor_id=user_id).order_by(Course.created_at.desc()).all()
    
    return jsonify({
        'courses': [c.to_dict() for c in courses]
    }), 200


@admin_bp.route('/courses', methods=['POST'])
@tutor_required
def create_course():
    """Create a new course"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        category = data.get('category', 'General')
        level = data.get('level', 'Beginner')
        duration = data.get('duration', '')
        price = float(data.get('price', 0))
        is_published = data.get('is_published', False)
        thumbnail_url = None
        preview_video_url = None
    else:
        title = request.form.get('title')
        description = request.form.get('description')
        category = request.form.get('category', 'General')
        level = request.form.get('level', 'Beginner')
        duration = request.form.get('duration', '')
        price = float(request.form.get('price', 0))
        is_published = request.form.get('is_published', 'false').lower() == 'true'
        
        # Handle file uploads
        thumbnail_url = None
        preview_video_url = None
        
        if 'thumbnail' in request.files:
            thumbnail = request.files['thumbnail']
            if thumbnail and thumbnail.filename:
                thumbnail_url = save_file(thumbnail, 'thumbnails')
        
        if 'preview_video' in request.files:
            preview_video = request.files['preview_video']
            if preview_video and preview_video.filename:
                preview_video_url = save_file(preview_video, 'videos')
    
    # Validate required fields
    if not title:
        return jsonify({'message': 'Course title is required'}), 400
    
    course = Course(
        title=title,
        description=description,
        category=category,
        level=level,
        duration=duration,
        price=price,
        instructor_id=user_id,
        instructor_name=user.name,
        thumbnail_url=thumbnail_url,
        preview_video_url=preview_video_url,
        is_published=is_published
    )
    
    db.session.add(course)
    db.session.commit()
    
    return jsonify({
        'message': 'Course created successfully',
        'course': course.to_dict()
    }), 201

@admin_bp.route('/courses/<int:course_id>', methods=['GET'])
@tutor_required
def get_admin_course(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    # Check permission
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    course_data = course.to_dict(include_lessons=True)
    course_data['quizzes'] = [q.to_dict(include_questions=True, hide_answers=False) for q in course.quizzes.all()]
    course_data['assessments'] = [a.to_dict() for a in course.assessments.all()]
    
    return jsonify(course_data), 200


@admin_bp.route('/courses/<int:course_id>', methods=['PUT'])
@tutor_required
def update_course(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    course.title = data.get('title', course.title)
    course.description = data.get('description', course.description)
    course.category = data.get('category', course.category)
    course.level = data.get('level', course.level)
    course.duration = data.get('duration', course.duration)
    course.price = float(data.get('price', course.price))
    
    if 'is_published' in data:
        course.is_published = data['is_published'] if isinstance(data['is_published'], bool) else data['is_published'].lower() == 'true'
    
    # Handle file uploads
    if 'thumbnail' in request.files:
        thumbnail = request.files['thumbnail']
        if thumbnail and allowed_file(thumbnail.filename, current_app.config['ALLOWED_IMAGE_EXTENSIONS']):
            course.thumbnail_url = save_file(thumbnail, 'thumbnails')
    
    if 'preview_video' in request.files:
        preview_video = request.files['preview_video']
        if preview_video and allowed_file(preview_video.filename, current_app.config['ALLOWED_VIDEO_EXTENSIONS']):
            course.preview_video_url = save_file(preview_video, 'videos')
    
    db.session.commit()
    
    return jsonify({
        'message': 'Course updated',
        'course': course.to_dict()
    }), 200


@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@tutor_required
def delete_course(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    db.session.delete(course)
    db.session.commit()
    
    return jsonify({'message': 'Course deleted'}), 200


@admin_bp.route('/courses/<int:course_id>/publish', methods=['POST'])
@tutor_required
def toggle_publish_course(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    course.is_published = not course.is_published
    db.session.commit()
    
    return jsonify({
        'message': f"Course {'published' if course.is_published else 'unpublished'}",
        'is_published': course.is_published
    }), 200


# ============== LESSON MANAGEMENT ==============

@admin_bp.route('/courses/<int:course_id>/lessons', methods=['POST'])
@tutor_required
def create_lesson(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    title = request.form.get('title')
    description = request.form.get('description', '')
    content = request.form.get('content', '')
    lesson_type = request.form.get('type', 'video')
    duration = request.form.get('duration', '')
    is_free = request.form.get('is_free', 'false').lower() == 'true'
    
    max_lesson_order = db.session.query(func.max(Lesson.order)).filter_by(course_id=course_id).scalar() or 0
    max_quiz_order   = db.session.query(func.max(Quiz.order)).filter_by(course_id=course_id).scalar() or 0
    max_order = max(max_lesson_order, max_quiz_order)
    
    # Handle file uploads
    video_url = None
    file_url = None
    file_name = None
    
    if 'video' in request.files:
        video = request.files['video']
        if video and allowed_file(video.filename, current_app.config['ALLOWED_VIDEO_EXTENSIONS']):
            video_url = save_file(video, 'videos')
    
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename, current_app.config['ALLOWED_FILE_EXTENSIONS']):
            file_url = save_file(file, 'materials')
            file_name = secure_filename(file.filename)
    
    lesson = Lesson(
        course_id=course_id,
        title=title,
        description=description,
        content=content,
        type=lesson_type,
        duration=duration,
        video_url=video_url,
        file_url=file_url,
        file_name=file_name,
        is_free=is_free,
        order=max_order + 1
    )
    
    db.session.add(lesson)
    db.session.commit()
    
    return jsonify({
        'message': 'Lesson created',
        'lesson': lesson.to_dict()
    }), 201


@admin_bp.route('/lessons/<int:lesson_id>', methods=['PUT'])
@tutor_required
def update_lesson(lesson_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    lesson = Lesson.query.get_or_404(lesson_id)
    course = lesson.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    lesson.title = data.get('title', lesson.title)
    lesson.description = data.get('description', lesson.description)
    lesson.content = data.get('content', lesson.content)
    lesson.type = data.get('type', lesson.type)
    lesson.duration = data.get('duration', lesson.duration)
    
    if 'is_free' in data:
        lesson.is_free = data['is_free'] if isinstance(data['is_free'], bool) else data['is_free'].lower() == 'true'
    
    if 'order' in data:
        lesson.order = int(data['order'])
    
    # Handle file uploads
    if 'video' in request.files:
        video = request.files['video']
        if video and allowed_file(video.filename, current_app.config['ALLOWED_VIDEO_EXTENSIONS']):
            lesson.video_url = save_file(video, 'videos')
    
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename, current_app.config['ALLOWED_FILE_EXTENSIONS']):
            lesson.file_url = save_file(file, 'materials')
            lesson.file_name = secure_filename(file.filename)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Lesson updated',
        'lesson': lesson.to_dict()
    }), 200


@admin_bp.route('/lessons/<int:lesson_id>', methods=['DELETE'])
@tutor_required
def delete_lesson(lesson_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    lesson = Lesson.query.get_or_404(lesson_id)
    course = lesson.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    db.session.delete(lesson)
    db.session.commit()
    
    return jsonify({'message': 'Lesson deleted'}), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user (admin only)"""
    current_user_id = int(get_jwt_identity())
    
    if user_id == current_user_id:
        return jsonify({'message': 'Cannot delete yourself'}), 400
    
    user = User.query.get_or_404(user_id)
    
    # Delete user's enrollments, submissions, etc.
    Enrollment.query.filter_by(user_id=user_id).delete()
    Submission.query.filter_by(user_id=user_id).delete()
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200


# ============== ASSESSMENT MANAGEMENT ==============

@admin_bp.route('/courses/<int:course_id>/assessments', methods=['POST'])
@tutor_required
def create_assessment(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    assessment = Assessment(
        course_id=course_id,
        title=data.get('title'),
        description=data.get('description'),
        instructions=data.get('instructions'),
        max_score=data.get('max_score', 100),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        file_types_allowed=data.get('file_types_allowed', 'pdf,doc,docx,zip'),
        is_published=data.get('is_published', False)
    )
    
    db.session.add(assessment)
    db.session.commit()
    
    return jsonify({
        'message': 'Assessment created',
        'assessment': assessment.to_dict()
    }), 201


@admin_bp.route('/assessments/<int:assessment_id>', methods=['PUT'])
@tutor_required
def update_assessment(assessment_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    assessment = Assessment.query.get_or_404(assessment_id)
    course = assessment.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    assessment.title = data.get('title', assessment.title)
    assessment.description = data.get('description', assessment.description)
    assessment.instructions = data.get('instructions', assessment.instructions)
    assessment.max_score = data.get('max_score', assessment.max_score)
    assessment.file_types_allowed = data.get('file_types_allowed', assessment.file_types_allowed)
    assessment.is_published = data.get('is_published', assessment.is_published)
    
    if data.get('due_date'):
        assessment.due_date = datetime.fromisoformat(data['due_date'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Assessment updated',
        'assessment': assessment.to_dict()
    }), 200


@admin_bp.route('/assessments/<int:assessment_id>', methods=['DELETE'])
@tutor_required
def delete_assessment(assessment_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    assessment = Assessment.query.get_or_404(assessment_id)
    course = assessment.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    db.session.delete(assessment)
    db.session.commit()
    
    return jsonify({'message': 'Assessment deleted'}), 200


@admin_bp.route('/assessments/<int:assessment_id>/submissions', methods=['GET'])
@tutor_required
def get_assessment_submissions(assessment_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    assessment = Assessment.query.get_or_404(assessment_id)
    course = assessment.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    submissions = assessment.submissions.order_by(AssessmentSubmission.submitted_at.desc()).all()
    
    return jsonify({
        'submissions': [s.to_dict() for s in submissions]
    }), 200


@admin_bp.route('/submissions/<int:submission_id>/grade', methods=['POST'])
@tutor_required
def grade_submission(submission_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    submission = AssessmentSubmission.query.get_or_404(submission_id)
    course = submission.assessment.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    submission.score = data.get('score')
    submission.feedback = data.get('feedback')
    submission.graded_by = user_id
    submission.graded_at = datetime.utcnow()
    submission.status = 'graded'
    
    # Handle concept scores
    concept_scores = data.get('concept_scores')
    if concept_scores:
        submission.concept_scores = json.dumps(concept_scores)
        
        # Trigger adaptive engine recommendations
        try:
            from app.services.adaptive_engine import AdaptiveEngine
            engine = AdaptiveEngine()
            engine.generate_recommendations_from_assessment(
                user_id=submission.user_id,
                submission_id=submission.id,
                concept_scores=concept_scores,
                course_id=course.id
            )
        except Exception as e:
            print(f"Error generating recommendations: {e}")
    
    db.session.commit()
    
    return jsonify({
        'message': 'Submission graded',
        'submission': submission.to_dict()
    }), 200


# ============== QUIZ MANAGEMENT ==============

@admin_bp.route('/courses/<int:course_id>/quizzes', methods=['POST'])
@tutor_required
def create_quiz(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    # Auto-assign order: place after the last lesson OR quiz in this course,
    # whichever has the highest order. This ensures quizzes naturally slot
    # after the most recently added content.
    if data.get('order') is not None:
        quiz_order = int(data['order'])
    else:
        max_lesson_order = db.session.query(func.max(Lesson.order)).filter_by(course_id=course_id).scalar() or 0
        max_quiz_order   = db.session.query(func.max(Quiz.order)).filter_by(course_id=course_id).scalar() or 0
        quiz_order = max(max_lesson_order, max_quiz_order) + 1
    
    quiz = Quiz(
        course_id=course_id,
        title=data.get('title'),
        description=data.get('description'),
        time_limit=data.get('time_limit', 30),
        passing_score=data.get('passing_score', 0.6),
        order=quiz_order
    )
    
    db.session.add(quiz)
    db.session.commit()
    
    return jsonify({
        'message': 'Quiz created',
        'quiz': quiz.to_dict()
    }), 201


@admin_bp.route('/quizzes/<int:quiz_id>', methods=['PUT'])
@tutor_required
def update_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    quiz = Quiz.query.get_or_404(quiz_id)
    course = quiz.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    quiz.title = data.get('title', quiz.title)
    quiz.description = data.get('description', quiz.description)
    quiz.time_limit = data.get('time_limit', quiz.time_limit)
    quiz.passing_score = data.get('passing_score', quiz.passing_score)
    
    if 'order' in data:
        quiz.order = int(data['order'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Quiz updated',
        'quiz': quiz.to_dict()
    }), 200


@admin_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@tutor_required
def delete_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    quiz = Quiz.query.get_or_404(quiz_id)
    course = quiz.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    db.session.delete(quiz)
    db.session.commit()
    
    return jsonify({'message': 'Quiz deleted'}), 200


@admin_bp.route('/quizzes/<int:quiz_id>/questions', methods=['POST'])
@tutor_required
def create_question(quiz_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    quiz = Quiz.query.get_or_404(quiz_id)
    course = quiz.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    max_order = db.session.query(func.max(Question.order)).filter_by(quiz_id=quiz_id).scalar() or 0
    
    question = Question(
        quiz_id=quiz_id,
        question=data.get('question'),
        options=json.dumps(data.get('options', [])),
        correct_answer=data.get('correct_answer'),
        concept=data.get('concept', 'General'),
        subconcept=data.get('subconcept'),
        difficulty=data.get('difficulty', 'medium'),
        explanation=data.get('explanation'),
        order=data.get('order', max_order + 1)
    )
    
    db.session.add(question)
    db.session.commit()
    
    return jsonify({
        'message': 'Question created',
        'question': question.to_dict(hide_answer=False)
    }), 201


@admin_bp.route('/questions/<int:question_id>', methods=['PUT'])
@tutor_required
def update_question(question_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    question = Question.query.get_or_404(question_id)
    course = question.quiz.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    question.question = data.get('question', question.question)
    if 'options' in data:
        question.options = json.dumps(data['options'])
    question.correct_answer = data.get('correct_answer', question.correct_answer)
    question.concept = data.get('concept', question.concept)
    question.subconcept = data.get('subconcept', question.subconcept)
    question.difficulty = data.get('difficulty', question.difficulty)
    question.explanation = data.get('explanation', question.explanation)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Question updated',
        'question': question.to_dict(hide_answer=False)
    }), 200


@admin_bp.route('/questions/<int:question_id>', methods=['DELETE'])
@tutor_required
def delete_question(question_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    question = Question.query.get_or_404(question_id)
    course = question.quiz.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    db.session.delete(question)
    db.session.commit()
    
    return jsonify({'message': 'Question deleted'}), 200


# ============== USER MANAGEMENT ==============

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({
        'users': [u.to_dict() for u in users]
    }), 200


@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    data = request.get_json()
    user = User.query.get_or_404(user_id)
    new_role = data.get('role')
    
    if new_role not in ['student', 'tutor', 'admin']:
        return jsonify({'message': 'Invalid role'}), 400
    
    user.role = new_role
    db.session.commit()
    
    return jsonify({
        'message': 'User role updated',
        'user': user.to_dict()
    }), 200


# ============== COURSE STUDENTS ==============

@admin_bp.route('/courses/<int:course_id>/students', methods=['GET'])
@tutor_required
def get_course_students(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    
    students = []
    for enrollment in enrollments:
        student = enrollment.user
        
        # Get quiz stats
        submissions = Submission.query.join(Quiz).filter(
            Submission.user_id == student.id,
            Quiz.course_id == course_id
        ).all()
        
        avg_score = sum(s.score for s in submissions) / len(submissions) if submissions else 0
        
        # Get assessment stats
        assessment_submissions = AssessmentSubmission.query.join(Assessment).filter(
            AssessmentSubmission.user_id == student.id,
            Assessment.course_id == course_id
        ).all()
        
        students.append({
            'id': student.id,
            'name': student.name,
            'email': student.email,
            'progress': enrollment.progress,
            'status': enrollment.status,
            'enrolled_at': enrollment.enrolled_at.isoformat(),
            'quizzes_taken': len(submissions),
            'average_quiz_score': round(avg_score, 1),
            'assessments_submitted': len(assessment_submissions)
        })
    
    return jsonify({'students': students}), 200


# ============== ADAPTIVE RULES MANAGEMENT ==============

@admin_bp.route('/courses/<int:course_id>/rules', methods=['GET'])
@tutor_required
def get_course_rules(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    rules = AdaptiveRule.query.filter_by(course_id=course_id).all()
    
    return jsonify({
        'rules': [r.to_dict() for r in rules]
    }), 200


@admin_bp.route('/courses/<int:course_id>/rules', methods=['POST'])
@tutor_required
def create_rule(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    course = Course.query.get_or_404(course_id)
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    rule = AdaptiveRule(
        course_id=course_id,
        concept=data.get('concept'),
        threshold=float(data.get('threshold')),
        resource_title=data.get('resource_title'),
        resource_url=data.get('resource_url'),
        resource_type=data.get('resource_type', 'article'),
        priority=data.get('priority', 'medium')
    )
    
    db.session.add(rule)
    db.session.commit()
    
    return jsonify({
        'message': 'Rule created',
        'rule': rule.to_dict()
    }), 201


@admin_bp.route('/rules/<int:rule_id>', methods=['DELETE'])
@tutor_required
def delete_rule(rule_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    rule = AdaptiveRule.query.get_or_404(rule_id)
    course = rule.course
    
    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    db.session.delete(rule)
    db.session.commit()
    
    return jsonify({'message': 'Rule deleted'}), 200


# ============== LESSON CONTENT MANAGEMENT ==============

@admin_bp.route('/lessons/<int:lesson_id>/contents', methods=['GET'])
@tutor_required
def get_lesson_contents(lesson_id):
    """List all content blocks for a lesson, ordered by position."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    lesson = Lesson.query.get_or_404(lesson_id)
    course = lesson.course

    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403

    contents = lesson.contents.order_by(LessonContent.order).all()
    return jsonify({'contents': [c.to_dict() for c in contents]}), 200


@admin_bp.route('/lessons/<int:lesson_id>/contents', methods=['POST'])
@tutor_required
def create_lesson_content(lesson_id):
    """Create a new content block inside a lesson."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    lesson = Lesson.query.get_or_404(lesson_id)
    course = lesson.course

    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403

    data = request.get_json() or {}
    content_type = data.get('type', 'text')

    # Determine next order value
    max_order = db.session.query(func.max(LessonContent.order)).filter_by(lesson_id=lesson_id).scalar() or -1

    block = LessonContent(
        lesson_id=lesson_id,
        type=content_type,
        body=data.get('body'),
        language=data.get('language'),
        url=data.get('url'),
        file_name=data.get('file_name'),
        order=data.get('order', max_order + 1),
    )
    db.session.add(block)
    db.session.commit()

    return jsonify({'message': 'Content block created', 'content': block.to_dict()}), 201


@admin_bp.route('/lesson-contents/<int:content_id>', methods=['PUT'])
@tutor_required
def update_lesson_content(content_id):
    """Update a content block."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    block = LessonContent.query.get_or_404(content_id)
    course = block.lesson.course

    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403

    data = request.get_json() or {}
    block.type = data.get('type', block.type)
    block.body = data.get('body', block.body)
    block.language = data.get('language', block.language)
    block.url = data.get('url', block.url)
    block.file_name = data.get('file_name', block.file_name)
    if 'order' in data:
        block.order = int(data['order'])

    db.session.commit()
    return jsonify({'message': 'Content block updated', 'content': block.to_dict()}), 200


@admin_bp.route('/lesson-contents/<int:content_id>', methods=['DELETE'])
@tutor_required
def delete_lesson_content(content_id):
    """Delete a content block."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    block = LessonContent.query.get_or_404(content_id)
    course = block.lesson.course

    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403

    db.session.delete(block)
    db.session.commit()
    return jsonify({'message': 'Content block deleted'}), 200


@admin_bp.route('/lessons/<int:lesson_id>/contents/reorder', methods=['PUT'])
@tutor_required
def reorder_lesson_contents(lesson_id):
    """Bulk-reorder content blocks. Body: { "order": [id1, id2, id3, ...] }"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    lesson = Lesson.query.get_or_404(lesson_id)
    course = lesson.course

    if user.role != 'admin' and course.instructor_id != user_id:
        return jsonify({'message': 'Not authorized'}), 403

    data = request.get_json() or {}
    ordered_ids = data.get('order', [])

    for position, content_id in enumerate(ordered_ids):
        block = LessonContent.query.filter_by(id=content_id, lesson_id=lesson_id).first()
        if block:
            block.order = position

    db.session.commit()
    return jsonify({'message': 'Content reordered'}), 200