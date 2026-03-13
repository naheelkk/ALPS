import api from './api'

export const quizService = {
  getQuizzesByCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/quizzes`)
    return response.data
  },

  getQuizById: async (quizId) => {
    const response = await api.get(`/quizzes/${quizId}`)
    return response.data
  },

  startQuiz: async (quizId) => {
    const response = await api.post(`/quizzes/${quizId}/start`)
    return response.data
  },

  submitQuiz: async (quizId, answers) => {
    const response = await api.post(`/quizzes/${quizId}/submit`, { answers })
    return response.data
  },

  getQuizResult: async (submissionId) => {
    const response = await api.get(`/submissions/${submissionId}`)
    return response.data
  },

  getQuizHistory: async (quizId) => {
    const response = await api.get(`/quizzes/${quizId}/history`)
    return response.data
  },
}