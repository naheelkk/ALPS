from app import db
from app.models import User, Course, Lesson, Quiz, Question
import json

def seed_database():
    """Seed the database with sample data."""
    
    # Clear existing data
    db.drop_all()
    db.create_all()
    
    # Create test user
    user = User(
        name='Test User',
        email='test@example.com'
    )
    user.set_password('password123')
    db.session.add(user)
    
    # Create courses
    courses_data = [
        {
            'title': 'JavaScript Fundamentals',
            'description': 'Learn the basics of JavaScript programming from scratch. Perfect for beginners.',
            'category': 'Programming',
            'level': 'Beginner',
            'duration': '10 hours',
            'price': 0,
            'instructor_name': 'John Doe',
            'lessons': [
                {'title': 'Introduction to JavaScript', 'type': 'video', 'duration': '15:00'},
                {'title': 'Variables and Data Types', 'type': 'video', 'duration': '20:00'},
                {'title': 'Quiz: Variables', 'type': 'quiz', 'duration': '10:00'},
                {'title': 'Functions Basics', 'type': 'video', 'duration': '25:00'},
                {'title': 'Control Flow', 'type': 'video', 'duration': '20:00'},
            ],
            'quizzes': [
                {
                    'title': 'JavaScript Basics Quiz',
                    'description': 'Test your understanding of JavaScript fundamentals',
                    'questions': [
                        {
                            'question': 'Which keyword is used to declare a variable in JavaScript?',
                            'options': ['var', 'int', 'string', 'define'],
                            'correct_answer': 'var',
                            'concept': 'Variables',
                            'difficulty': 'easy'
                        },
                        {
                            'question': 'What is the result of typeof null?',
                            'options': ['null', 'undefined', 'object', 'string'],
                            'correct_answer': 'object',
                            'concept': 'Variables',
                            'difficulty': 'medium'
                        },
                        {
                            'question': 'How do you define a function in JavaScript?',
                            'options': [
                                'function myFunc() {}',
                                'def myFunc():',
                                'void myFunc() {}',
                                'func myFunc() {}'
                            ],
                            'correct_answer': 'function myFunc() {}',
                            'concept': 'Functions',
                            'difficulty': 'easy'
                        },
                        {
                            'question': 'What does the === operator do?',
                            'options': [
                                'Assigns a value',
                                'Compares values only',
                                'Compares values and types',
                                'Logical AND'
                            ],
                            'correct_answer': 'Compares values and types',
                            'concept': 'Variables',
                            'difficulty': 'medium'
                        },
                        {
                            'question': 'Which loop is best for iterating over array elements?',
                            'options': ['while', 'do-while', 'for...of', 'switch'],
                            'correct_answer': 'for...of',
                            'concept': 'Loops',
                            'difficulty': 'medium'
                        },
                        {
                            'question': 'What is the output of console.log(2 + "2")?',
                            'options': ['4', '22', 'NaN', 'Error'],
                            'correct_answer': '22',
                            'concept': 'Variables',
                            'difficulty': 'medium'
                        },
                        {
                            'question': 'How do you add an element to the end of an array?',
                            'options': ['push()', 'append()', 'add()', 'insert()'],
                            'correct_answer': 'push()',
                            'concept': 'Arrays',
                            'difficulty': 'easy'
                        },
                        {
                            'question': 'What is a closure in JavaScript?',
                            'options': [
                                'A way to close the browser',
                                'A function with access to its outer scope',
                                'A type of loop',
                                'An error handling mechanism'
                            ],
                            'correct_answer': 'A function with access to its outer scope',
                            'concept': 'Functions',
                            'difficulty': 'hard'
                        },
                        {
                            'question': 'Which method converts a JSON string to an object?',
                            'options': [
                                'JSON.stringify()',
                                'JSON.parse()',
                                'JSON.convert()',
                                'JSON.toObject()'
                            ],
                            'correct_answer': 'JSON.parse()',
                            'concept': 'Objects',
                            'difficulty': 'medium'
                        },
                        {
                            'question': 'What does the map() function return?',
                            'options': [
                                'undefined',
                                'The original array',
                                'A new array',
                                'A single value'
                            ],
                            'correct_answer': 'A new array',
                            'concept': 'Arrays',
                            'difficulty': 'medium'
                        }
                    ]
                }
            ]
        },
        {
            'title': 'React for Beginners',
            'description': 'Build modern web applications with React. Learn components, hooks, and state management.',
            'category': 'Web Development',
            'level': 'Intermediate',
            'duration': '15 hours',
            'price': 0,
            'instructor_name': 'Jane Smith',
            'lessons': [
                {'title': 'What is React?', 'type': 'video', 'duration': '12:00'},
                {'title': 'Components and JSX', 'type': 'video', 'duration': '25:00'},
                {'title': 'Props and State', 'type': 'video', 'duration': '30:00'},
                {'title': 'React Hooks', 'type': 'video', 'duration': '35:00'},
            ],
            'quizzes': [
                {
                    'title': 'React Fundamentals Quiz',
                    'description': 'Test your React knowledge',
                    'questions': [
                        {
                            'question': 'What is JSX?',
                            'options': [
                                'A JavaScript library',
                                'A syntax extension for JavaScript',
                                'A CSS framework',
                                'A database'
                            ],
                            'correct_answer': 'A syntax extension for JavaScript',
                            'concept': 'React Basics',
                            'difficulty': 'easy'
                        },
                        {
                            'question': 'Which hook is used for state in functional components?',
                            'options': ['useEffect', 'useState', 'useContext', 'useReducer'],
                            'correct_answer': 'useState',
                            'concept': 'React Hooks',
                            'difficulty': 'easy'
                        },
                        {
                            'question': 'What triggers a re-render in React?',
                            'options': [
                                'Changing a regular variable',
                                'Calling a function',
                                'State or props change',
                                'Console logging'
                            ],
                            'correct_answer': 'State or props change',
                            'concept': 'React Basics',
                            'difficulty': 'medium'
                        }
                    ]
                }
            ]
        },
        {
            'title': 'Python Programming',
            'description': 'Master Python programming from basics to advanced concepts.',
            'category': 'Programming',
            'level': 'Beginner',
            'duration': '12 hours',
            'price': 0,
            'instructor_name': 'Alice Johnson',
            'lessons': [
                {'title': 'Python Introduction', 'type': 'video', 'duration': '15:00'},
                {'title': 'Data Types in Python', 'type': 'video', 'duration': '20:00'},
                {'title': 'Python Functions', 'type': 'video', 'duration': '25:00'},
            ],
            'quizzes': []
        },
        {
            'title': 'Data Science Essentials',
            'description': 'Learn data analysis, visualization, and machine learning basics.',
            'category': 'Data Science',
            'level': 'Intermediate',
            'duration': '20 hours',
            'price': 49.99,
            'instructor_name': 'Bob Williams',
            'lessons': [
                {'title': 'Introduction to Data Science', 'type': 'video', 'duration': '20:00'},
                {'title': 'Data Cleaning', 'type': 'video', 'duration': '30:00'},
            ],
            'quizzes': []
        }
    ]
    
    for course_data in courses_data:
        course = Course(
            title=course_data['title'],
            description=course_data['description'],
            category=course_data['category'],
            level=course_data['level'],
            duration=course_data['duration'],
            price=course_data['price'],
            instructor_name=course_data['instructor_name'],
            rating=4.5,
            enrolled_count=100
        )
        db.session.add(course)
        db.session.flush()
        
        # Add lessons
        for i, lesson_data in enumerate(course_data.get('lessons', [])):
            lesson = Lesson(
                course_id=course.id,
                title=lesson_data['title'],
                type=lesson_data['type'],
                duration=lesson_data['duration'],
                order=i
            )
            db.session.add(lesson)
        
        # Add quizzes
        for quiz_data in course_data.get('quizzes', []):
            quiz = Quiz(
                course_id=course.id,
                title=quiz_data['title'],
                description=quiz_data['description'],
                time_limit=30,
                passing_score=0.6
            )
            db.session.add(quiz)
            db.session.flush()
            
            # Add questions
            for i, q_data in enumerate(quiz_data.get('questions', [])):
                question = Question(
                    quiz_id=quiz.id,
                    question=q_data['question'],
                    options=json.dumps(q_data['options']),
                    correct_answer=q_data['correct_answer'],
                    concept=q_data['concept'],
                    difficulty=q_data['difficulty'],
                    explanation=f"The correct answer is '{q_data['correct_answer']}'.",
                    order=i
                )
                db.session.add(question)
    
    db.session.commit()
    print(f"Database seeded with {len(courses_data)} courses!")