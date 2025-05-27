// lib/auth-utils.ts
'use client'

import { farcasterOnlyAuth } from './farcaster-only-auth'

/**
 * Utility functions for handling authentication in client components
 */

// Get the current user's FID if authenticated
export async function getCurrentUserFid(): Promise<number | null> {
  try {
    const user = await farcasterOnlyAuth.getCurrentFarcasterUser()
    return user?.fid || null
  } catch (error) {
    console.error('Error getting current user FID:', error)
    return null
  }
}

// Helper for making authenticated API requests
export async function makeAuthenticatedRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const fid = await getCurrentUserFid()
  
  if (!fid) {
    throw new Error('User not authenticated')
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add user FID to the request body for server-side verification
  let body = options.body
  if (body && typeof body === 'string') {
    try {
      const parsedBody = JSON.parse(body)
      parsedBody.user_fid = fid
      body = JSON.stringify(parsedBody)
    } catch (error) {
      console.error('Error parsing request body:', error)
    }
  } else if (!body) {
    body = JSON.stringify({ user_fid: fid })
  }

  return fetch(url, {
    ...options,
    headers,
    body,
  })
}

// Helper for quiz score submission
export async function submitQuizScore(
  quizId: string,
  score: number,
  maxScore: number,
  timeTaken: number
): Promise<any> {
  const response = await makeAuthenticatedRequest('/api/scores', {
    method: 'POST',
    body: JSON.stringify({
      quiz_id: quizId,
      score,
      max_score: maxScore,
      time_taken: timeTaken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to submit score')
  }

  return response.json()
}

// Helper for challenge creation
export async function createChallenge(
  recipientId: string,
  quizId: string
): Promise<any> {
  const response = await makeAuthenticatedRequest('/api/challenges', {
    method: 'POST',
    body: JSON.stringify({
      recipient_id: recipientId,
      quiz_id: quizId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create challenge')
  }

  return response.json()
}

// Check if user is in Mini App context (client-side only)
export async function isInMiniAppContext(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    return await sdk.isInMiniApp()
  } catch (error) {
    console.error('Error checking Mini App context:', error)
    return false
  }
}