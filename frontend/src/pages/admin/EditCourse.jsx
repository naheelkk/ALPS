import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import LessonContentPanel from './LessonContentPanel'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Video,
  FileText,
  HelpCircle,
  Save,
  Upload,
  Eye,
  EyeOff,
  Clock,
  Users,
  Star,
  Play,
  Download,
  X,
  Check,
  AlertCircle,
  BookOpen,
  Target,
  Award,
  Zap,
  Settings,
  BarChart,
  Layers,
  ChevronDown,
  ChevronUp,
  Code,
} from 'lucide-react'

export default function EditCourse() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Modals
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  // ASSESSMENT FEATURE DISABLED (faculty requirement)
  // const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [editingQuiz, setEditingQuiz] = useState(null)
  // const [editingAssessment, setEditingAssessment] = useState(null)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const data = await adminService.getCourse(courseId)
      setCourse(data)
    } catch (error) {
      toast.error('Failed to load course')
      navigate('/admin/courses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await adminService.updateCourse(courseId, {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        price: course.price,
        is_published: course.is_published,
      })
      toast.success('Course saved successfully!')
    } catch (error) {
      toast.error('Failed to save course')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    try {
      await adminService.publishCourse(courseId)
      setCourse(prev => ({ ...prev, is_published: !prev.is_published }))
      toast.success(course.is_published ? 'Course unpublished' : 'Course published!')
    } catch (error) {
      toast.error('Failed to update course')
    }
  }

  if (isLoading) return <PageLoader />
  if (!course) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'lessons', label: 'Lessons', icon: Video, count: course.lessons?.length },
    { id: 'quizzes', label: 'Quizzes', icon: HelpCircle, count: course.quizzes?.length },
    // ASSESSMENT FEATURE DISABLED (faculty requirement)
    // { id: 'assessments', label: 'Assessments', icon: FileText, count: course.assessments?.length },
    { id: 'students', label: 'Students', icon: Users, count: course.enrolled_count },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'recommendations', label: 'Adaptive Rules', icon: Zap },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden glass-card">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 opacity-90"></div>
        
        {/* Decorative Elements */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <button
                onClick={() => navigate('/admin/courses')}
                className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="text"
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    className="text-3xl font-bold text-white bg-transparent border-none outline-none focus:underline"
                  />
                  
                  <div className={`badge-modern ${course.is_published ? 'badge-gradient-green' : 'badge-gradient-orange'}`}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    {course.total_lessons || 0} Lessons
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    {course.total_quizzes || 0} Quizzes
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {course.enrolled_count || 0} Students
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {course.rating || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={course.is_published ? 'secondary' : 'success'}
                onClick={handleTogglePublish}
                className="shadow-xl"
              >
                {course.is_published ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
              
              <Button onClick={handleSave} isLoading={isSaving} className="shadow-xl">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="glass-card p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/50'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab course={course} setCourse={setCourse} courseId={courseId} />
      )}
      
      {activeTab === 'lessons' && (
        <LessonsTab 
          course={course} 
          onRefresh={fetchCourse}
          showModal={showLessonModal}
          setShowModal={setShowLessonModal}
          editingLesson={editingLesson}
          setEditingLesson={setEditingLesson}
        />
      )}
      
      {activeTab === 'quizzes' && (
        <QuizzesTab 
          course={course} 
          onRefresh={fetchCourse}
          showModal={showQuizModal}
          setShowModal={setShowQuizModal}
          editingQuiz={editingQuiz}
          setEditingQuiz={setEditingQuiz}
        />
      )}
      
      {/* ASSESSMENT FEATURE DISABLED (faculty requirement) */}
      {/* activeTab === 'assessments' && <AssessmentsTab ... /> */}
      
      {activeTab === 'students' && (
        <StudentsTab courseId={courseId} />
      )}
      
      {activeTab === 'analytics' && (
        <AnalyticsTab courseId={courseId} />
      )}
      
      {activeTab === 'recommendations' && (
        <RecommendationsTab courseId={courseId} />
      )}
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ course, setCourse, courseId }) {
  const [isUploadingThumb, setIsUploadingThumb] = useState(false)

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingThumb(true)
    try {
      const formData = new FormData()
      formData.append('thumbnail', file)
      const data = await adminService.updateCourseWithFiles(courseId, formData)
      setCourse(prev => ({ ...prev, thumbnail_url: data.course.thumbnail_url }))
      toast.success('Thumbnail uploaded!')
    } catch (err) {
      toast.error('Failed to upload thumbnail')
    } finally {
      setIsUploadingThumb(false)
    }
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            Course Details
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={5}
              value={course.description || ''}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
              className="input-modern resize-none"
              placeholder="Describe what students will learn..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={course.category}
                onChange={(e) => setCourse({ ...course, category: e.target.value })}
                className="input-modern"
              >
                <option>Programming</option>
                <option>Web Development</option>
                <option>Data Science</option>
                <option>Mathematics</option>
                <option>Languages</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Level
              </label>
              <select
                value={course.level}
                onChange={(e) => setCourse({ ...course, level: e.target.value })}
                className="input-modern"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <input
                type="text"
                value={course.duration || ''}
                onChange={(e) => setCourse({ ...course, duration: e.target.value })}
                className="input-modern"
                placeholder="e.g., 10 hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={course.price || 0}
                onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) })}
                className="input-modern"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-primary-600" />
            Quick Stats
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Lessons</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{course.total_lessons || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700 dark:text-gray-300">Quizzes</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{course.total_quizzes || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Students</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{course.enrolled_count || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-orange-600" />
                <span className="text-gray-700 dark:text-gray-300">Rating</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{course.rating || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Course Thumbnail
          </h3>
          
          {course.thumbnail_url ? (
            <div className="relative rounded-xl overflow-hidden">
              <img 
                src={course.thumbnail_url} 
                alt="Thumbnail" 
                className="w-full h-40 object-cover"
              />
              <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                {isUploadingThumb ? (
                  <span className="text-white text-sm">Uploading...</span>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-white mb-1" />
                    <span className="text-white text-xs">Change thumbnail</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploadingThumb} />
              </label>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isUploadingThumb ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">{isUploadingThumb ? 'Uploading...' : 'Upload thumbnail'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploadingThumb} />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}

// Lessons Tab with Video Upload
function LessonsTab({ course, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [expandedContentLesson, setExpandedContentLesson] = useState(null) // lesson_id of expanded panel
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    topic: '',
    type: 'video',
    duration: '',
    is_free: false,
    video: null,
    file: null,
    content: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [isTagging, setIsTagging] = useState(false)
  const [tagSuggestion, setTagSuggestion] = useState(null)

  const resetForm = () => {
    setLessonForm({
      title: '',
      description: '',
      topic: '',
      type: 'video',
      duration: '',
      is_free: false,
      video: null,
      file: null,
      content: '',
    })
    setEditingLesson(null)
    setUploadProgress(0)
    setTagSuggestion(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      topic: lesson.topics && Array.isArray(lesson.topics) ? lesson.topics.join(', ') : '',
      type: lesson.type,
      duration: lesson.duration || '',
      is_free: lesson.is_free,
      video: null,
      file: null,
      content: lesson.content || '',
    })
    setTagSuggestion(null)
    setShowModal(true)
  }

  const autoTagLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error('Please enter a lesson title first.')
      return
    }
    
    setIsTagging(true)
    setTagSuggestion(null)
    
    // Attempt to gather content from the currently editing lesson blocks if available, otherwise just use description
    let contentBlocks = []
    if (editingLesson?.contents) {
        contentBlocks = editingLesson.contents
    }
    
    try {
      // Get the locally stored token (if any) or assume adminService handles it if using interceptors.
      // Since this file uses adminService for API calls, creating fetch manually requires the token.
      const rawStored = localStorage.getItem('auth-storage') || '{}'
      const token = JSON.parse(rawStored)?.state?.token || ''
      
      const res = await fetch('/api/admin/lessons/suggest-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: lessonForm.title,
          description: lessonForm.description,
          course_title: course?.title || '',
          contents: contentBlocks
        })
      });
      
      const data = await res.json();
      if (res.ok && !data.error) {
        setTagSuggestion({
          confidence: data.confidence,
          reasoning: data.reasoning
        });
        
        let newTopic = data.concept;
        if (data.subconcept) {
           newTopic += `, ${data.subconcept}`
        }
        
        setLessonForm(prev => ({
          ...prev,
          topic: newTopic
        }));
        toast.success(`Suggested Topic: ${newTopic}`)
      } else {
          toast.error(`Auto-tag failed: ${data.error || 'Unknown error'}`);
          console.error('LLM Error:', data);
      }
    } catch (err) {
      console.error('Auto-tag failed:', err);
      toast.error('Failed to generate topic suggestion');
    } finally {
      setIsTagging(false);
    }
  };

  const handleSubmit = async () => {
    if (!lessonForm.title) {
      toast.error('Lesson title is required')
      return
    }

    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('title', lessonForm.title)
      formData.append('description', lessonForm.description)
      formData.append('topic', lessonForm.topic)
      formData.append('type', lessonForm.type)
      formData.append('duration', lessonForm.duration)
      formData.append('is_free', lessonForm.is_free.toString())
      formData.append('content', lessonForm.content)
      
      if (lessonForm.video) {
        formData.append('video', lessonForm.video)
      }
      if (lessonForm.file) {
        formData.append('file', lessonForm.file)
      }

      if (editingLesson) {
        await adminService.updateLesson(editingLesson.id, formData)
        toast.success('Lesson updated!')
      } else {
        await adminService.createLesson(course.id, formData)
        toast.success('Lesson created!')
      }
      
      setShowModal(false)
      resetForm()
      onRefresh()
    } catch (error) {
      toast.error('Failed to save lesson')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    
    try {
      await adminService.deleteLesson(lessonId)
      toast.success('Lesson deleted')
      onRefresh()
    } catch (error) {
      toast.error('Failed to delete lesson')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Course Lessons
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Add videos, documents, and other learning materials
          </p>
        </div>
        
        <Button onClick={openAddModal} className="shadow-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      {/* Lessons List */}
      {!course.lessons?.length ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/50 float">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No lessons yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start building your course by adding your first lesson
          </p>
          <Button onClick={openAddModal} className="shadow-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add First Lesson
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {course.lessons.map((lesson, index) => (
            <div key={lesson.id} className="glass-card-hover p-5">
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <div className="cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
                
                {/* Order Number */}
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/50">
                  {index + 1}
                </div>
                
                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {lesson.title}
                    </h4>
                    
                    {lesson.is_free && (
                      <span className="badge-gradient-green">Free</span>
                    )}
                    
                    <span className={`badge-modern ${
                      lesson.type === 'video' ? 'badge-gradient-blue' :
                      lesson.type === 'text' ? 'badge-gradient-purple' :
                      'badge-gradient-orange'
                    }`}>
                      {lesson.type === 'video' && <Play className="w-3 h-3 mr-1" />}
                      {lesson.type === 'text' && <FileText className="w-3 h-3 mr-1" />}
                      {lesson.type === 'file' && <Download className="w-3 h-3 mr-1" />}
                      {lesson.type}
                    </span>

                    {lesson.contents?.length > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {lesson.contents.length} content block{lesson.contents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {lesson.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lesson.duration}
                      </div>
                    )}
                    {lesson.video_url && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" />
                        Video uploaded
                      </div>
                    )}
                    {lesson.file_url && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Check className="w-4 h-4" />
                        {lesson.file_name || 'File attached'}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Manage Content toggle */}
                  <button
                    onClick={() => setExpandedContentLesson(
                      expandedContentLesson === lesson.id ? null : lesson.id
                    )}
                    title="Manage content blocks"
                    className={`p-3 rounded-xl transition-colors group ${
                      expandedContentLesson === lesson.id
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <Layers className={`w-5 h-5 ${
                      expandedContentLesson === lesson.id
                        ? 'text-purple-600'
                        : 'text-gray-400 group-hover:text-purple-600'
                    }`} />
                  </button>

                  <button
                    onClick={() => openEditModal(lesson)}
                    className="p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors group"
                  >
                    <Edit className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
                  >
                    <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>
              </div>

              {/* Content Blocks Panel */}
              {expandedContentLesson === lesson.id && (
                <LessonContentPanel
                  lesson={lesson}
                  onRefresh={onRefresh}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Lesson Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} className="max-w-2xl">
        <ModalHeader onClose={() => setShowModal(false)}>
          {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        </ModalHeader>
        
        <ModalBody className="space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lesson Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              className="input-modern"
              placeholder="e.g., Introduction to JavaScript"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={lessonForm.description}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              className="input-modern resize-none"
              placeholder="Brief description of this lesson..."
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Topic
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={lessonForm.topic}
                onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
                className="input-modern flex-1"
                placeholder="e.g., Variables, Algorithms"
              />
              <Button
                  type="button"
                  onClick={autoTagLesson}
                  disabled={isTagging || !lessonForm.title.trim()}
                  title="Auto-detect topic using AI"
                  variant="secondary"
                  className="whitespace-nowrap"
              >
                  {isTagging ? '...' : '✨ Auto-tag'}
              </Button>
            </div>
            {tagSuggestion && (
              <p className={`mt-1 text-xs ${tagSuggestion.confidence > 0.7 ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
                AI suggestion (confidence: {Math.round(tagSuggestion.confidence * 100)}%) — {tagSuggestion.reasoning}
              </p>
            )}
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lesson Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'video', label: 'Video', icon: Video, gradient: 'from-blue-500 to-cyan-500' },
                { value: 'text', label: 'Text/Article', icon: FileText, gradient: 'from-purple-500 to-pink-500' },
                { value: 'file', label: 'Downloadable', icon: Download, gradient: 'from-orange-500 to-red-500' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setLessonForm({ ...lessonForm, type: type.value })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    lessonForm.type === type.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${type.gradient} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <type.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Video Upload */}
          {lessonForm.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Video
              </label>
              
              {lessonForm.video || (editingLesson?.video_url) ? (
                <div className="relative p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lessonForm.video?.name || 'Current video'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {lessonForm.video ? `${(lessonForm.video.size / 1024 / 1024).toFixed(2)} MB` : 'Video uploaded'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, video: null })}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-3">
                      <div className="progress-modern">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <Upload className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Click to upload video
                  </span>
                  <span className="text-xs text-gray-500">
                    MP4, WebM, MOV (max 500MB)
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setLessonForm({ ...lessonForm, video: e.target.files[0] })
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Text Content */}
          {lessonForm.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lesson Content
              </label>
              <textarea
                rows={8}
                value={lessonForm.content}
                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                className="input-modern resize-none font-mono text-sm"
                placeholder="Write your lesson content here... (Markdown supported)"
              />
            </div>
          )}

          {/* File Upload */}
          {lessonForm.type === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload File
              </label>
              
              {lessonForm.file || (editingLesson?.file_url) ? (
                <div className="relative p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lessonForm.file?.name || editingLesson?.file_name || 'Attached file'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {lessonForm.file ? `${(lessonForm.file.size / 1024 / 1024).toFixed(2)} MB` : 'File uploaded'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, file: null })}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-xl cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                  <Upload className="w-8 h-8 text-orange-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Click to upload file
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, DOC, PPT, ZIP (max 100MB)
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setLessonForm({ ...lessonForm, file: e.target.files[0] })
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Duration & Free Toggle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <input
                type="text"
                value={lessonForm.duration}
                onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                className="input-modern"
                placeholder="e.g., 15:00"
              />
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={lessonForm.is_free}
                  onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <span className="block font-medium text-gray-900 dark:text-white">Free Preview</span>
                  <span className="text-xs text-gray-500">Available without enrollment</span>
                </div>
              </label>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {editingLesson ? 'Update Lesson' : 'Create Lesson'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// Quizzes Tab with Publishing
function QuizzesTab({ course, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    time_limit: 30,
    passing_score: 60,
    is_published: false,
  })
  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    concept: '',
    difficulty: 'medium',
    explanation: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTagging, setIsTagging] = useState(false)
  const [tagSuggestion, setTagSuggestion] = useState(null)

  const handleCreateQuiz = async () => {
    if (!quizForm.title) {
      toast.error('Quiz title is required')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingQuiz) {
        await adminService.updateQuiz(editingQuiz.id, quizForm)
        toast.success('Quiz updated!')
      } else {
        await adminService.createQuiz(course.id, quizForm)
        toast.success('Quiz created!')
      }
      setShowModal(false)
      onRefresh()
    } catch (error) {
      toast.error('Failed to save quiz')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddQuestion = async () => {
    if (!questionForm.question || !questionForm.correct_answer) {
      toast.error('Question and correct answer are required')
      return
    }

    setIsSubmitting(true)
    try {
      await adminService.createQuestion(selectedQuiz.id, {
        ...questionForm,
        options: questionForm.options.filter(o => o.trim() !== ''),
      })
      toast.success('Question added!')
      setShowQuestionModal(false)
      setQuestionForm({
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        concept: '',
        difficulty: 'medium',
        explanation: '',
      })
      setTagSuggestion(null)
      onRefresh()
    } catch (error) {
      toast.error('Failed to add question')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Delete this quiz and all its questions?')) return
    
    try {
      await adminService.deleteQuiz(quizId)
      toast.success('Quiz deleted')
      onRefresh()
    } catch (error) {
      toast.error('Failed to delete quiz')
    }
  }

  const handlePublishQuiz = async (quiz) => {
    try {
      await adminService.updateQuiz(quiz.id, {
        ...quiz,
        is_published: !quiz.is_published
      })
      toast.success(quiz.is_published ? 'Quiz unpublished' : 'Quiz published!')
      onRefresh()
    } catch (error) {
      toast.error('Failed to update quiz')
    }
  }

  const autoTagQuestion = async () => {
    if (!questionForm.question.trim()) {
      toast.error('Please enter a question first.');
      return;
    }
    
    setIsTagging(true);
    setTagSuggestion(null);

    try {
      // Get the locally stored token
      const rawStored = localStorage.getItem('auth-storage') || '{}';
      const token = JSON.parse(rawStored)?.state?.token || '';

      const res = await fetch('/api/admin/questions/suggest-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: questionForm.question,
          options: questionForm.options.filter(o => o.trim() !== ''),
          course_title: course?.title || '',
          quiz_title: selectedQuiz?.title || ''
        })
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        setTagSuggestion({
          confidence: data.confidence,
          reasoning: data.reasoning
        });
        
        setQuestionForm(prev => ({
          ...prev,
          concept: data.concept,
          subconcept: data.subconcept || prev.subconcept
        }));
        
        let newTopic = data.concept;
        if (data.subconcept) {
           newTopic += `, ${data.subconcept}`
        }
        toast.success(`Suggested Topic: ${newTopic}`);
      } else {
        toast.error(`Auto-tag failed: ${data.error || 'Unknown error'}`);
        console.error('LLM Error:', data);
      }
    } catch (err) {
      console.error('Auto-tag failed:', err);
      toast.error('Failed to generate topic suggestion');
    } finally {
      setIsTagging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Course Quizzes
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Create quizzes to test student knowledge
          </p>
        </div>
        
        <Button onClick={() => {
          setEditingQuiz(null)
          setQuizForm({ title: '', description: '', time_limit: 30, passing_score: 60, is_published: false })
          setShowModal(true)
        }} className="shadow-xl">
          <Plus className="w-4 h-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Quizzes List */}
      {!course.quizzes?.length ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/50 float">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No quizzes yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create quizzes to assess your students' learning
          </p>
          <Button onClick={() => setShowModal(true)} className="shadow-xl">
            <Plus className="w-4 h-4 mr-2" />
            Create First Quiz
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {course.quizzes.map((quiz) => (
            <div key={quiz.id} className="glass-card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/50">
                    <HelpCircle className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {quiz.title}
                      </h3>
                      <span className={`badge-modern ${quiz.is_published ? 'badge-gradient-green' : 'badge-gradient-orange'}`}>
                        {quiz.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      {quiz.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-4 h-4" />
                        {quiz.question_count || 0} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {quiz.time_limit || 30} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {quiz.passing_score || 60}% to pass
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={quiz.is_published ? 'secondary' : 'success'}
                    onClick={() => handlePublishQuiz(quiz)}
                  >
                    {quiz.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  
                  <button
                    onClick={() => {
                      setEditingQuiz(quiz)
                      setQuizForm({
                        title: quiz.title,
                        description: quiz.description || '',
                        time_limit: quiz.time_limit || 30,
                        passing_score: quiz.passing_score || 60,
                        is_published: quiz.is_published,
                      })
                      setShowModal(true)
                    }}
                    className="p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                  >
                    <Edit className="w-5 h-5 text-gray-400 hover:text-primary-600" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
                  </button>
                </div>
              </div>

              {/* Questions Preview */}
              {quiz.questions?.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Questions
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedQuiz(quiz)
                        setTagSuggestion(null)
                        setShowQuestionModal(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Question
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {quiz.questions?.slice(0, 3).map((q, i) => (
                      <div key={q.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                          {q.question}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                    ))}
                    
                    {quiz.questions?.length > 3 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        +{quiz.questions.length - 3} more questions
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!quiz.questions?.length && (
                <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-3">
                    No questions added yet
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedQuiz(quiz)
                      setTagSuggestion(null)
                      setShowQuestionModal(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Question
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Quiz Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalHeader onClose={() => setShowModal(false)}>
          {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
        </ModalHeader>
        
        <ModalBody className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={quizForm.title}
              onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
              className="input-modern"
              placeholder="e.g., Chapter 1 Assessment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={quizForm.description}
              onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
              className="input-modern resize-none"
              placeholder="Brief description of the quiz..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={quizForm.time_limit}
                onChange={(e) => setQuizForm({ ...quizForm, time_limit: parseInt(e.target.value) })}
                className="input-modern"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={quizForm.passing_score}
                onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) })}
                className="input-modern"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={quizForm.is_published}
              onChange={(e) => setQuizForm({ ...quizForm, is_published: e.target.checked })}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <div>
              <span className="block font-medium text-gray-900 dark:text-white">Publish Quiz</span>
              <span className="text-xs text-gray-500">Students can take this quiz</span>
            </div>
          </label>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateQuiz} isLoading={isSubmitting}>
            {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Question Modal */}
      <Modal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)} className="max-w-2xl">
        <ModalHeader onClose={() => setShowQuestionModal(false)}>
          Add Question to "{selectedQuiz?.title}"
        </ModalHeader>
        
        <ModalBody className="space-y-5 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={questionForm.question}
              onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
              className="input-modern resize-none"
              placeholder="Enter your question..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Answer Options
            </label>
            <div className="space-y-3">
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct"
                    checked={questionForm.correct_answer === option && option !== ''}
                    onChange={() => setQuestionForm({ ...questionForm, correct_answer: option })}
                    className="w-5 h-5 text-green-600"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options]
                      newOptions[index] = e.target.value
                      setQuestionForm({ ...questionForm, options: newOptions })
                    }}
                    className="input-modern flex-1"
                    placeholder={`Option ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select the radio button next to the correct answer
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Concept/Topic
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={questionForm.concept}
                  onChange={(e) => setQuestionForm({ ...questionForm, concept: e.target.value })}
                  className="input-modern flex-1"
                  placeholder="e.g., Variables"
                />
                <Button
                    type="button"
                    onClick={autoTagQuestion}
                    disabled={isTagging || !questionForm.question.trim()}
                    title="Auto-detect topic using AI"
                    variant="secondary"
                    className="whitespace-nowrap"
                >
                    {isTagging ? '...' : '✨ Auto-tag'}
                </Button>
              </div>
              {tagSuggestion && (
                <p className={`mt-1 text-xs ${tagSuggestion.confidence > 0.7 ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
                  AI suggestion (confidence: {Math.round(tagSuggestion.confidence * 100)}%) — {tagSuggestion.reasoning}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={questionForm.difficulty}
                onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                className="input-modern"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Explanation (shown after answering)
            </label>
            <textarea
              rows={2}
              value={questionForm.explanation}
              onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
              className="input-modern resize-none"
              placeholder="Explain why this is the correct answer..."
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddQuestion} isLoading={isSubmitting}>
            Add Question
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// Assessments Tab
function AssessmentsTab({ course, onRefresh }) {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    description: '',
    instructions: '',
    max_score: 100,
    due_date: '',
    file_types_allowed: 'pdf,doc,docx,zip',
    is_published: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!assessmentForm.title) {
      toast.error('Assessment title is required')
      return
    }

    setIsSubmitting(true)
    try {
      await adminService.createAssessment(course.id, assessmentForm)
      toast.success('Assessment created!')
      setShowModal(false)
      setAssessmentForm({
        title: '',
        description: '',
        instructions: '',
        max_score: 100,
        due_date: '',
        file_types_allowed: 'pdf,doc,docx,zip',
        is_published: true,
      })
      onRefresh()
    } catch (error) {
      toast.error('Failed to create assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assessments & Assignments
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Create assignments for students to submit
          </p>
        </div>
        
        <Button onClick={() => setShowModal(true)} className="shadow-xl">
          <Plus className="w-4 h-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Assessments List */}
      {!course.assessments?.length ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/50 float">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No assessments yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create assignments for students to complete and submit
          </p>
          <Button onClick={() => setShowModal(true)} className="shadow-xl">
            <Plus className="w-4 h-4 mr-2" />
            Create First Assessment
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {course.assessments.map((assessment) => (
            <div key={assessment.id} className="glass-card-hover p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/50">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {assessment.title}
                      </h3>
                      <span className={`badge-modern ${assessment.is_published ? 'badge-gradient-green' : 'badge-gradient-orange'}`}>
                        {assessment.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      {assessment.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {assessment.max_score} points
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {assessment.submissions_count || 0} submissions
                      </span>
                      {assessment.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due: {new Date(assessment.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/assessments/${assessment.id}/grade`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Submissions
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Assessment Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} className="max-w-2xl">
        <ModalHeader onClose={() => setShowModal(false)}>
          Create New Assessment
        </ModalHeader>
        
        <ModalBody className="space-y-5 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={assessmentForm.title}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
              className="input-modern"
              placeholder="e.g., Final Project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={assessmentForm.description}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
              className="input-modern resize-none"
              placeholder="Brief overview of the assessment..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instructions
            </label>
            <textarea
              rows={4}
              value={assessmentForm.instructions}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, instructions: e.target.value })}
              className="input-modern resize-none"
              placeholder="Detailed instructions for students..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Score
              </label>
              <input
                type="number"
                min="1"
                value={assessmentForm.max_score}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, max_score: parseInt(e.target.value) })}
                className="input-modern"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={assessmentForm.due_date}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, due_date: e.target.value })}
                className="input-modern"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Allowed File Types
            </label>
            <input
              type="text"
              value={assessmentForm.file_types_allowed}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, file_types_allowed: e.target.value })}
              className="input-modern"
              placeholder="pdf,doc,docx,zip"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of extensions</p>
          </div>

          <label className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={assessmentForm.is_published}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, is_published: e.target.checked })}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <div>
              <span className="block font-medium text-gray-900 dark:text-white">Publish Assessment</span>
              <span className="text-xs text-gray-500">Students can view and submit</span>
            </div>
          </label>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={isSubmitting}>
            Create Assessment
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// Students Tab
function StudentsTab({ courseId }) {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [courseId])

  const fetchStudents = async () => {
    try {
      const data = await adminService.getCourseStudents(courseId)
      setStudents(data.students)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Enrolled Students ({students.length})
      </h2>

      {!students.length ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No students enrolled yet</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Quizzes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Avg Score</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {student.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-32">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">{Math.round(student.progress)}%</span>
                      </div>
                      <div className="progress-modern">
                        <div className="progress-bar" style={{ width: `${student.progress}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">
                    {student.quizzes_taken}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${
                      student.average_quiz_score >= 80 ? 'text-green-600' :
                      student.average_quiz_score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {student.average_quiz_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(student.enrolled_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Analytics Tab
function AnalyticsTab({ courseId }) {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await adminService.getCourseAnalytics(courseId)
        setStats(data)
      } catch (error) {
        console.error('Failed to load course analytics', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (courseId) {
      fetchAnalytics()
    }
  }, [courseId])

  if (isLoading) return <PageLoader />
  if (!stats) return <div className="text-center p-8 text-gray-500">Failed to load analytics</div>

  const maxEnrollment = stats.enrollment_trend && stats.enrollment_trend.length > 0
    ? Math.max(...stats.enrollment_trend, 1) // Provide minimum of 1 to avoid division by zero
    : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.views}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completion_rate}%</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Time Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avg_time}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Enrollment Trend (Last 12 Weeks)
          </h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.enrollment_trend && stats.enrollment_trend.map((value, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-primary-100 dark:bg-primary-900/30 rounded-t-lg relative group-hover:bg-primary-200 dark:group-hover:bg-primary-800/40 transition-colors"
                  style={{ height: `${(value / maxEnrollment) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {value} enrollments
                  </div>
                </div>
                <span className="text-xs text-gray-500">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Score Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Quiz Score Distribution
          </h3>
          <div className="space-y-4">
            {stats.quiz_scores && stats.quiz_scores.map((score, i) => {
              // Calculate total quiz takers to find max count for normalization
              const totalQuizTakers = stats.quiz_scores.reduce((acc, curr) => acc + curr.count, 0)
              const maxCount = totalQuizTakers > 0 ? Math.max(...stats.quiz_scores.map(s => s.count)) : 1
              
              return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{score.range}</span>
                  <span className="text-gray-500">{score.count} students</span>
                </div>
                <div className="progress-modern">
                  <div 
                    className={`progress-bar ${
                      i < 2 ? 'bg-red-500' : i < 3 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(score.count / maxCount) * 100}%` }} 
                  ></div>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  )
}

// RecommendationsTab (Rule-based)
function RecommendationsTab({ courseId }) {
  const [rules, setRules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [ruleForm, setRuleForm] = useState({
    concept: '',
    threshold: 60,
    resource_title: '',
    resource_url: '',
    priority: 'medium',
    resource_type: 'article'
  })

  useEffect(() => {
    fetchRules()
  }, [courseId])

  const fetchRules = async () => {
    try {
      const data = await adminService.getCourseRules(courseId)
      setRules(data.rules)
    } catch (error) {
      toast.error('Failed to load rules')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRule = async () => {
    if (!ruleForm.concept || !ruleForm.resource_title || !ruleForm.resource_url) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await adminService.createRule(courseId, ruleForm)
      toast.success('Rule created successfully')
      fetchRules()
      setShowModal(false)
      setRuleForm({
        concept: '',
        threshold: 60,
        resource_title: '',
        resource_url: '',
        priority: 'medium',
        resource_type: 'article'
      })
    } catch (error) {
      toast.error('Failed to create rule')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return
    
    try {
      await adminService.deleteRule(ruleId)
      toast.success('Rule deleted')
      setRules(rules.filter(r => r.id !== ruleId))
    } catch (error) {
      toast.error('Failed to delete rule')
    }
  }
  
  if (isLoading) return <PageLoader />
  
  return (
    <div className="space-y-6">
       <div className="glass-card p-6">
         <div className="flex items-center justify-between mb-6">
           <div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Zap className="w-5 h-5 text-yellow-500" />
               Adaptive Rules
             </h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm">
               Define rules to automatically recommend resources when students struggle with specific concepts.
             </p>
           </div>
           <Button onClick={() => setShowModal(true)}>
             <Plus className="w-4 h-4 mr-2" />
             Add Rule
           </Button>
         </div>

         {!rules.length ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rules defined. Add one to get started.</p>
            </div>
         ) : (
           <div className="space-y-4">
             {rules.map((rule) => (
               <div key={rule.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-4 bg-white dark:bg-gray-800/50">
                 <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                   <Target className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                 </div>
                 
                 <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                     <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">If Score in Concept</p>
                     <p className="font-bold text-gray-900 dark:text-white">{rule.concept}</p>
                   </div>
                   
                   <div>
                     <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Is Below</p>
                     <p className="font-bold text-red-500">{rule.threshold}%</p>
                   </div>
                   
                   <div>
                     <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recommend Resource</p>
                     <a href={rule.resource_url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 dark:text-blue-400 truncate block hover:underline">
                        {rule.resource_title}
                     </a>
                   </div>
                 </div>
                 
                 <div className="flex flex-col gap-2">
                   <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                   >
                     <Trash2 className="w-4 h-4 text-red-500" />
                   </button>
                 </div>
               </div>
             ))}
           </div>
         )}
         
         <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3">
           <div className="flex-shrink-0">
             <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
           </div>
           <div>
             <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">How it works</h4>
             <p className="text-blue-800 dark:text-blue-200 text-xs mt-1">
               The Adaptive Engine continuously monitors student performance across quizzes and assessments. 
               When a student's running average for a concept drops below your threshold, they will automatically 
               receive these recommendations on their dashboard.
             </p>
           </div>
         </div>
       </div>

       {/* Add Rule Modal */}
       <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
         <ModalHeader onClose={() => setShowModal(false)}>
           Add Adaptive Rule
         </ModalHeader>
         <ModalBody className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Concept</label>
             <input 
                type="text" 
                className="input-modern"
                placeholder="e.g. Variables, Loops"
                value={ruleForm.concept}
                onChange={e => setRuleForm({...ruleForm, concept: e.target.value})}
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score Threshold (%)</label>
             <input 
                type="number" 
                className="input-modern"
                min="0" max="100"
                value={ruleForm.threshold}
                onChange={e => setRuleForm({...ruleForm, threshold: parseFloat(e.target.value)})}
             />
             <p className="text-xs text-gray-500 mt-1">Trigger recommendation if score is below this value.</p>
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Title</label>
             <input 
                type="text" 
                className="input-modern"
                placeholder="e.g. Understanding Variables"
                value={ruleForm.resource_title}
                onChange={e => setRuleForm({...ruleForm, resource_title: e.target.value})}
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource URL</label>
             <input 
                type="url" 
                className="input-modern"
                placeholder="https://..."
                value={ruleForm.resource_url}
                onChange={e => setRuleForm({...ruleForm, resource_url: e.target.value})}
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Type</label>
             <select 
                className="input-modern"
                value={ruleForm.resource_type}
                onChange={e => setRuleForm({...ruleForm, resource_type: e.target.value})}
             >
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="interactive">Interactive</option>
             </select>
           </div>
         </ModalBody>
         <ModalFooter>
           <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
           <Button onClick={handleCreateRule} isLoading={isSubmitting}>Create Rule</Button>
         </ModalFooter>
       </Modal>
    </div>
  )
}