from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import datetime, timedelta
from app import db
from app.models import User, Submission, Enrollment, LessonProgress, Answer, Course, Quiz, Assessment, AssessmentSubmission

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('', methods=['GET'])
@jwt_required()
def get_overall_progress():
    user_id = get_jwt_identity()
    
    # Total quizzes taken
    total_quizzes = Submission.query.filter_by(user_id=user_id).count()
    
    # Average score
    avg_score = db.session.query(
        func.avg(Submission.score)
    ).filter_by(user_id=user_id).scalar() or 0
    
    # Total time spent (in minutes)
    total_time = db.session.query(
        func.sum(Submission.time_taken)
    ).filter_by(user_id=user_id).scalar() or 0
    
    # Courses completed
    courses_completed = Enrollment.query.filter_by(
        user_id=user_id
    ).filter(Enrollment.progress >= 100).count()
    
    # Calculate streak
    streak = calculate_streak(user_id)
    
    # Calculate badges
    badges = []
    
    # 1. First Quiz
    if total_quizzes > 0:
        badges.append({ 'name': 'First Quiz', 'icon': '🎯', 'earned': True })
    else:
        badges.append({ 'name': 'First Quiz', 'icon': '🎯', 'earned': False })
        
    # 2. Quick Learner (Avg > 80)
    if avg_score >= 80 and total_quizzes >= 5:
        badges.append({ 'name': 'Quick Learner', 'icon': '⚡', 'earned': True })
    else:
        badges.append({ 'name': 'Quick Learner', 'icon': '⚡', 'earned': False })

    # 3. Perfect Score
    has_perfect = False
    if total_quizzes > 0:
        has_perfect = Submission.query.filter_by(user_id=user_id, score=100).first() is not None
    
    badges.append({ 'name': 'Perfect Score', 'icon': '💯', 'earned': bool(has_perfect) })
    
    # 4. 7 Day Streak
    if streak >= 7:
        badges.append({ 'name': '7 Day Streak', 'icon': '🔥', 'earned': True })
    else:
        badges.append({ 'name': '7 Day Streak', 'icon': '🔥', 'earned': False })
        
    # 5. Course Complete
    if courses_completed > 0:
        badges.append({ 'name': 'Course Complete', 'icon': '🎓', 'earned': True })
    else:
        badges.append({ 'name': 'Course Complete', 'icon': '🎓', 'earned': False })

    return jsonify({
        'total_quizzes': total_quizzes,
        'average_score': round(avg_score, 1),
        'streak': streak,
        'total_time': total_time // 60,  # Convert to minutes
        'courses_completed': courses_completed,
        'badges': badges
    }), 200


@progress_bp.route('/mastery', methods=['GET'])
@jwt_required()
def get_mastery_levels():
    user_id = get_jwt_identity()
    
    # Get all answers grouped by concept
    concept_stats = db.session.query(
        Answer.submission_id,
        func.count(Answer.id).label('total'),
        func.sum(db.case((Answer.is_correct, 1), else_=0)).label('correct')
    ).join(Submission).filter(
        Submission.user_id == user_id
    ).group_by(Answer.submission_id).all()
    
    # Calculate mastery by concept from recent submissions
    answers = Answer.query.join(Submission).filter(
        Submission.user_id == user_id
    ).all()
    
    concept_results = {}
    for answer in answers:
        concept = answer.question.concept or 'General'
        if concept not in concept_results:
            concept_results[concept] = {'correct': 0, 'total': 0}
        concept_results[concept]['total'] += 1
        if answer.is_correct:
            concept_results[concept]['correct'] += 1
    
    concepts = [
        {
            'concept': concept,
            'mastery': round((data['correct'] / data['total']) * 100) if data['total'] > 0 else 0,
            'fullMark': 100
        }
        for concept, data in concept_results.items()
    ]
    
    return jsonify({'concepts': concepts}), 200


@progress_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_activity_history():
    user_id = get_jwt_identity()
    days = request.args.get('days', 7, type=int)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    submissions = Submission.query.filter(
        Submission.user_id == user_id,
        Submission.submitted_at >= start_date
    ).order_by(Submission.submitted_at).all()
    
    # Group by day
    daily_stats = {}
    for submission in submissions:
        day = submission.submitted_at.strftime('%a')
        if day not in daily_stats:
            daily_stats[day] = {'scores': [], 'count': 0}
        daily_stats[day]['scores'].append(submission.score)
        daily_stats[day]['count'] += 1
    
    history = [
        {
            'date': day,
            'score': round(sum(data['scores']) / len(data['scores'])) if data['scores'] else 0,
            'quizzes': data['count']
        }
        for day, data in daily_stats.items()
    ]
    
    return jsonify({'history': history, 'feed': get_recent_feed(user_id)}), 200


