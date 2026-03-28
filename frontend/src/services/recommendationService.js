import api from './api'

export const recommendationService = {
  getRecommendations: async () => {
    const response = await api.get('/recommendations')
    return response.data
  },

  getRecommendationsBySubmission: async (submissionId) => {
    const response = await api.get(`/submissions/${submissionId}/recommendations`)
    return response.data
  },

  markAsCompleted: async (recommendationId) => {
    const response = await api.post(`/recommendations/${recommendationId}/complete`)
    return response.data
  },

  dismissRecommendation: async (recommendationId) => {
    const response = await api.post(`/recommendations/${recommendationId}/dismiss`)
    return response.data
  },

  rateRecommendation: async (recommendationId, rating, feedback = '') => {
    const response = await api.post(`/recommendations/${recommendationId}/rate`, {
      rating,
      feedback,
    })
    return response.data
  },
}