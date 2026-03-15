import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCourseStore } from '@/stores/courseStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react'

const categories = [
  'All',
  'Programming',
  'Data Science',
  'Web Development',
  'Mathematics',
  'Languages',
]

const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']

export default function CourseList() {
  const { courses, enrolledCourses, fetchCourses, fetchEnrolledCourses, isLoading } =
    useCourseStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All Levels')
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'enrolled'

  useEffect(() => {
    fetchCourses()
    fetchEnrolledCourses()
  }, [])

  const filteredCourses = (activeTab === 'enrolled' ? enrolledCourses : courses).filter(
    (course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategory === 'All' || course.category === selectedCategory
      const matchesLevel =
        selectedLevel === 'All Levels' || course.level === selectedLevel
      return matchesSearch && matchesCategory && matchesLevel
    }
  )

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <p className="text-gray-500 mt-1">
          Explore our courses and start learning today
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Courses
        </button>
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'enrolled'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Courses ({enrolledCourses.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Level Filter */}
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {levels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={
            activeTab === 'enrolled'
              ? "You haven't enrolled in any courses yet"
              : 'Try adjusting your search or filters'
          }
          action={
            activeTab === 'enrolled' && (
              <Button onClick={() => setActiveTab('all')}>Browse Courses</Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

function CourseCard({ course }) {
  const isEnrolled = course.is_enrolled || course.progress !== undefined

  return (
    <Link to={`/courses/${course.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
        {/* Course Image */}
        <div className="h-40 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <BookOpen className="w-16 h-16 text-white/80" />
        </div>

        <CardContent className="p-5">
          {/* Category & Level */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="primary">{course.category || 'General'}</Badge>
            <Badge variant="default">{course.level || 'Beginner'}</Badge>
          </div>

          {/* Title & Description */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration || '10h'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.enrolled_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{course.rating || 4.5}</span>
            </div>
          </div>

          {/* Progress (if enrolled) */}
          {isEnrolled && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{course.progress || 0}%</span>
              </div>
              <Progress value={course.progress || 0} />
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary-600">
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </span>
            <span className="flex items-center text-primary-600 font-medium text-sm">
              {isEnrolled ? 'Continue' : 'View Course'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}