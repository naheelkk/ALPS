import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PageLoader } from '@/components/ui/Spinner'
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Eye,
} from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your courses and students</p>
        </div>
        <Link to="/admin/courses/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold dark:text-white">{stats?.total_courses || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold dark:text-white">{stats?.total_students || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Enrollments</p>
              <p className="text-2xl font-bold dark:text-white">{stats?.total_enrollments || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
              <p className="text-2xl font-bold dark:text-white">{stats?.average_score || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.top_courses?.length > 0 ? (
              <div className="space-y-3">
                {stats.top_courses.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium dark:text-white">{course.title}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{course.enrollments} students</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No courses yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/courses" className="block">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                <BookOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="dark:text-white">Manage Courses</span>
              </div>
            </Link>
            <Link to="/admin/courses/create" className="block">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="dark:text-white">Create New Course</span>
              </div>
            </Link>
            <Link to="/admin/users" className="block">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="dark:text-white">Manage Users</span>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}