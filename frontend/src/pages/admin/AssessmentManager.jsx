import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  FileText,
  Check,
  X,
  Download,
  User,
  Clock,
  Save,
  Tag
} from 'lucide-react'

export default function AssessmentManager() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  
  // Grading state
  const [gradeForm, setGradeForm] = useState({
    score: '',
    feedback: '',
    concept_scores: {}
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newConcept, setNewConcept] = useState('')

  useEffect(() => {
    fetchData()
  }, [assessmentId])

  const fetchData = async () => {
    try {
      // We need to fetch assessment details first. 
      // Assuming getAssessmentSubmissions returns assessment info or we fetch it separately.
      // For now, let's fetch submissions.
      const data = await adminService.getAssessmentSubmissions(assessmentId)
      setSubmissions(data.submissions)
      
      // We might need a separate call for assessment details if not included
      // setAssessment(data.assessment) 
    } catch (error) {
      toast.error('Failed to load submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission)
    setGradeForm({
      score: submission.score || '',
      feedback: submission.feedback || '',
      concept_scores: submission.concept_scores ? JSON.parse(submission.concept_scores) : {}
    })
  }

  const handleAddConcept = () => {
    if (!newConcept.trim()) return
    setGradeForm(prev => ({
      ...prev,
      concept_scores: {
        ...prev.concept_scores,
        [newConcept.trim()]: 1.0 // Default to full mastery, tutor adjusts down
      }
    }))
    setNewConcept('')
  }

  const handleRemoveConcept = (concept) => {
    const newScores = { ...gradeForm.concept_scores }
    delete newScores[concept]
    setGradeForm(prev => ({ ...prev, concept_scores: newScores }))
  }

  const handleConceptScoreChange = (concept, value) => {
    setGradeForm(prev => ({
      ...prev,
      concept_scores: {
        ...prev.concept_scores,
        [concept]: parseFloat(value)
      }
    }))
  }

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return
    
    setIsSubmitting(true)
    try {
      await adminService.gradeSubmission(selectedSubmission.id, {
        score: parseFloat(gradeForm.score),
        feedback: gradeForm.feedback,
        concept_scores: gradeForm.concept_scores
      })
      toast.success('Grade submitted successfully')
      
      // Refresh submissions
      fetchData()
      setSelectedSubmission(null)
    } catch (error) {
      toast.error('Failed to submit grade')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 p-6">
      {/* Sidebar - Submissions List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submissions</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {submissions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No submissions yet
            </div>
          ) : (
            submissions.map(sub => (
              <div 
                key={sub.id}
                onClick={() => handleSelectSubmission(sub)}
                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  selectedSubmission?.id === sub.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-transparent bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sub.student_name || 'Unknown Student'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sub.status === 'graded' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </span>
                  {sub.score !== undefined && sub.score !== null && (
                    <span className="font-bold text-gray-900 dark:text-white">
                      {sub.score} / {sub.max_score}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Grading Interface */}
      <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {selectedSubmission ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Grading: {selectedSubmission.student_name}
                </h3>
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                </p>
              </div>
              
              {selectedSubmission.file_url && (
                <a 
                  href={selectedSubmission.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <Download className="w-4 h-4" />
                  Download Submission
                </a>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* PDF/File Viewer Placeholder */}
              <div className="bg-gray-100 dark:bg-gray-900 rounded-xl min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Document Viewer</p>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2">
                    Preview not available. Please download the file to view contents.
                    (Integration with react-pdf would go here)
                  </p>
                </div>
              </div>

              {/* Grading Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Score (Max: {selectedSubmission.max_score})
                    </label>
                    <input
                      type="number"
                      max={selectedSubmission.max_score}
                      value={gradeForm.score}
                      onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                      className="input-modern"
                      placeholder="Enter score"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    className="input-modern resize-none"
                    placeholder="Provide detailed feedback for the student..."
                  />
                </div>

                {/* Concept Tagging */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900 dark:text-blue-100">Concept Mastery Analysis</h4>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Tag concepts where the student struggled. Low mastery scores will trigger the Adaptive Engine to recommend resources.
                  </p>

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newConcept}
                      onChange={(e) => setNewConcept(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddConcept()}
                      className="input-modern flex-1"
                      placeholder="Add concept (e.g. 'Loops', 'Grammar')"
                    />
                    <Button onClick={handleAddConcept} size="sm">Add</Button>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(gradeForm.concept_scores).map(([concept, score]) => (
                      <div key={concept} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300 w-1/3 truncate" title={concept}>
                          {concept}
                        </span>
                        <div className="flex-1 flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={score}
                            onChange={(e) => handleConceptScoreChange(concept, e.target.value)}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                          />
                          <span className={`text-sm font-bold w-12 text-right ${
                            score < 0.6 ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                        <button 
                          onClick={() => handleRemoveConcept(concept)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {Object.keys(gradeForm.concept_scores).length === 0 && (
                      <p className="text-sm text-gray-500 italic text-center">No concepts tagged yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <Button onClick={handleSubmitGrade} isLoading={isSubmitting} className="shadow-lg">
                <Check className="w-4 h-4 mr-2" />
                Submit Grade & Feedback
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10" />
            </div>
            <p className="text-lg font-medium">Select a submission to grade</p>
          </div>
        )}
      </div>
    </div>
  )
}
