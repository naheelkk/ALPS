from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models import Course, Enrollment, Lesson, LessonProgress, Assessment, Quiz, AssessmentSubmission

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('', methods=['GET'])
def get_courses():
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user_id = int(user_id)  # Convert to int
        print(f"User ID from token: {user_id}")
    except Exception as e:
        print(f"No valid token: {e}")
    
    category = request.args.get('category')
    level = request.args.get('level')
    search = request.args.get('search')
    duration = request.args.get('duration')
    sort_by = request.args.get('sort', 'newest')
    
    query = Course.query
    
    if category and category != 'All':
        query = query.filter_by(category=category)
    if level and level != 'All Levels':
        query = query.filter_by(level=level)
    if duration:
        # Simple duration filter (e.g. "short", "medium", "long")
        # This would require standardized duration strings or parsing
        query = query.filter(Course.duration.ilike(f'%{duration}%'))
        
    if search:
        query = query.filter(
            Course.title.ilike(f'%{search}%') | 
            Course.description.ilike(f'%{search}%')
        )
        
    # Sorting
    if sort_by == 'popular':
        query = query.order_by(Course.enrolled_count.desc())
    elif sort_by == 'rating':
        query = query.order_by(Course.rating.desc())
    elif sort_by == 'price_low':
        query = query.order_by(Course.price.asc())
    elif sort_by == 'price_high':
        query = query.order_by(Course.price.desc())
    else: # newest
        query = query.order_by(Course.created_at.desc())
    
    courses = query.all()
    print(f"Found {len(courses)} courses")
    
    enrolled_course_ids = set()
    if user_id:
        enrolled_course_ids = {
            e.course_id for e in Enrollment.query.filter_by(user_id=user_id).all()
        }
    
    result = []
    for course in courses:
        course_data = course.to_dict()
        course_data['is_enrolled'] = course.id in enrolled_course_ids
        if course.id in enrolled_course_ids:
            enrollment = Enrollment.query.filter_by(
                user_id=user_id, 
                course_id=course.id
            ).first()
            course_data['progress'] = enrollment.progress if enrollment else 0
        result.append(course_data)
    
    return jsonify({'courses': result}), 200


@courses_bp.route('/enrolled', methods=['GET'])
def get_enrolled_courses():
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user_id = int(user_id)  # Convert to int
        print(f"User ID for enrolled courses: {user_id}")
    except Exception as e:
        print(f"No valid token for enrolled: {e}")
        return jsonify({'courses': []}), 200
    
    if not user_id:
        return jsonify({'courses': []}), 200
    
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    
    result = []
    for enrollment in enrollments:
        course_data = enrollment.course.to_dict()
        course_data['is_enrolled'] = True
        course_data['progress'] = enrollment.progress
        course_data['enrolled_at'] = enrollment.enrolled_at.isoformat()
        
        total_lessons = enrollment.course.lessons.count()
        completed_lessons = LessonProgress.query.filter_by(
            user_id=user_id
        ).join(Lesson).filter(
            Lesson.course_id == enrollment.course_id,
            LessonProgress.completed == True
        ).count()
        
        course_data['lessons_completed'] = completed_lessons
        course_data['total_lessons'] = total_lessons
        
        result.append(course_data)
    
    return jsonify({'courses': result}), 200


