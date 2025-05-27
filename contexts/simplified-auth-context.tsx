// contexts/simplified-auth-context.tsx
"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { farcasterOnlyAuth } from "@/lib/farcaster-only-auth"

type Profile = {
  id: string
  farcaster_fid: number
  username: string | null
  display_name: string | null
  avatar_url: string | null
  total_score: number
  quizzes_taken: number
  quizzes_created: number
}

type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  profile: Profile | null
  fid: number | null
  signOut: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SimplifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fid, setFid] = useState<number | null>(null)

  const authenticate = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const result = await farcasterOnlyAuth.authenticateWithFarcaster()
      
      if (result.success && result.profile) {
        setIsAuthenticated(true)
        setProfile(result.profile)
        setFid(result.profile.farcaster_fid)
        
        // Store session in localStorage for persistence
        localStorage.setItem('farcaster_session', JSON.stringify({
          fid: result.profile.farcaster_fid,
          authenticated_at: Date.now()
        }))
        
        console.log('Authentication successful:', result.profile)
      } else {
        setIsAuthenticated(false)
        setProfile(null)
        setFid(null)
        console.log('Authentication failed:', result.error)
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setIsAuthenticated(false)
      setProfile(null)
      setFid(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!fid) return
    
    try {
      const updatedProfile = await farcasterOnlyAuth.getProfileByFid(fid)
      if (updatedProfile) {
        setProfile(updatedProfile)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }, [fid])

  const signOut = useCallback(() => {
    setIsAuthenticated(false)
    setProfile(null)
    setFid(null)
    localStorage.removeItem('farcaster_session')
  }, [])

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      // Check if we have a stored session
      const storedSession = localStorage.getItem('farcaster_session')
      
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession)
          // Check if session is less than 24 hours old
          const isValidSession = (Date.now() - session.authenticated_at) < 24 * 60 * 60 * 1000
          
          if (isValidSession && session.fid) {
            // Try to restore session
            const profile = await farcasterOnlyAuth.getProfileByFid(session.fid)
            if (profile) {
              setIsAuthenticated(true)
              setProfile(profile)
              setFid(profile.farcaster_fid)
              setIsLoading(false)
              return
            }
          }
        } catch (error) {
          console.error('Error restoring session:', error)
        }
      }
      
      // No valid stored session, try fresh authentication
      await authenticate()
    }

    initAuth()
  }, [authenticate])

  // Periodically refresh profile data
  useEffect(() => {
    if (!isAuthenticated || !fid) return

    const interval = setInterval(() => {
      refreshProfile()
    }, 5 * 60 * 1000) // Refresh every 5 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, fid, refreshProfile])

  const value = {
    isAuthenticated,
    isLoading,
    profile,
    fid,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within a SimplifiedAuthProvider")
  }
  return context
}