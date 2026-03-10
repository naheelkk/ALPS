import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function MyAssessments() {
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      // We need an endpoint to get all assessments across all enrolled courses
      // If none exists, we might need to create one or fetch courses and aggregate
      // For now, let's assume we have an endpoint or we'll fetch from my-submissions and maybe open assessments logic?
      // Actually, let's use the /assessments/my-submissions endpoint if it exists or similar.
      // Checking backend... assessments_bp is registered at /api, and route is /my-submissions
      
      const response = await api.get('/my-submissions')
      setAssessments(response.data.submissions)
    } catch (error) {
      console.error('Failed to fetch assessments', error)
      toast.error('Failed to load assessments')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Assessments</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your assignment submissions and grades</p>
        </div>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assessments yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
              You haven't submitted any assessments yet. checks your courses for upcoming assignments.
            </p>
            <Button onClick={() => navigate('/courses')}>
              Go to Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assessments.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      submission.score ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Assessment Submission
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        {submission.score !== null ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                            <CheckCircle className="w-4 h-4" />
                            Grade: {submission.score}%
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            <Clock className="w-4 h-4" />
                            Pending Grade
                          </span>
                        )}
                      </div>
                      
                      {submission.comments && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium text-gray-900 dark:text-white block mb-1">Feedback:</span>
                          {submission.comments}
                        </div>
                      )}
                    </div>
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
