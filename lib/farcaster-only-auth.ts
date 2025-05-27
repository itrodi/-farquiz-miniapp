// lib/farcaster-only-auth.ts
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
  profile?: any
  error?: string
}

export class FarcasterOnlyAuth {
  private supabase = createClient()

  /**
   * Check if we're in a Mini App and get user context
   */
  async getCurrentFarcasterUser(): Promise<FarcasterUser | null> {
    try {
      // Check if we're in a Mini App
      const isInMiniApp = await sdk.isInMiniApp()
      if (!isInMiniApp) {
        console.log('Not in Mini App context')
        return null
      }

      // Get user from context
      const context = sdk.context
      if (!context?.user?.fid) {
        console.log('No Farcaster user in context')
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
   * Main authentication method - handles everything
   */
  async authenticateWithFarcaster(): Promise<AuthResult> {
    try {
      // Get Farcaster user from context
      const farcasterUser = await this.getCurrentFarcasterUser()
      
      if (!farcasterUser) {
        return {
          success: false,
          error: 'No Farcaster user found'
        }
      }

      console.log('Authenticating Farcaster user:', farcasterUser)

      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('farcaster_fid', farcasterUser.fid)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError)
        // Continue to create profile
      }

      let profile = existingProfile

      if (!profile) {
        // Create new profile
        const newProfile = await this.createProfile(farcasterUser)
        if (!newProfile) {
          return {
            success: false,
            error: 'Failed to create user profile'
          }
        }
        profile = newProfile
      } else {
        // Update existing profile with latest Farcaster data
        profile = await this.updateProfile(profile.id, farcasterUser)
      }

      return {
        success: true,
        profile
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * Create a new user profile
   */
  private async createProfile(farcasterUser: FarcasterUser): Promise<any> {
    try {
      // Generate username
      const baseUsername = farcasterUser.username || `user${farcasterUser.fid}`
      let username = baseUsername

      // Check if username exists and make it unique if needed
      const { data: existingUsername } = await this.supabase
        .from('profiles')
        .select('username')
        .eq('username', baseUsername)
        .maybeSingle()

      if (existingUsername) {
        username = `${baseUsername}_${Date.now()}`
      }

      // Create profile
      const profileData = {
        id: `fc_${farcasterUser.fid}`, // Use Farcaster FID as the primary key
        farcaster_fid: farcasterUser.fid,
        username,
        display_name: farcasterUser.displayName || username,
        avatar_url: farcasterUser.pfpUrl,
        total_score: 0,
        quizzes_taken: 0,
        quizzes_created: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Profile creation error:', error)
        return null
      }

      console.log('Created new profile:', data)
      return data
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }

  /**
   * Update existing profile with latest Farcaster data
   */
  private async updateProfile(profileId: string, farcasterUser: FarcasterUser): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          username: farcasterUser.username || undefined,
          display_name: farcasterUser.displayName || undefined,
          avatar_url: farcasterUser.pfpUrl || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .select()
        .single()

      if (error) {
        console.error('Profile update error:', error)
        // Return the profile as-is if update fails
        const { data: fallbackProfile } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single()
        return fallbackProfile
      }

      return data
    } catch (error) {
      console.error('Error updating profile:', error)
      return null
    }
  }

  /**
   * Get profile by Farcaster FID
   */
  async getProfileByFid(fid: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('farcaster_fid', fid)
        .single()

      if (error) {
        console.error('Error fetching profile by FID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProfileByFid:', error)
      return null
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentFarcasterUser()
    return !!user
  }
}

// Export singleton instance
export const farcasterOnlyAuth = new FarcasterOnlyAuth()