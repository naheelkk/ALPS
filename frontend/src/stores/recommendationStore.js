import { create } from 'zustand'
import { recommendationService } from '../services/recommendationService'

export const useRecommendationStore = create((set, get) => ({
  recommendations: [],
  isLoading: false,
  error: null,

  fetchRecommendations: async () => {
    set({ isLoading: true })
    try {
      const data = await recommendationService.getRecommendations()
      set({ recommendations: data.recommendations, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchBySubmission: async (submissionId) => {
    set({ isLoading: true })
    try {
      const data = await recommendationService.getRecommendationsBySubmission(submissionId)
      set({ recommendations: data.recommendations, isLoading: false })
      return data.recommendations
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  markCompleted: async (recommendationId) => {
    try {
      await recommendationService.markAsCompleted(recommendationId)
      set({
        recommendations: get().recommendations.map((rec) =>
          rec.id === recommendationId ? { ...rec, status: 'completed' } : rec
        ),
      })
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  dismissRecommendation: async (recommendationId) => {
    try {
      await recommendationService.dismissRecommendation(recommendationId)
      set({
        recommendations: get().recommendations.filter(
          (rec) => rec.id !== recommendationId
        ),
      })
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  rateRecommendation: async (recommendationId, rating, feedback) => {
    try {
      await recommendationService.rateRecommendation(recommendationId, rating, feedback)
      set({
        recommendations: get().recommendations.map((rec) =>
          rec.id === recommendationId ? { ...rec, userRating: rating } : rec
        ),
      })
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },
}))