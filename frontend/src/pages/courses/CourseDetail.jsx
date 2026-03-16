import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourseStore } from '@/stores/courseStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  BookOpen,
  Clock,
  Users,

  PlayCircle,
  FileText,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Award,
  Download,
  Upload
} from 'lucide-react'

/** Renders a single LessonContent block based on its type. */
function ContentBlock({ block }) {
  if (block.type === 'text') {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
        {block.body}
      </div>
    )
  }

  if (block.type === 'code') {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {block.language && (
          <div className="px-4 py-2 bg-gray-800 flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{block.language}</span>
          </div>
        )}
        <pre className="p-4 bg-gray-900 overflow-x-auto">
          <code className="text-sm font-mono text-green-300">{block.body}</code>
        </pre>
      </div>
    )
  }

  if (block.type === 'video') {
    const url = block.url || ''
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be')
    const isVimeo = url.includes('vimeo.com')

    if (isYoutube || isVimeo) {
      let embedSrc = url
      if (isYoutube) {
        const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/)
        if (match) embedSrc = `https://www.youtube.com/embed/${match[1]}`
      } else if (isVimeo) {
        const match = url.match(/vimeo\.com\/(\d+)/)
        if (match) embedSrc = `https://player.vimeo.com/video/${match[1]}`
      }
      return (
        <div className="rounded-xl overflow-hidden aspect-video">
          <iframe
            src={embedSrc}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )
    }
    return (
      <video controls className="w-full rounded-xl" src={url}>
        Your browser does not support video playback.
      </video>
    )
  }

  if (block.type === 'image') {
    return (
      <img
        src={block.url}
        alt="Lesson image"
        className="w-full rounded-xl object-contain max-h-[500px]"
      />
    )
  }

  if (block.type === 'file') {
    return (
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
      >
        <Download className="w-6 h-6 text-primary-600 flex-shrink-0" />
        <span className="font-medium text-primary-700 dark:text-primary-300">
          {block.file_name || 'Download File'}
        </span>
      </a>
    )
  }

  return null
}

