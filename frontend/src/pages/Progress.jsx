import { useEffect, useState } from 'react'
import { progressService } from '@/services/progressService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress as ProgressBar } from '@/components/ui/Progress'
import { PageLoader } from '@/components/ui/Spinner'
import {
  TrendingUp,
  Award,
  Target,
  Calendar,
  BookOpen,
  FileText,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'

export default function Progress() {
  const [progressData, setProgressData] = useState(null)
  const [masteryData, setMasteryData] = useState([])
  const [activityData, setActivityData] = useState({ history: [], feed: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progress, mastery, activity] = await Promise.all([
          progressService.getOverallProgress(),
          progressService.getMasteryLevels(),
          progressService.getActivityHistory(),
        ])
        setProgressData(progress)
        setMasteryData(mastery.concepts || [])
        setActivityData(activity) // Store full object including history and feed
      } catch (error) {
        console.error('Failed to fetch progress data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return <PageLoader />
  }

  // use progressData directly or default to 0s
  const stats = progressData || {
    total_quizzes: 0,
    average_score: 0,
    streak: 0,
    total_time: 0,
    courses_completed: 0,
    badges: [],
  }

  const hasMasteryData = masteryData.length > 0
  const hasActivityData = activityData.history.length > 0


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white-900">Learning Progress</h1>
        <p className="text-white-500 mt-1">Track your learning journey and achievements</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_quizzes}</p>
              <p className="text-xs text-gray-500">Quizzes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.average_score}%</p>
              <p className="text-xs text-gray-500">Avg Score</p>
            </div>
          </div>
        </Card>



        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.floor(stats.total_time / 60)}h</p>
              <p className="text-xs text-gray-500">Total Time</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.courses_completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.badges ? stats.badges.filter(b => b.earned).length : 0}</p>
              <p className="text-xs text-gray-500">Badges</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {hasActivityData ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData.history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No activity data yet
                </div>
            )}
          </CardContent>
        </Card>

        {/* Concept Mastery */}
        <Card>
          <CardHeader>
            <CardTitle>Concept Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMasteryData ? (
                <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={masteryData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="concept" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                    name="Mastery"
                    dataKey="mastery"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                    />
                </RadarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No mastery data yet
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Concept Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Concept Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!hasMasteryData ? (
                 <div className="text-center py-6 text-gray-500">
                    Take quizzes to track your concept mastery
                 </div>
            ) : (
                masteryData.map((item) => (
                <div key={item.concept} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.concept}
                    </div>
                    <div className="flex-1">
                    <ProgressBar value={item.mastery} showLabel />
                    </div>
                    <Badge
                    variant={
                        item.mastery >= 80
                        ? 'success'
                        : item.mastery >= 60
                        ? 'warning'
                        : 'danger'
                    }
                    >
                    {item.mastery >= 80
                        ? 'Mastered'
                        : item.mastery >= 60
                        ? 'Learning'
                        : 'Needs Work'}
                    </Badge>
                </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>



        <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!activityData.feed || activityData.feed.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activityData.feed.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === 'quiz'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : activity.type === 'assessment'
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : activity.type === 'course'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}
                  >
                    {activity.type === 'quiz' ? (
                      <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : activity.type === 'assessment' ? (
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    ) : activity.type === 'course' ? (
                      <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    {activity.score !== undefined && activity.score !== null && (
                      <p className="text-sm text-gray-500">Score: {activity.score}%</p>
                    )}
                    {activity.status && (
                       <p className="text-sm text-gray-500 capitalize">Status: {activity.status}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-400 whitespace-nowrap">{activity.date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}