import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCourseStore } from '@/stores/courseStore'
import { useRecommendationStore } from '@/stores/recommendationStore'
import { useProgressStore } from '@/stores/progressStore'
import { Card } from '@/components/ui/Card'
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
  Award,
  Zap,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { enrolledCourses, fetchEnrolledCourses, isLoading: coursesLoading } = useCourseStore()
  const { recommendations, fetchRecommendations, isLoading: recsLoading } = useRecommendationStore()
  const { stats, activity, feed, fetchProgress, fetchActivity, isLoading: progressLoading } = useProgressStore()

  useEffect(() => {
    fetchEnrolledCourses()
    fetchRecommendations()
    fetchProgress()
    fetchActivity()
  }, [])

  if (coursesLoading || progressLoading || !stats) {
    return <PageLoader />
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Modern Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Hello, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Let's continue your learning journey today.
          </p>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          icon={<BookOpen className="w-5 h-5 text-primary-600" />}
          label="Enrolled Courses"
          value={enrolledCourses.length}
          color="bg-primary-50"
        />
        <StatsCard 
          icon={<Award className="w-5 h-5 text-emerald-600" />}
          label="Completed"
          value={stats.courses_completed}
          color="bg-emerald-50"
        />
        <StatsCard 
          icon={<Zap className="w-5 h-5 text-amber-600" />}
          label="Quizzes Taken"
          value={stats.total_quizzes}
          color="bg-amber-50"
        />
        <StatsCard 
          icon={<TrendingUp className="w-5 h-5 text-rose-600" />}
          label="Average Score"
          value={`${stats.average_score}%`}
          color="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Continue Learning */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
              <Link to="/courses" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {enrolledCourses.length === 0 ? (
                <EmptyState 
                  icon={<BookOpen className="w-10 h-10 text-gray-300" />}
                  message="You haven't enrolled in any courses yet."
                  action={
                    <Link to="/courses">
                        <Button variant="outline">Browse Courses</Button>
                    </Link>
                  }
                />
              ) : (
                enrolledCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="group block bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 bg-cover bg-center shrink-0"  
                           style={{ backgroundImage: `url(${course.thumbnail_url || 'https://via.placeholder.com/150'})` }} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                             <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {course.title}
                            </h3>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                           <span>{course.lessons_completed || 0} / {course.total_lessons || 10} lessons</span>
                           <span className="font-medium text-gray-900 dark:text-white">{Math.round(course.progress || 0)}%</span>
                        </div>
                        <Progress value={course.progress || 0} max={100} className="h-1.5 mt-2 bg-gray-100 dark:bg-gray-700" />
                      </div>
                      
                      <div className="self-center hidden sm:block">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

           {/* Recommended For You */}
           <section>
             <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recommended For You</h2>
              <Link to="/recommendations" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
             <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
               {recommendations.length === 0 ? (
                 <div className="p-8 text-center">
                    <p className="text-gray-500">Complete content to get personalized recommendations.</p>
                 </div>
               ) : (
                 recommendations.slice(0, 3).map((rec) => (
                   <div key={rec.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">{rec.concept}</span>
                          <Badge variant={rec.priority === 'high' ? 'danger' : 'default'} size="sm">
                              {rec.priority}
                          </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{rec.reason}</p>
                      {rec.resource_type === 'lesson' ? (
                          <Link to={rec.resource_url} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 group">
                             {rec.resource_title}
                             <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                      ) : (
                          <a href={rec.resource_url} target="_blank" rel="noopener noreferrer" 
                             className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 group">
                              {rec.resource_title}
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                      )}
                   </div>
                 ))
               )}
             </div>
           </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            {/* Recent Activity */}
            <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                    <div className="space-y-6">
                        {feed.length === 0 ? (
                             <p className="text-center text-gray-500 py-4 text-sm">No recent activity</p>
                        ) : (
                            feed.map((item, index) => (
                                <div key={index} className="flex gap-3 relative">
                                    {/* Timeline line */}
                                    {index !== feed.length - 1 && (
                                        <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-700" />
                                    )}
                                    
                                    <div className="shrink-0 mt-0.5">
                                        <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-gray-700 flex items-center justify-center border border-white dark:border-gray-800 shadow-sm">
                                            {item.type === 'quiz' ? <Zap className="w-3.5 h-3.5 text-amber-500" /> :
                                             item.type === 'assessment' ? <Target className="w-3.5 h-3.5 text-blue-500" /> :
                                             item.type === 'achievement' ? <Award className="w-3.5 h-3.5 text-purple-500" /> :
                                             <BookOpen className="w-3.5 h-3.5 text-gray-500" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 pb-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {item.type === 'quiz' ? 'Completed quiz' : 
                                            item.type === 'assessment' ? 'Completed assessment' :
                                            item.type === 'achievement' ? 'Earned badge' : 'Started course'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.title}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400">{item.date}</span>
                                            {item.score !== undefined && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                    item.score >= 70 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                                                }`}>
                                                    {item.score}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon, message, action }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                {icon}
            </div>
            <p className="text-gray-900 dark:text-white font-medium mb-1">It's quiet here</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-xs">{message}</p>
            {action}
        </div>
    )
}