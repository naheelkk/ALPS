import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useQuizStore } from '@/stores/quizStore'
import { useRecommendationStore } from '@/stores/recommendationStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'
import {
  CheckCircle,
  XCircle,
  Target,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

export default function QuizResult() {
  const { quizId } = useParams()
  const location = useLocation()
  const { result, fetchResult, isLoading } = useQuizStore()
  const { recommendations, fetchBySubmission } = useRecommendationStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [renderError, setRenderError] = useState(null)

  const submissionId = location.state?.submissionId || result?.submission_id
  console.log('[DEBUG] QuizResult Rendering. submissionId:', submissionId, 'quizId:', quizId, 'result:', result);

  useEffect(() => {
    console.log('[DEBUG] QuizResult useEffect fetching for submissionId:', submissionId);
    if (submissionId) {
      fetchResult(submissionId).catch(e => console.error('[DEBUG] fetchResult error:', e))
      fetchBySubmission(submissionId).catch(e => console.error('[DEBUG] fetchBySubmission error:', e))
    }
    return () => console.log('[DEBUG] QuizResult Unmounting!');
  }, [submissionId])

  if (isLoading || !result) {
    console.log('[DEBUG] QuizResult returning PageLoader. isLoading:', isLoading, 'result:', result);
    return <PageLoader />
  }

  const {
    score,
    total_questions,
    correct_answers,
    time_taken,
    questions_detail,
    concept_scores,
  } = result
  
  if (renderError) {
    return <div className="p-8 bg-red-100 text-red-900 font-mono"><h1 className="text-xl font-bold">Render Error:</h1><pre>{renderError.toString()}</pre></div>
  }
  
  try {

  const percentage = Math.round((correct_answers / total_questions) * 100)

  const getGrade = (pct) => {
    if (pct >= 90) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (pct >= 80) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (pct >= 70) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (pct >= 60) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const gradeInfo = getGrade(percentage)

  // Prepare chart data
  const conceptData = Object.entries(concept_scores || {}).map(([concept, score]) => ({
    concept,
    score: Math.round(score * 100),
    fullMark: 100,
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Score Overview */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="white"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${percentage * 4.4} 440`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{percentage}%</span>
              <span className="text-primary-100">Score</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center md:text-left">
              <div className={cn('inline-flex items-center justify-center w-16 h-16 rounded-xl', gradeInfo.bg)}>
                <span className={cn('text-2xl font-bold', gradeInfo.color)}>
                  {gradeInfo.grade}
                </span>
              </div>
              <p className="mt-2 text-primary-100">Grade</p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                <span className="text-3xl font-bold">{correct_answers}</span>
              </div>
              <p className="text-primary-100">Correct</p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2">
                <XCircle className="w-6 h-6" />
                <span className="text-3xl font-bold">
                  {total_questions - correct_answers}
                </span>
              </div>
              <p className="text-primary-100">Incorrect</p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                <span className="text-3xl font-bold">
                  {Math.floor(time_taken / 60)}:{String(time_taken % 60).padStart(2, '0')}
                </span>
              </div>
              <p className="text-primary-100">Time Taken</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'questions', label: 'Questions', icon: BookOpen },
          { id: 'recommendations', label: 'Recommendations', icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Concept Mastery Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Concept Mastery</CardTitle>
            </CardHeader>
            <CardContent>
              {conceptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={conceptData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="concept" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No concept data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance by Concept */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Concept</CardTitle>
            </CardHeader>
            <CardContent>
              {conceptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conceptData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="concept" width={100} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No concept data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'questions' && (
        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(questions_detail || []).map((q, index) => (
              <div
                key={q.id}
                className={cn(
                  'p-4 rounded-lg border-2',
                  q.is_correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                )}
              >
                <div className="flex items-start gap-3">
                  {q.is_correct ? (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-500">Q{index + 1}</span>
                      <Badge variant={q.is_correct ? 'success' : 'danger'}>
                        {q.concept}
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Your answer:</span>{' '}
                        <span className={q.is_correct ? 'text-green-600' : 'text-red-600'}>
                          {q.user_answer}
                        </span>
                      </p>
                      {!q.is_correct && (
                        <p className="text-gray-600">
                          <span className="font-medium">Correct answer:</span>{' '}
                          <span className="text-green-600">{q.correct_answer}</span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-gray-500 mt-2 p-2 bg-white rounded">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Great job!
                </h3>
                <p className="text-gray-500">
                  You performed well. No specific recommendations at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'p-3 rounded-xl',
                        rec.priority === 'high'
                          ? 'bg-red-100'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-100'
                          : 'bg-blue-100'
                      )}
                    >
                      <Target
                        className={cn(
                          'w-6 h-6',
                          rec.priority === 'high'
                            ? 'text-red-600'
                            : rec.priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {rec.concept}
                        </h4>
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
                      </div>
                      <p className="text-gray-600 mb-3">{rec.reason}</p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Recommended Resource:
                        </p>
                        {rec.resource_type === 'lesson' ? (
                          <Link
                            to={rec.resource_url}
                            className="flex items-center gap-2 text-primary-600 hover:underline"
                          >
                            📚 {rec.resource_title}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <a
                            href={rec.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary-600 hover:underline"
                          >
                            📚 {rec.resource_title}
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to={`/quiz/${quizId}`}>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Quiz
          </Button>
        </Link>
        <Link to="/courses">
          <Button>
            <BookOpen className="w-4 h-4 mr-2" />
            Continue Learning
          </Button>
        </Link>
      </div>
    </div>
  )
  } catch (err) {
      console.error("FATAL RENDERING CRASH:", err);
      setTimeout(() => setRenderError(err.toString()), 0);
      return <PageLoader />
  }
}