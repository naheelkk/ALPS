import api from './api'

export const adminService = {
  // Dashboard
  getStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  },

  // Course Management
  getCourses: async () => {
    const response = await api.get('/admin/courses')
    return response.data
  },

  getCourse: async (courseId) => {
    const response = await api.get(`/admin/courses/${courseId}`)
    return response.data
  },

  createCourse: async (courseData) => {
    const response = await api.post('/admin/courses', courseData)
    return response.data
  },

  createCourseWithFiles: async (formData) => {
    const response = await api.post('/admin/courses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  updateCourse: async (courseId, courseData) => {
    const response = await api.put(`/admin/courses/${courseId}`, courseData)
    return response.data
  },

  updateCourseWithFiles: async (courseId, formData) => {
    const response = await api.put(`/admin/courses/${courseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deleteCourse: async (courseId) => {
    const response = await api.delete(`/admin/courses/${courseId}`)
    return response.data
  },

  publishCourse: async (courseId) => {
    const response = await api.post(`/admin/courses/${courseId}/publish`)
    return response.data
  },

  // Lesson Management
  createLesson: async (courseId, lessonData) => {
    const response = await api.post(`/admin/courses/${courseId}/lessons`, lessonData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  updateLesson: async (lessonId, lessonData) => {
    const response = await api.put(`/admin/lessons/${lessonId}`, lessonData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deleteLesson: async (lessonId) => {
    const response = await api.delete(`/admin/lessons/${lessonId}`)
    return response.data
  },

  // Quiz Management
  createQuiz: async (courseId, quizData) => {
    const response = await api.post(`/admin/courses/${courseId}/quizzes`, quizData)
    return response.data
  },

  updateQuiz: async (quizId, quizData) => {
    const response = await api.put(`/admin/quizzes/${quizId}`, quizData)
    return response.data
  },

  deleteQuiz: async (quizId) => {
    const response = await api.delete(`/admin/quizzes/${quizId}`)
    return response.data
  },

  // Question Management
  createQuestion: async (quizId, questionData) => {
    const response = await api.post(`/admin/quizzes/${quizId}/questions`, questionData)
    return response.data
  },

  updateQuestion: async (questionId, questionData) => {
    const response = await api.put(`/admin/questions/${questionId}`, questionData)
    return response.data
  },

  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/admin/questions/${questionId}`)
    return response.data
  },

  // ASSESSMENT FEATURE DISABLED (faculty requirement)
  // createAssessment: async (courseId, assessmentData) => { ... },
  // updateAssessment: async (assessmentId, assessmentData) => { ... },
  // deleteAssessment: async (assessmentId) => { ... },
  // getAssessmentSubmissions: async (assessmentId) => { ... },
  // gradeSubmission: async (submissionId, gradeData) => { ... },

  // User Management
  getUsers: async () => {
    const response = await api.get('/admin/users')
    return response.data
  },

  deleteUser: async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`)
  return response.data
},

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role })
    return response.data
  },

  // Analytics
  getCourseStudents: async (courseId) => {
    const response = await api.get(`/admin/courses/${courseId}/students`)
    return response.data
  },

  getCourseAnalytics: async (courseId) => {
    const response = await api.get(`/admin/courses/${courseId}/analytics`)
    return response.data
  },

  // Adaptive Rules
  getCourseRules: async (courseId) => {
    const response = await api.get(`/admin/courses/${courseId}/rules`)
    return response.data
  },

  createRule: async (courseId, ruleData) => {
    const response = await api.post(`/admin/courses/${courseId}/rules`, ruleData)
    return response.data
  },

  deleteRule: async (ruleId) => {
    const response = await api.delete(`/admin/rules/${ruleId}`)
    return response.data
  },
}