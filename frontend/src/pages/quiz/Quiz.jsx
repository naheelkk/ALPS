import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuizStore } from '@/stores/quizStore'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertCircle,
} from 'lucide-react'

export default function Quiz() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const {
    currentQuiz,
    questions,
    currentQuestionIndex,
    answers,
    startQuiz,
    setAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    submitQuiz,
    isLoading,
    isSubmitting,
  } = useQuizStore()

  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setError(null)
        await startQuiz(quizId)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz')
      }
    }
    loadQuiz()
  }, [quizId])

  // Timer
  useEffect(() => {
    if (!currentQuiz) return
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [currentQuiz])

  const handleSubmit = async () => {
    try {
      const result = await submitQuiz()
      navigate(`/quiz/${quizId}/result`, { state: { submissionId: result.submission_id } })
    } catch (error) {
      toast.error('Failed to submit quiz')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => navigate('/courses')}>
              Browse Courses
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!currentQuiz) {
    return null
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center p-8">
        <h2 className="text-xl font-semibold mb-4">This quiz has no questions yet.</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (!currentQuestion) {
      return <PageLoader />
  }

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentQuiz.title}
            </h1>
            <p className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowConfirmSubmit(true)}
            >
              <Flag className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>{answeredCount} answered</span>
            <span>{questions.length - answeredCount} remaining</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => goToQuestion(index)}
            className={cn(
              'w-10 h-10 rounded-lg font-medium text-sm transition-colors',
              index === currentQuestionIndex
                ? 'bg-primary-600 text-white'
                : answers[q.id]
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-6">
            <span className="text-sm text-primary-600 font-medium">
              {currentQuestion.concept || 'General'}
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id]?.answer === option
              const optionLetter = String.fromCharCode(65 + index)

              return (
                <button
                  key={index}
                  onClick={() => setAnswer(currentQuestion.id, option)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  <span
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-medium flex-shrink-0',
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    {optionLetter}
                  </span>
                  <span className="text-gray-800 dark:text-gray-100">{option}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button onClick={() => setShowConfirmSubmit(true)}>
            Finish Quiz
          </Button>
        ) : (
          <Button onClick={nextQuestion}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowConfirmSubmit(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Submit Quiz?
                    </h3>
                    <p className="text-gray-500">
                      You've answered {answeredCount} of {questions.length} questions
                    </p>
                  </div>
                </div>

                {answeredCount < questions.length && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ You have {questions.length - answeredCount} unanswered
                      questions. They will be marked as incorrect.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowConfirmSubmit(false)}
                  >
                    Continue Quiz
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                  >
                    Submit Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}