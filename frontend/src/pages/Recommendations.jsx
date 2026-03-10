import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useRecommendationStore } from '@/stores/recommendationStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import {
  Target,
  BookOpen,
  Video,
  FileText,
  CheckCircle,
  X,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'

const resourceIcons = {
  video: Video,
  article: FileText,
  practice: Target,
  default: BookOpen,
}

export default function Recommendations() {
  const {
    recommendations,
    fetchRecommendations,
    markCompleted,
    dismissRecommendation,
    rateRecommendation,
    isLoading,
  } = useRecommendationStore()

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const handleComplete = async (id) => {
    try {
      await markCompleted(id)
      toast.success('Marked as completed!')
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const handleDismiss = async (id) => {
    try {
      await dismissRecommendation(id)
      toast.success('Recommendation dismissed')
    } catch (error) {
      toast.error('Failed to dismiss')
    }
  }

  const handleRate = async (id, rating) => {
    try {
      await rateRecommendation(id, rating)
      toast.success('Thanks for your feedback!')
    } catch (error) {
      toast.error('Failed to rate')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  const activeRecommendations = recommendations.filter(
    (r) => r.status !== 'completed' && r.status !== 'dismissed'
  )

  const completedRecommendations = recommendations.filter(
    (r) => r.status === 'completed'
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Personalized Recommendations
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Based on your quiz performance, here's what we suggest you focus on
        </p>
      </div>

      {/* Active Recommendations */}
      {activeRecommendations.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No recommendations yet"
          description="Complete some quizzes to get personalized learning recommendations"
          action={
            <Button onClick={() => (window.location.href = '/courses')}>
              Browse Courses
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {activeRecommendations.map((rec) => {
            const Icon = resourceIcons[rec.resource_type] || resourceIcons.default

            return (
              <Card
                key={rec.id}
                className={cn(
                  'transition-all',
                  rec.priority === 'high' && 'border-l-4 border-l-red-500',
                  rec.priority === 'medium' && 'border-l-4 border-l-yellow-500',
                  rec.priority === 'low' && 'border-l-4 border-l-blue-500'
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        'p-3 rounded-xl flex-shrink-0',
                        rec.priority === 'high' && 'bg-red-100',
                        rec.priority === 'medium' && 'bg-yellow-100',
                        rec.priority === 'low' && 'bg-blue-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-6 h-6',
                          rec.priority === 'high' && 'text-red-600',
                          rec.priority === 'medium' && 'text-yellow-600',
                          rec.priority === 'low' && 'text-blue-600'
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {rec.concept}
                        </h3>
                        <Badge
                          variant={
                            rec.priority === 'high'
                              ? 'danger'
                              : rec.priority === 'medium'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="default">{rec.resource_type}</Badge>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 mb-4">{rec.reason}</p>

                      {/* Resource Card */}
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {rec.resource_title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {rec.estimated_time || '15 min'}
                            </p>
                          </div>
                          {rec.resource_type === 'lesson' ? (
                            <Link
                              to={rec.resource_url}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              Start
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          ) : (
                            <a
                              href={rec.resource_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              Start
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleComplete(rec.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismiss(rec.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>Was this helpful?</span>
                          <button
                            onClick={() => handleRate(rec.id, 1)}
                            className={cn(
                              'p-1 rounded hover:bg-green-100',
                              rec.userRating === 1 && 'bg-green-100 text-green-600'
                            )}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRate(rec.id, -1)}
                            className={cn(
                              'p-1 rounded hover:bg-red-100',
                              rec.userRating === -1 && 'bg-red-100 text-red-600'
                            )}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Completed Recommendations */}
      {completedRecommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Completed ({completedRecommendations.length})
          </h2>
          <div className="space-y-2">
            {completedRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-600 dark:text-gray-300">{rec.concept}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {rec.resource_title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}