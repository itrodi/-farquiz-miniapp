"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

type Profile = {
  id: string
  username: string | null
  displayName: string | null
  pfpUrl: string | null
  totalScore: number
  quizzesTaken: number
  quizzesCreated: number
}

type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  profile: Profile | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to add delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Use a ref to track if we're already fetching the profile
  const isFetchingProfile = useRef(false)
  // Use a ref to store the last fetch time
  const lastFetchTime = useRef(0)
  // Cache the profile data
  const profileCache = useRef<{ [key: string]: { data: Profile; timestamp: number } } | null>(null)
  // Track initialization
  const isInitialized = useRef(false)

  const fetchProfile = useCallback(
    async (userId: string, retryCount = 0) => {
      // If we're already fetching or if it's been less than 5 seconds since the last fetch, skip
      const now = Date.now()
      if (isFetchingProfile.current || (now - lastFetchTime.current < 5000 && profileCache.current?.[userId])) {
        return profileCache.current?.[userId]?.data || null
      }

      // Check if we have a cached profile that's less than 30 seconds old
      if (profileCache.current?.[userId] && now - profileCache.current[userId].timestamp < 30000) {
        return profileCache.current[userId].data
      }

      isFetchingProfile.current = true

      try {
        // Add exponential backoff for retries
        if (retryCount > 0) {
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000)
          await delay(backoffTime)
        }

        lastFetchTime.current = now

        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error) {
          // Check if it's a rate limiting error
          if (error.message?.includes("Too Many Requests") && retryCount < 3) {
            console.warn(`Rate limited, retrying in ${Math.pow(2, retryCount + 1)} seconds...`)
            isFetchingProfile.current = false
            return fetchProfile(userId, retryCount + 1)
          }

          console.error("Error fetching profile:", error)
          return null
        }

        if (data) {
          const profileData = {
            id: data.id,
            username: data.username,
            displayName: data.display_name,
            pfpUrl: data.avatar_url,
            totalScore: data.total_score,
            quizzesTaken: data.quizzes_taken,
            quizzesCreated: data.quizzes_created,
          }

          // Cache the profile data
          if (!profileCache.current) profileCache.current = {}
          profileCache.current[userId] = {
            data: profileData,
            timestamp: now,
          }

          setProfile(profileData)
          return profileData
        }

        return null
      } catch (error) {
        console.error("Error in fetchProfile:", error)
        return null
      } finally {
        isFetchingProfile.current = false
      }
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        await fetchProfile(session.user.id)
      }
    } catch (error) {
      console.error("Error refreshing profile:", error)
    }
  }, [fetchProfile, supabase.auth])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (isInitialized.current) return
      isInitialized.current = true

      setIsLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setIsAuthenticated(!!session)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [fetchProfile, supabase.auth])

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      setIsAuthenticated(!!session)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }

      // Force a router refresh to update server components
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile, router, supabase.auth])

  // Periodically refresh the session to keep it alive
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(
      () => {
        supabase.auth
          .refreshSession()
          .then(({ data }) => {
            if (!data.session) {
              setIsAuthenticated(false)
              setProfile(null)
            }
          })
          .catch((error) => {
            console.error("Error refreshing session:", error)
          })
      },
      5 * 60 * 1000,
    ) // Refresh every 5 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, supabase.auth])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setProfile(null)
      profileCache.current = null
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const value = {
    isAuthenticated,
    isLoading,
    profile,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
