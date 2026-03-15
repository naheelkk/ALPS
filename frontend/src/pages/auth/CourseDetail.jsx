import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourseStore } from '@/stores/courseStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import {
  BookOpen,
  Clock,
  Users,
  Star,
  PlayCircle,
  FileText,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentCourse, fetchCourseById, enrollInCourse, isLoading } = useCourseStore()
  const [expandedModules, setExpandedModules] = useState({})
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetchCourseById(courseId)
  }, [courseId])

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      await enrollInCourse(courseId)
      toast.success('Successfully enrolled!')
      fetchCourseById(courseId)
    } catch (error) {
      toast.error('Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  if (isLoading || !currentCourse) {
    return <PageLoader />
  }

  const course = currentCourse

  // Mock modules - replace with real API data
  const modules = course.modules || [
    {
      id: 1,
      title: 'Getting Started',
      lessons: [
        { id: 1, title: 'Introduction', type: 'video', duration: '10:00', completed: true },
        { id: 2, title: 'Setting Up', type: 'video', duration: '15:00', completed: true },
        { id: 3, title: 'First Quiz', type: 'quiz', questions: 10, completed: false },
      ],
    },
    {
      id: 2,
      title: 'Core Concepts',
      lessons: [
        { id: 4, title: 'Fundamentals', type: 'video', duration: '20:00', completed: false },
        { id: 5, title: 'Practice Exercise', type: 'quiz', questions: 15, completed: false },
      ],
    },
    {
      id: 3,
      title: 'Advanced Topics',
      lessons: [
        { id: 6, title: 'Deep Dive', type: 'video', duration: '25:00', completed: false },
        { id: 7, title: 'Final Assessment', type: 'quiz', questions: 20, completed: false },
      ],
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-white/20 text-white">
                {course.category || 'Programming'}
              </Badge>
              <Badge className="bg-white/20 text-white">
                {course.level || 'Beginner'}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
            <p className="text-primary-100 mb-4">{course.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{course.duration || '10 hours'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{course.total_lessons || 20} lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{course.enrolled_count || 1234} students</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>{course.rating || 4.8} rating</span>
              </div>
            </div>
          </div>

          <div className="md:w-64">
            {course.is_enrolled ? (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm mb-2">Your Progress</div>
                <div className="text-3xl font-bold mb-2">
                  {course.progress || 0}%
                </div>
                <Progress
                  value={course.progress || 0}
                  className="bg-white/20 [&>div]:bg-white"
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 text-gray-900">
                <div className="text-2xl font-bold mb-4">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </div>
                <Button
                  className="w-full"
                  onClick={handleEnroll}
                  isLoading={enrolling}
                >
                  Enroll Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {modules.map((module, index) => (
                <div key={module.id} className="border-b border-gray-100 last:border-0">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">
                          {module.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {module.lessons.length} lessons
                        </p>
                      </div>
                    </div>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Module Lessons */}
                  {expandedModules[module.id] && (
                    <div className="bg-gray-50 px-4 pb-4">
                      {module.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg mb-2 last:mb-0"
                        >
                          {lesson.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : course.is_enrolled ? (
                            lesson.type === 'video' ? (
                              <PlayCircle className="w-5 h-5 text-primary-500" />
                            ) : (
                              <FileText className="w-5 h-5 text-primary-500" />
                            )
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {lesson.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {lesson.type === 'video'
                                ? lesson.duration
                                : `${lesson.questions} questions`}
                            </p>
                          </div>
                          {course.is_enrolled && lesson.type === 'quiz' && !lesson.completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/quiz/${lesson.id}`)}
                            >
                              Start Quiz
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* What You'll Learn */}
          <Card>
            <CardHeader>
              <CardTitle>What You'll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(course.learning_outcomes || [
                  'Understand core concepts',
                  'Build real-world projects',
                  'Master advanced techniques',
                  'Apply best practices',
                ]).map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{outcome}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-700">
                {(course.prerequisites || [
                  'Basic computer skills',
                  'Willingness to learn',
                ]).map((prereq, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    {prereq}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Instructor */}
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-600">
                    {course.instructor?.name?.charAt(0) || 'I'}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {course.instructor?.name || 'John Doe'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {course.instructor?.title || 'Senior Developer'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}