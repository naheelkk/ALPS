import { create } from 'zustand'
import { progressService } from '../services/progressService'

export const useProgressStore = create((set) => ({
  stats: null,
  activity: [],
  feed: [],
  isLoading: false,
  error: null,

  fetchProgress: async () => {
    set({ isLoading: true })
    try {
      const data = await progressService.getOverallProgress()
      set({ stats: data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchActivity: async () => {
    try {
      const data = await progressService.getActivityHistory()
      set({ activity: data.history, feed: data.feed })
    } catch (error) {
      console.error('Failed to fetch activity:', error)
      // Don't set global error to avoid blocking the whole dashboard
    }
  },
}))
