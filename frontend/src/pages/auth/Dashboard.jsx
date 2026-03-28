import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCourseStore } from '@/stores/courseStore'
import { useRecommendationStore } from '@/stores/recommendationStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import {
  BookOpen,
  Target,
  Trophy,
  TrendingUp,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { enrolledCourses, fetchEnrolledCourses, isLoading: coursesLoading } = useCourseStore()
  const { recommendations, fetchRecommendations, isLoading: recsLoading } = useRecommendationStore()

  useEffect(() => {
    fetchEnrolledCourses()
    fetchRecommendations()
  }, [])

  if (coursesLoading) {
    return <PageLoader />
  }

  // Mock stats - replace with real API data
  const stats = {
    coursesCompleted: 3,
    quizzesTaken: 24,
    averageScore: 78,
    streak: 7,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-primary-100 mb-4">
          You're on a {stats.streak}-day learning streak. Keep it up!
        </p>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-sm">{stats.streak} day streak</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Enrolled Courses</p>
              <p className="text-2xl font-bold">{enrolledCourses.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Quizzes Taken</p>
              <p className="text-2xl font-bold">{stats.quizzesTaken}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold">{stats.averageScore}%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Continue Learning</CardTitle>
              <Link to="/courses" className="text-primary-600 text-sm hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No courses enrolled yet</p>
                  <Link to="/courses">
                    <Button>Browse Courses</Button>
                  </Link>
                </div>
              ) : (
                enrolledCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {course.lessons_completed || 0} / {course.total_lessons || 10} lessons
                      </p>
                      <Progress
                        value={course.progress || 0}
                        max={100}
                        className="h-1.5"
                      />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>For You</CardTitle>
              <Link
                to="/recommendations"
                className="text-primary-600 text-sm hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-center py-6">
                  <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Complete some quizzes to get personalized recommendations
                  </p>
                </div>
              ) : (
                recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="font-medium text-sm text-gray-900">
                        {rec.concept}
                      </h5>
                      <Badge
                        variant={
                          rec.priority === 'high'
                            ? 'danger'
                            : rec.priority === 'medium'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{rec.reason}</p>
                    {rec.resource_type === 'lesson' ? (
                      <Link
                        to={rec.resource_url}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        📚 {rec.resource_title}
                      </Link>
                    ) : (
                      <a
                        href={rec.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:underline"
                      >
                        📚 {rec.resource_title}
                      </a>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: 'Completed quiz',
                item: 'JavaScript Basics - Variables',
                score: '8/10',
                time: '2 hours ago',
              },
              {
                action: 'Started lesson',
                item: 'Introduction to React Hooks',
                time: '5 hours ago',
              },
              {
                action: 'Earned badge',
                item: 'Quick Learner',
                time: 'Yesterday',
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">{activity.item}</p>
                </div>
                {activity.score && (
                  <Badge variant="success">{activity.score}</Badge>
                )}
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}