
import { create } from 'zustand'
import { courseService } from '../services/courseService'

export const useCourseStore = create((set, get) => ({
  courses: [],
  enrolledCourses: [],
  currentCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async (params = {}) => {
    set({ isLoading: true })
    try {
      const data = await courseService.getAll(params)
      set({ courses: data.courses, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchEnrolledCourses: async () => {
    set({ isLoading: true })
    try {
      const data = await courseService.getEnrolledCourses()
      set({ enrolledCourses: data.courses, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchCourseById: async (courseId) => {
    set({ isLoading: true })
    try {
      const data = await courseService.getById(courseId)
      set({ currentCourse: data, isLoading: false })
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  enrollInCourse: async (courseId) => {
    try {
      await courseService.enroll(courseId)
      await get().fetchEnrolledCourses()
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  completeLesson: async (courseId, lessonId) => {
    try {
      await courseService.completeLesson(courseId, lessonId)
      await get().fetchCourseById(courseId)
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  clearCurrentCourse: () => {
    set({ currentCourse: null })
  },
}))