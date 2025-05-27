'use client'

import { useEffect, useState } from "react"
import { sdk } from "@farcaster/frame-sdk"
import { useAuth } from "@/contexts/simplified-auth-context"

export function FarcasterInit() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const { isAuthenticated, profile } = useAuth()

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Check if we're in a Mini App environment
        const isInMiniApp = await sdk.isInMiniApp()
        setIsMiniApp(isInMiniApp)
        
        if (isInMiniApp) {
          console.log('🚀 FarQuiz running in Farcaster Mini App')
          
          // Get context to understand how user arrived
          const context = sdk.context
          console.log('📱 Mini App Context:', context)
          
          // Log launch context for debugging
          if (context.location) {
            switch (context.location.type) {
              case 'cast_embed':
                console.log('🔗 Launched from cast embed:', context.location.cast)
                break
              case 'notification':
                console.log('🔔 Launched from notification:', context.location.notification)
                break
              case 'launcher':
                console.log('🎯 Launched from app launcher')
                break
              default:
                console.log('📍 Launched from:', context.location.type)
            }
          }
          
          // Handle quiz parameter from frame links
          const urlParams = new URLSearchParams(window.location.search)
          const quizId = urlParams.get('quiz')
          const utm_source = urlParams.get('utm_source')
          
          if (quizId) {
            console.log(`🎮 Quiz ID detected: ${quizId}, source: ${utm_source}`)
            
            // Only redirect after authentication or a short delay for sign-in
            if (isAuthenticated && profile) {
              console.log('✅ User authenticated, redirecting to quiz')
              setTimeout(() => {
                window.location.href = `/quiz/${quizId}`
              }, 500)
            } else {
              console.log('⏳ User not authenticated, will redirect after sign-in')
              // The redirect will happen after successful authentication
            }
          }
          
          // Listen for Mini App events
          sdk.on('frameAdded', () => {
            console.log('⭐ Mini app was added by user')
          })
          
          sdk.on('frameRemoved', () => {
            console.log('❌ Mini app was removed by user')
          })
          
          sdk.on('notificationsEnabled', () => {
            console.log('🔔 Notifications enabled')
          })
          
          sdk.on('notificationsDisabled', () => {
            console.log('🔕 Notifications disabled')
          })
        } else {
          console.log('🌐 FarQuiz running in regular web browser')
        }
        
        // Always call ready to dismiss splash screen
        await sdk.actions.ready()
        console.log('✨ FarQuiz ready!')
        
      } catch (error) {
        console.error('❌ Error initializing Farcaster SDK:', error)
        // Always call ready to dismiss splash screen even if there's an error
        try {
          await sdk.actions.ready()
        } catch (readyError) {
          console.error('❌ Error calling ready:', readyError)
        }
      }
    }

    initializeFarcaster()
    
    return () => {
      // Cleanup listeners when component unmounts
      if (isMiniApp) {
        try {
          sdk.removeAllListeners()
        } catch (error) {
          console.error('Error cleaning up SDK listeners:', error)
        }
      }
    }
  }, [isAuthenticated, profile])

  // Handle post-authentication quiz redirect
  useEffect(() => {
    if (isMiniApp && isAuthenticated && profile) {
      const urlParams = new URLSearchParams(window.location.search)
      const quizId = urlParams.get('quiz')
      
      if (quizId) {
        console.log('🎯 User authenticated, redirecting to quiz:', quizId)
        // Small delay to ensure auth state is fully propagated
        setTimeout(() => {
          window.location.href = `/quiz/${quizId}`
        }, 1000)
      }
    }
  }, [isMiniApp, isAuthenticated, profile])
  
  return null
}