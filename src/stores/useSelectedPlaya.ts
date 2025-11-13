'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createClient } from '@/lib/supabase/browser'
import type { PlayaBasica } from '@/services/playas/types'

interface SelectedPlayaStore {
  selectedPlaya: PlayaBasica | null
  isLoading: boolean
  setSelectedPlaya: (playa: PlayaBasica | null) => void
  setIsLoading: (loading: boolean) => void
  clearSelectedPlaya: () => void
  updateSelectedPlaya: (updates: Partial<PlayaBasica>) => void
}

interface PersistedState {
  selectedPlaya: PlayaBasica | null
  userId: string | null
}

export const useSelectedPlaya = create<SelectedPlayaStore>()(
  persist(
    (set) => ({
      selectedPlaya: null,
      isLoading: true,
      setSelectedPlaya: (playa) =>
        set({ selectedPlaya: playa, isLoading: false }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      clearSelectedPlaya: () => set({ selectedPlaya: null, isLoading: false }),
      updateSelectedPlaya: (updates) =>
        set((state) => ({
          selectedPlaya: state.selectedPlaya
            ? { ...state.selectedPlaya, ...updates }
            : null
        }))
    }),
    {
      name: 'selected-playa',
      storage: {
        getItem: async (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null

          try {
            const persistedData: PersistedState = JSON.parse(str).state

            const supabase = createClient()
            const {
              data: { user }
            } = await supabase.auth.getUser()

            const currentUserId = user?.id || null

            if (persistedData.userId !== currentUserId) {
              localStorage.removeItem(name)
              return null
            }

            return {
              state: {
                selectedPlaya: persistedData.selectedPlaya
              }
            }
          } catch {
            return null
          }
        },
        setItem: async (name, value) => {
          const supabase = createClient()
          const {
            data: { user }
          } = await supabase.auth.getUser()

          const dataToStore: PersistedState = {
            selectedPlaya: value.state.selectedPlaya,
            userId: user?.id || null
          }

          localStorage.setItem(
            name,
            JSON.stringify({
              state: dataToStore
            })
          )
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setIsLoading(false)
        }
      }
    }
  )
)
