import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  BookOpen,
} from 'lucide-react'

export default function CourseManager() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const data = await adminService.getCourses()
      setCourses(data.courses)
    } catch (error) {
      toast.error('Failed to fetch courses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    
    try {
      await adminService.deleteCourse(courseId)
      toast.success('Course deleted')
      fetchCourses()
    } catch (error) {
      toast.error('Failed to delete course')
    }
  }

  const handlePublish = async (courseId) => {
    try {
      const data = await adminService.publishCourse(courseId)
      toast.success(data.message)
      fetchCourses()
    } catch (error) {
      toast.error('Failed to update course')
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Courses</h1>
          <p className="text-gray-500 dark:text-gray-400">Create and manage your courses</p>
        </div>
        <Link to="/admin/courses/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first course to get started</p>
            <Link to="/admin/courses/create">
              <Button>Create Course</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {course.title}
                      </h3>
                      <Badge variant={course.is_published ? 'success' : 'warning'}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge variant="default">{course.level}</Badge>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.total_lessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.enrolled_count} students
                      </span>
                      <span>{course.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePublish(course.id)}
                      title={course.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {course.is_published ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(course.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}