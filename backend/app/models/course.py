from datetime import datetime
from app import db
import json

class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    level = db.Column(db.String(20), default='Beginner')
    duration = db.Column(db.String(20))
    price = db.Column(db.Float, default=0)
    rating = db.Column(db.Float, default=0)
    enrolled_count = db.Column(db.Integer, default=0)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    instructor_name = db.Column(db.String(100))
    thumbnail_url = db.Column(db.String(500))
    preview_video_url = db.Column(db.String(500))
    is_published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - removed back_populates to User to avoid circular reference
    lessons = db.relationship('Lesson', back_populates='course', lazy='dynamic', order_by='Lesson.order', cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', back_populates='course', lazy='dynamic', cascade='all, delete-orphan')
    assessments = db.relationship('Assessment', back_populates='course', lazy='dynamic', cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', back_populates='course', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_lessons=False, user_id=None):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'level': self.level,
            'duration': self.duration,
            'price': self.price,
            'rating': self.rating,
            'enrolled_count': self.enrolled_count,
            'is_published': self.is_published,
            'instructor_id': self.instructor_id,
            'instructor': {
                'name': self.instructor_name
            },
            'thumbnail_url': self.thumbnail_url,
            'preview_video_url': self.preview_video_url,
            'total_lessons': self.lessons.count(),
            'total_quizzes': self.quizzes.count(),
            'assessments': [a.to_dict() for a in self.assessments.all()],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_lessons:
            data['lessons'] = [lesson.to_dict() for lesson in self.lessons.all()]
        
        return data


class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    progress = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default='active')  # active, completed, dropped
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    last_accessed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', back_populates='enrollments')
    course = db.relationship('Course', back_populates='enrollments')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'course_id', name='unique_enrollment'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'progress': self.progress,
            'status': self.status,
            'enrolled_at': self.enrolled_at.isoformat() if self.enrolled_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class Lesson(db.Model):
    __tablename__ = 'lessons'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text)
    type = db.Column(db.String(20), default='video')  # video, text, file
    duration = db.Column(db.String(20))
    video_url = db.Column(db.String(500))
    file_url = db.Column(db.String(500))
    file_name = db.Column(db.String(255))
    order = db.Column(db.Integer, default=0)
    is_free = db.Column(db.Boolean, default=False)
    topics = db.Column(db.Text)  # JSON list of concepts
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    course = db.relationship('Course', back_populates='lessons')
    progress = db.relationship('LessonProgress', back_populates='lesson', lazy='dynamic', cascade='all, delete-orphan')
    contents = db.relationship('LessonContent', back_populates='lesson', lazy='dynamic',
                               order_by='LessonContent.order', cascade='all, delete-orphan')
    
    def to_dict(self, user_id=None):
        data = {
            'id': self.id,
            'course_id': self.course_id,
            'title': self.title,
            'description': self.description,
            'content': self.content,  # kept for backward-compat
            'type': self.type,
            'duration': self.duration,
            'video_url': self.video_url,
            'file_url': self.file_url,
            'file_name': self.file_name,
            'order': self.order,
            'is_free': self.is_free,
            'topics': json.loads(self.topics) if self.topics else [],
            'completed': False,
            'contents': [c.to_dict() for c in self.contents.all()]
        }
        
        if user_id:
            prog = LessonProgress.query.filter_by(
                user_id=user_id, 
                lesson_id=self.id
            ).first()
            data['completed'] = prog.completed if prog else False
        
        return data


class LessonProgress(db.Model):
    __tablename__ = 'lesson_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    watch_time = db.Column(db.Integer, default=0)
    completed_at = db.Column(db.DateTime)
    
    lesson = db.relationship('Lesson', back_populates='progress')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'lesson_id', name='unique_lesson_progress'),
    )


class LessonContent(db.Model):
    """A single content block within a lesson (text, code, video, image, or file)."""
    __tablename__ = 'lesson_contents'
    
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    # type: text | code | video | image | file
    type = db.Column(db.String(20), nullable=False, default='text')
    # For text / code blocks
    body = db.Column(db.Text)
    # For code blocks: language tag (js, python, bash, …)
    language = db.Column(db.String(30))
    # For video / image / file blocks
    url = db.Column(db.String(500))
    # Original filename for file-type blocks
    file_name = db.Column(db.String(255))
    # Position within the lesson (0-based)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    lesson = db.relationship('Lesson', back_populates='contents')
    
    def to_dict(self):
        return {
            'id': self.id,
            'lesson_id': self.lesson_id,
            'type': self.type,
            'body': self.body,
            'language': self.language,
            'url': self.url,
            'file_name': self.file_name,
            'order': self.order,
        }