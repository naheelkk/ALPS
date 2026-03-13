
import api from './api'

export const courseService = {
  getAll: async (params = {}) => {
    const response = await api.get('/courses', { params })
    return response.data
  },

  getById: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`)
    return response.data
  },

  enroll: async (courseId) => {
    const response = await api.post(`/courses/${courseId}/enroll`)
    return response.data
  },

  unenroll: async (courseId) => {
    const response = await api.delete(`/courses/${courseId}/enroll`)
    return response.data
  },

  getEnrolledCourses: async () => {
    const response = await api.get('/courses/enrolled')
    return response.data
  },

  getCourseProgress: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/progress`)
    return response.data
  },

  getLessons: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/lessons`)
    return response.data
  },

  completeLesson: async (courseId, lessonId) => {
    const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/complete`)
    return response.data
  },
}