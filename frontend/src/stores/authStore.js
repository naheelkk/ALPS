import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '../services/authService'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false, // Add this flag

      setHasHydrated: (state) => {
        set({ hasHydrated: state })
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authService.login(email, password)
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
          return data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authService.register(userData)
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
          return data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // This runs after hydration is complete
        state?.setHasHydrated(true)
      },
    }
  )
)