@courses_bp.route('/<int:course_id>', methods=['GET'])
def get_course(course_id):
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user_id = int(user_id)  # Convert to int
    except:
        pass
    
    course = Course.query.get_or_404(course_id)
    
    enrollment = None
    if user_id:
        enrollment = Enrollment.query.filter_by(
            user_id=user_id, 
            course_id=course_id
        ).first()
    
    course_data = course.to_dict(include_lessons=True)
    course_data['is_enrolled'] = enrollment is not None
    
    if enrollment:
        course_data['progress'] = enrollment.progress
        
        completed_lesson_ids = {
            lp.lesson_id for lp in LessonProgress.query.filter_by(
                user_id=user_id
            ).join(Lesson).filter(
                Lesson.course_id == course_id,
                LessonProgress.completed == True
            ).all()
        }
        
        for lesson in course_data.get('lessons', []):
            lesson['completed'] = lesson['id'] in completed_lesson_ids
    
    course_data['quizzes'] = [
        quiz.to_dict() for quiz in course.quizzes.all()
    ]

    course_data['assessments'] = []
    
    # Direct query to ensure we get assessments even if relationship lazy loading is weird
    assessments_list = Assessment.query.filter_by(course_id=course_id).all()
    print(f"DEBUG: Found {len(assessments_list)} assessments for course {course_id} (Direct Query)")
    for a in assessments_list:
        print(f" - Assessment: {a.id} | {a.title} | Published: {a.is_published}")
    
    if assessments_list:
        course_data['assessments'] = []
        for assessment in assessments_list:
            a_data = assessment.to_dict()
            if user_id:
                submission = AssessmentSubmission.query.filter_by(
                    assessment_id=assessment.id,
                    user_id=user_id
                ).first()
                if submission:
                    a_data['submitted'] = True
                    a_data['submitted_at'] = submission.submitted_at.isoformat() if submission.submitted_at else None
                    a_data['grade'] = submission.score
                    a_data['feedback'] = submission.comments
            course_data['assessments'].append(a_data)
    
    return jsonify(course_data), 200


@courses_bp.route('/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_course(course_id):
    user_id = int(get_jwt_identity())  # Convert to int
    course = Course.query.get_or_404(course_id)
    
    existing = Enrollment.query.filter_by(
        user_id=user_id, 
        course_id=course_id
    ).first()
    
    if existing:
        return jsonify({'message': 'Already enrolled'}), 409
    
    enrollment = Enrollment(user_id=user_id, course_id=course_id)
    course.enrolled_count += 1
    
    db.session.add(enrollment)
    db.session.commit()
    
    return jsonify({
        'message': 'Enrolled successfully',
        'enrollment': {
            'course_id': course_id,
            'enrolled_at': enrollment.enrolled_at.isoformat()
        }
    }), 201


@courses_bp.route('/<int:course_id>/enroll', methods=['DELETE'])
@jwt_required()
def unenroll_course(course_id):
    user_id = int(get_jwt_identity())  # Convert to int
    
    enrollment = Enrollment.query.filter_by(
        user_id=user_id, 
        course_id=course_id
    ).first()
    
    if not enrollment:
        return jsonify({'message': 'Not enrolled'}), 404
    
    course = Course.query.get(course_id)
    if course:
        course.enrolled_count = max(0, course.enrolled_count - 1)
    
    db.session.delete(enrollment)
    db.session.commit()
    
    return jsonify({'message': 'Unenrolled successfully'}), 200


@courses_bp.route('/<int:course_id>/quizzes', methods=['GET'])
def get_course_quizzes(course_id):
    course = Course.query.get_or_404(course_id)
    quizzes = [quiz.to_dict() for quiz in course.quizzes.all()]
    return jsonify({'quizzes': quizzes}), 200


@courses_bp.route('/<int:course_id>/lessons/<int:lesson_id>/complete', methods=['POST'])
@jwt_required()
def complete_lesson(course_id, lesson_id):
    user_id = int(get_jwt_identity())  # Convert to int
    
    lesson = Lesson.query.filter_by(
        id=lesson_id, 
        course_id=course_id
    ).first_or_404()
    
    progress = LessonProgress.query.filter_by(
        user_id=user_id, 
        lesson_id=lesson_id
    ).first()
    
    if not progress:
        progress = LessonProgress(user_id=user_id, lesson_id=lesson_id)
        db.session.add(progress)
    
    progress.completed = True
    progress.completed_at = db.func.now()
    
    enrollment = Enrollment.query.filter_by(
        user_id=user_id, 
        course_id=course_id
    ).first()
    
    if enrollment:
        total_lessons = Lesson.query.filter_by(course_id=course_id).count()
        completed_lessons = LessonProgress.query.filter_by(
            user_id=user_id
        ).join(Lesson).filter(
            Lesson.course_id == course_id,
            LessonProgress.completed == True
        ).count()
        
        enrollment.progress = (completed_lessons / total_lessons) * 100 if total_lessons > 0 else 0
    
    db.session.commit()
    
    return jsonify({
        'message': 'Lesson completed',
        'progress': enrollment.progress if enrollment else 0
    }), 200