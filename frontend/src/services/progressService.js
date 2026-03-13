import api from './api'

export const progressService = {
  getOverallProgress: async () => {
    const response = await api.get('/progress')
    return response.data
  },

  getOverallProgress: async () => {
    const response = await api.get('/progress')
    return response.data
  },

  getMasteryLevels: async () => {
    const response = await api.get('/progress/mastery')
    return response.data
  },

  getActivityHistory: async (days = 7) => {
    const response = await api.get('/progress/activity', { params: { days } })
    return response.data
  },

  getStreak: async () => {
    const response = await api.get('/progress/streak')
    return response.data
  },

  getStreak: async () => {
    const response = await api.get('/progress/streak')
    return response.data
  },

  getWeakConcepts: async () => {
    const response = await api.get('/progress/weak-concepts')
    return response.data
  },

  getStrongConcepts: async () => {
    const response = await api.get('/progress/strong-concepts')
    return response.data
  },
}