export default function CourseDetail() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { currentCourse, fetchCourseById, enrollInCourse, isLoading, completeLesson } = useCourseStore()
  const [expandedModules, setExpandedModules] = useState({})
  const [enrolling, setEnrolling] = useState(false)
  
  // Interaction State
  const [viewingItem, setViewingItem] = useState(null) // For video modal
  const [showModal, setShowModal] = useState(false)
  
  // ASSESSMENT FEATURE DISABLED (faculty requirement)
  // const [uploadFile, setUploadFile] = useState(null)
  // const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchCourseById(courseId)
  }, [courseId])

  // Handle deep-linking to specific lessons
  useEffect(() => {
    if (lessonId && currentCourse?.lessons && !showModal && !viewingItem) {
      const lesson = currentCourse.lessons.find((l) => l.id.toString() === lessonId)
      if (lesson) {
        // Find icon mappings using existing component imports dynamically
        setViewingItem({
          ...lesson,
          type: lesson.type || 'video',
          // Note: using string types instead since icons are resolved by VideoModal anyway for the UI header, or it'll just render it as default
        })
        setShowModal(true)
      }
    }
  }, [lessonId, currentCourse])

  // ASSESSMENT FEATURE DISABLED (faculty requirement)
  // useEffect(() => {
  //   if (!showModal) {
  //     setUploadFile(null)
  //     setIsUploading(false)
  //   }
  // }, [showModal])

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      await enrollInCourse(courseId)
      toast.success('Successfully enrolled!')
      fetchCourseById(courseId)
    } catch (error) {
      toast.error('Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  // ASSESSMENT FEATURE DISABLED (faculty requirement)
  // const handleAssessmentSubmit = async () => { ... }

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  const handleItemClick = (item) => {
    if (!currentCourse.is_enrolled) return

    if (item.type === 'video') {
      setViewingItem(item)
      setShowModal(true)
      if (!item.completed) completeLesson(courseId, item.id).catch(console.error)
    } else if (item.type === 'quiz') {
      navigate(`/quiz/${item.id}`)
    // ASSESSMENT FEATURE DISABLED (faculty requirement)
    // } else if (item.type === 'assessment') {
    //   setViewingItem(item)
    //   setShowModal(true)
    } else if (item.type === 'file' || item.type === 'text') {
      setViewingItem(item)
      setShowModal(true)
      if (!item.completed) completeLesson(courseId, item.id).catch(console.error)
    }
  }

  if (isLoading || !currentCourse) {
    return <PageLoader />
  }

  const course = currentCourse

  // MERGE CONTENT: Lessons + Quizzes
  // (ASSESSMENT FEATURE DISABLED - faculty requirement)

  const normalizeContent = () => {
    const list = []
    
    // 1. Lessons
    if (course.lessons) {
      course.lessons.forEach(l => list.push({
        ...l,
        type: l.type || 'video',
        icon: l.type === 'text' ? FileText : (l.type === 'file' ? Download : PlayCircle)
      }))
    }
    
    // 2. Quizzes (if returned separately)
    if (course.quizzes) {
      course.quizzes.forEach(q => list.push({
        ...q,
        type: 'quiz',
        icon: HelpCircle,
        duration: `${q.time_limit || 30} min`,
        questions: q.question_count || 5
      }))
    }
    
    // ASSESSMENT FEATURE DISABLED (faculty requirement)
    // if (course.assessments) {
    //   course.assessments.forEach(a => list.push({
    //     ...a,
    //     type: 'assessment',
    //     icon: Award,
    //     duration: a.due_date ? `Due: ${new Date(a.due_date).toLocaleDateString()}` : 'No due date'
    //   }))
    // }
    
    return list.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  const contentList = normalizeContent()

  // Group into a single "Course Content" module for display
  const modules = [
    {
      id: 1,
      title: 'Course Content',
      items: contentList
    }
  ]

  // Initialize expanded state
  if (Object.keys(expandedModules).length === 0 && modules.length > 0) {
    setExpandedModules({ [modules[0].id]: true })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div
        className={`rounded-2xl p-8 text-white relative overflow-hidden ${
          !course.thumbnail_url ? 'bg-gradient-to-r from-primary-600 to-primary-800 dark:from-gray-800 dark:to-gray-900' : ''
        }`}
        style={{
          background: course.thumbnail_url
            ? `linear-gradient(to right, rgba(20, 184, 166, 0.85), rgba(15, 118, 110, 0.95)), url('${course.thumbnail_url}') center/cover no-repeat`
            : undefined
        }}
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-white/20 text-white">
                {course.category || 'Programming'}
              </Badge>
              <Badge className="bg-white/20 text-white">
                {course.level || 'Beginner'}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
            <p className="text-primary-100 mb-4">{course.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{course.duration || '10 hours'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{course.total_lessons || 0} lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{course.enrolled_count || 0} students</span>
              </div>

            </div>
          </div>

          <div className="md:w-64">
            {course.is_enrolled ? (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm mb-2">Your Progress</div>
                <div className="text-3xl font-bold mb-2">
                  {Math.round(course.progress || 0)}%
                </div>
                <Progress
                  value={course.progress || 0}
                  className="bg-white/20 [&>div]:bg-white"
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-gray-900 dark:text-white shadow-lg">
                <div className="text-2xl font-bold mb-4">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </div>
                <Button
                  className="w-full"
                  onClick={handleEnroll}
                  isLoading={enrolling}
                >
                  Enroll Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {modules.map((module, index) => (
                <div key={module.id} className="border-b border-gray-100 last:border-0">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {module.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {module.items.length} items
                        </p>
                      </div>
                    </div>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Module Items */}
                  {expandedModules[module.id] && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 pb-4 rounded-b-lg">
                      {module.items.map((item) => {
                        const Icon = item.icon || FileText
                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg mb-2 last:mb-0 transition-colors shadow-sm border border-gray-100 dark:border-gray-700 ${
                              course.is_enrolled ? 'cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:hover:border-primary-800' : 'opacity-75'
                            }`}
                            onClick={() => handleItemClick(item)}
                          >
                            {item.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : course.is_enrolled ? (
                              <Icon className="w-5 h-5 text-primary-500" />
                            ) : (
                              <Lock className="w-5 h-5 text-gray-400" />
                            )}
                            
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="capitalize">{item.type}</span>
                                {item.duration && (
                                  <>
                                    <span>•</span>
                                    <span>{item.duration}</span>
                                  </>
                                )}
                                {item.questions && (
                                  <>
                                    <span>•</span>
                                    <span>{item.questions} questions</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {course.is_enrolled && (
                              <Button
                                size="sm"
                                variant={item.completed ? "ghost" : "outline"}
                                className="shrink-0"
                              >
                                {item.type === 'quiz' ? 'Start Quiz' : 'View'}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What You'll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(course.learning_outcomes || [
                  'Understand core concepts',
                  'Build real-world projects',
                  'Master advanced techniques',
                  'Apply best practices',
                ]).map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-600 dark:text-primary-400">
                    {course.instructor?.name?.charAt(0) || 'I'}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {course.instructor?.name || 'John Doe'}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {course.instructor?.title || 'Instructor'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Modal (Video / Assessment) */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} className="max-w-4xl">
        <ModalHeader onClose={() => setShowModal(false)}>
          {viewingItem?.title}
        </ModalHeader>
        <ModalBody>
          {viewingItem?.type === 'video' && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                {viewingItem.video_url ? (
                  <video 
                    controls 
                    className="w-full h-full"
                    src={viewingItem.video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Video not available</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <h3>Description</h3>
                <p>{viewingItem.description || 'No description available.'}</p>
                {viewingItem.content && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg whitespace-pre-wrap">
                    {viewingItem.content}
                  </div>
                )}
              </div>
            </div>
          )}

          {viewingItem?.type === 'text' && (
            <div className="space-y-4">
              {/* Render typed content blocks if available, else fall back to old single content */}
              {viewingItem.contents && viewingItem.contents.length > 0 ? (
                viewingItem.contents.map((block) => (
                  <ContentBlock key={block.id} block={block} />
                ))
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  {viewingItem.content ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg whitespace-pre-wrap">
                      {viewingItem.content}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No content available for this lesson.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {viewingItem?.type === 'file' && (
            <div className="space-y-6 text-center py-10">
               <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Download className="w-10 h-10 text-primary-600 dark:text-primary-400" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                 {viewingItem.title}
               </h3>
               <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                 {viewingItem.description || 'Download the attached file to view this lesson content.'}
               </p>
               
               {viewingItem.file_url && (
                 <a 
                   href={viewingItem.file_url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   download
                   className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                 >
                   <Download className="w-5 h-5" />
                   Download File
                 </a>
               )}
            </div>
          )}

          {/* ASSESSMENT FEATURE DISABLED (faculty requirement) */}
          {/* viewingItem?.type === 'assessment' && ( ... assessment upload modal ... ) */}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}