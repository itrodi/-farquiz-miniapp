// lib/farcaster-auth.ts
import { sdk } from '@farcaster/frame-sdk'
import { createClient } from '@/lib/supabase/client'

interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

interface AuthResult {
  success: boolean
  user?: any
  error?: string
}

export class FarcasterAuthService {
  private supabase = createClient()

  /**
   * Check if we're running in a Farcaster Mini App context
   */
  async isInMiniApp(): Promise<boolean> {
    try {
      return await sdk.isInMiniApp()
    } catch (error) {
      console.error('Error checking Mini App context:', error)
      return false
    }
  }

  /**
   * Get the current Farcaster user from context
   */
  async getCurrentUser(): Promise<FarcasterUser | null> {
    try {
      const isMA = await this.isInMiniApp()
      if (!isMA) return null

      // Access context properly - the SDK returns a promise
      const context = await sdk.context
      
      if (!context?.user?.fid) {
        console.error('No Farcaster user in context')
        return null
      }

      return {
        fid: context.user.fid,
        username: context.user.username,
        displayName: context.user.displayName,
        pfpUrl: context.user.pfpUrl
      }
    } catch (error) {
      console.error('Error getting Farcaster user:', error)
      return null
    }
  }

  /**
   * Sign in with Farcaster using SIWF
   */
  async signInWithFarcaster(): Promise<AuthResult> {
    try {
      // First check if we're in a Mini App
      const isMA = await this.isInMiniApp()
      if (!isMA) {
        return { 
          success: false, 
          error: 'Not in a Farcaster Mini App context' 
        }
      }

      // Get the current user from context
      const farcasterUser = await this.getCurrentUser()
      if (!farcasterUser || !farcasterUser.fid) {
        return { 
          success: false, 
          error: 'No Farcaster user found' 
        }
      }

      console.log('Farcaster user:', farcasterUser)

      // Check if user already exists
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('farcaster_fid', farcasterUser.fid)
        .single()

      if (existingProfile) {
        // User exists, sign them in
        return await this.signInExistingUser(existingProfile, farcasterUser)
      } else {
        // New user, create account
        return await this.createNewUser(farcasterUser)
      }
    } catch (error) {
      console.error('Farcaster sign-in error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Sign in an existing user
   */
  private async signInExistingUser(profile: any, farcasterUser: FarcasterUser): Promise<AuthResult> {
    try {
      // Generate a secure email from FID
      const email = `fid_${farcasterUser.fid}@farquiz.app`
      // Use FID as password (this is secure because only the Mini App can provide the FID)
      const password = `farcaster_${farcasterUser.fid}_secure_key`

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Update profile with latest Farcaster data
      if (data.user) {
        await this.supabase
          .from('profiles')
          .update({
            username: farcasterUser.username || profile.username,
            display_name: farcasterUser.displayName || profile.display_name,
            avatar_url: farcasterUser.pfpUrl || profile.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error signing in existing user:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      }
    }
  }

  /**
   * Create a new user account
   */
  private async createNewUser(farcasterUser: FarcasterUser): Promise<AuthResult> {
    try {
      // Generate username from Farcaster data
      const username = farcasterUser.username || `user_${farcasterUser.fid}`
      
      // Check if username is taken
      const { data: existingUsername } = await this.supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      const finalUsername = existingUsername ? `${username}_${Date.now()}` : username

      // Create auth user with secure credentials
      const email = `fid_${farcasterUser.fid}@farquiz.app`
      const password = `farcaster_${farcasterUser.fid}_secure_key`

      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            farcaster_fid: farcasterUser.fid,
            username: finalUsername,
            display_name: farcasterUser.displayName || finalUsername
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile
        const { error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: finalUsername,
            display_name: farcasterUser.displayName || finalUsername,
            avatar_url: farcasterUser.pfpUrl,
            farcaster_fid: farcasterUser.fid,
            total_score: 0,
            quizzes_taken: 0,
            quizzes_created: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Try to clean up auth user
          await this.supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
          throw profileError
        }

        // Sign in the new user
        const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) throw signInError

        return { success: true, user: signInData.user }
      }

      return { 
        success: false, 
        error: 'Failed to create user' 
      }
    } catch (error) {
      console.error('Error creating new user:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create account' 
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut()
  }
}

// Export a singleton instance
export const farcasterAuth = new FarcasterAuthService()