def get_recent_feed(user_id):
    """Get mixed feed of recent activity."""
    feed = []
    
    # 1. Quiz Submissions
    submissions = Submission.query.filter_by(user_id=user_id).order_by(Submission.submitted_at.desc()).limit(5).all()
    for sub in submissions:
        feed.append({
            'type': 'quiz',
            'title': sub.quiz.title,
            'score': sub.score,
            'date': sub.submitted_at,
            'timestamp': sub.submitted_at.timestamp()
        })
        
    # 2. Assessment Submissions
    assessments = AssessmentSubmission.query.filter_by(user_id=user_id).order_by(AssessmentSubmission.submitted_at.desc()).limit(5).all()
    for sub in assessments:
        feed.append({
            'type': 'assessment',
            'title': sub.assessment.title,
            'score': sub.score, # Might be None if not graded
            'status': sub.status,
            'date': sub.submitted_at,
            'timestamp': sub.submitted_at.timestamp()
        })
        
    # 3. Enrollments (New Courses)
    enrollments = Enrollment.query.filter_by(user_id=user_id).order_by(Enrollment.enrolled_at.desc()).limit(5).all()
    for enrollment in enrollments:
        feed.append({
            'type': 'course',
            'title': f'Started "{enrollment.course.title}"',
            'date': enrollment.enrolled_at,
            'timestamp': enrollment.enrolled_at.timestamp()
        })
        
        # Course Completion
        if enrollment.completed_at:
            feed.append({
                'type': 'achievement',
                'title': f'Completed "{enrollment.course.title}"',
                'date': enrollment.completed_at,
                'timestamp': enrollment.completed_at.timestamp()
            })
    
    # Sort by timestamp desc
    feed.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Format date for frontend relative time (e.g., "2 hours ago") logic can be done in frontend, 
    # but let's provide a nice string here too or just ISO
    
    # Return top 10
    return [
        {
            **item, 
            'date': format_relative_time(item['date'])
        } 
        for item in feed[:10]
    ]

def format_relative_time(dt):
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 365:
        return f"{diff.days // 365} years ago"
    if diff.days > 30:
        return f"{diff.days // 30} months ago"
    if diff.days > 0:
        return f"{diff.days} days ago"
    if diff.seconds > 3600:
        return f"{diff.seconds // 3600} hours ago"
    if diff.seconds > 60:
        return f"{diff.seconds // 60} minutes ago"
    return "Just now"


@progress_bp.route('/streak', methods=['GET'])
@jwt_required()
def get_streak():
    user_id = get_jwt_identity()
    streak = calculate_streak(user_id)
    return jsonify({'streak': streak}), 200


@progress_bp.route('/weak-concepts', methods=['GET'])
@jwt_required()
def get_weak_concepts():
    user_id = get_jwt_identity()
    
    # Get concepts with low mastery
    answers = Answer.query.join(Submission).filter(
        Submission.user_id == user_id
    ).all()
    
    concept_results = {}
    for answer in answers:
        concept = answer.question.concept or 'General'
        if concept not in concept_results:
            concept_results[concept] = {'correct': 0, 'total': 0}
        concept_results[concept]['total'] += 1
        if answer.is_correct:
            concept_results[concept]['correct'] += 1
    
    weak_concepts = [
        {
            'concept': concept,
            'mastery': round((data['correct'] / data['total']) * 100) if data['total'] > 0 else 0,
            'total_questions': data['total']
        }
        for concept, data in concept_results.items()
        if data['total'] > 0 and (data['correct'] / data['total']) < 0.6
    ]
    
    weak_concepts.sort(key=lambda x: x['mastery'])
    
    return jsonify({'concepts': weak_concepts[:5]}), 200


def calculate_streak(user_id):
    """Calculate consecutive days of activity (Quizzes, Lessons, Assessments)."""
    # 1. Get Quiz Submissions
    quiz_dates = db.session.query(
        func.date(Submission.submitted_at)
    ).filter_by(user_id=user_id).all()
    
    # 2. Get Lesson Completions
    lesson_dates = db.session.query(
        func.date(LessonProgress.completed_at)
    ).filter_by(user_id=user_id, completed=True).all()
    
    # 3. Get Assessment Submissions
    assessment_dates = db.session.query(
        func.date(AssessmentSubmission.submitted_at)
    ).filter_by(user_id=user_id).all()
    
    # Combine all unique dates
    active_dates = set()
    for d in quiz_dates:
        if d[0]: active_dates.add(d[0])
    for d in lesson_dates:
        if d[0]: active_dates.add(d[0])
    for d in assessment_dates:
        if d[0]: active_dates.add(d[0])
            
    if not active_dates:
        return 0
    
    streak = 0
    current_date = datetime.utcnow().date()
    
    # Check if active today or yesterday (to keep streak alive)
    if current_date not in active_dates and (current_date - timedelta(days=1)) not in active_dates:
        return 0
        
    # Count backwards
    while current_date in active_dates or (current_date - timedelta(days=1)) in active_dates:
        if current_date in active_dates:
            streak += 1
        current_date -= timedelta(days=1)
    
    return streak