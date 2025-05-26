"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, User } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { sdk } from "@farcaster/frame-sdk"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  
  // Farcaster Mini App states
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<any>(null)
  const [farcasterLoading, setFarcasterLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl") || "/"
  const registered = searchParams.get("registered") === "true"
  const supabase = createClient()

  // Check for Mini App context on component mount
  useEffect(() => {
    const checkMiniAppContext = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp()
        setIsMiniApp(isInMiniApp)
        
        if (isInMiniApp) {
          const context = sdk.context
          console.log('Mini App Context:', context)
          
          if (context.user) {
            setFarcasterUser(context.user)
            console.log('Farcaster user detected:', context.user)
          } else {
            console.log('No Farcaster user in context')
            setShowEmailForm(true)
          }
        } else {
          setShowEmailForm(true)
        }
      } catch (error) {
        console.error('Error checking Mini App context:', error)
        setShowEmailForm(true)
      }
    }
    
    checkMiniAppContext()
  }, [])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setEmailNotConfirmed(false)
    setResendSuccess(false)

    try {
      console.log("Attempting to sign in with email:", email)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("Sign in error:", signInError)
        if (signInError.message.includes("Email not confirmed")) {
          setEmailNotConfirmed(true)
        }
        throw signInError
      }

      console.log("Sign in successful, redirecting")
      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      })

      // Force a hard navigation to the homepage
      window.location.href = returnUrl
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message || "An error occurred during sign in")
    } finally {
      setLoading(false)
    }
  }

  const handleFarcasterSignIn = async () => {
    if (!farcasterUser) {
      setError("No Farcaster user data available")
      return
    }

    try {
      setFarcasterLoading(true)
      setError(null)

      console.log('Attempting Farcaster sign-in for FID:', farcasterUser.fid)

      // Check if user already exists by FID
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('farcaster_fid', farcasterUser.fid)
        .single()

      if (existingProfile) {
        console.log('Existing Farcaster user found, signing in')
        // Sign in existing user
        const tempEmail = `farcaster_${farcasterUser.fid}@miniapp.local`
        const tempPassword = `farcaster_${farcasterUser.fid}_temp`
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: tempPassword,
        })

        if (signInError) {
          throw signInError
        }

        toast({
          title: "Welcome back!",
          description: `Signed in as ${farcasterUser.displayName || farcasterUser.username || `User ${farcasterUser.fid}`}`,
        })
      } else {
        console.log('New Farcaster user, creating account')
        // Create new user
        const tempEmail = `farcaster_${farcasterUser.fid}@miniapp.local`
        const tempPassword = `farcaster_${farcasterUser.fid}_temp`
        const username = farcasterUser.username || `user_${farcasterUser.fid}`

        // Check if username is taken
        const { data: usernameCheck } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single()

        const finalUsername = usernameCheck ? `${username}_${farcasterUser.fid}` : username

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: tempEmail,
          password: tempPassword,
        })

        if (authError || !authData.user) {
          throw authError || new Error('Failed to create user')
        }

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: finalUsername,
            display_name: farcasterUser.displayName || farcasterUser.username || `User ${farcasterUser.fid}`,
            avatar_url: farcasterUser.pfpUrl,
            farcaster_fid: farcasterUser.fid,
            total_score: 0,
            quizzes_taken: 0,
            quizzes_created: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          throw profileError
        }

        toast({
          title: "Welcome to FarQuiz!",
          description: `Account created for ${farcasterUser.displayName || farcasterUser.username || `User ${farcasterUser.fid}`}`,
        })
      }

      // Redirect after successful sign-in
      window.location.href = returnUrl
    } catch (error: any) {
      console.error('Farcaster sign-in error:', error)
      setError(error.message || "Failed to sign in with Farcaster")
    } finally {
      setFarcasterLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResendingEmail(true)
    setResendSuccess(false)
    setError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) throw error

      setResendSuccess(true)
    } catch (error: any) {
      console.error("Error resending confirmation email:", error)
      setError(`Failed to resend confirmation email: ${error.message}`)
    } finally {
      setResendingEmail(false)
    }
  }

  // For development bypass
  const handleDevConfirm = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/auth/dev-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to confirm email")
      }

      toast({
        title: "Email confirmed",
        description: "You can now sign in",
      })

      // Try to sign in automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      window.location.href = returnUrl
    } catch (error: any) {
      console.error("Dev confirm error:", error)
      setError(error.message || "An error occurred during confirmation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          {isMiniApp 
            ? "Welcome to FarQuiz! Choose how you'd like to sign in." 
            : "Sign in to your account to continue"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registered && (
          <Alert className="mb-4 bg-green-800 border-green-700">
            <AlertDescription>
              Account created successfully! Please check your email to confirm your account before signing in.
            </AlertDescription>
          </Alert>
        )}

        {/* Farcaster Sign In - only show in Mini App with user context */}
        {isMiniApp && farcasterUser && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden">
                {farcasterUser.pfpUrl ? (
                  <img 
                    src={farcasterUser.pfpUrl} 
                    alt="Profile" 
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {farcasterUser.displayName || farcasterUser.username || `User ${farcasterUser.fid}`}
                </p>
                <p className="text-sm text-gray-400">FID: {farcasterUser.fid}</p>
                {farcasterUser.username && (
                  <p className="text-sm text-gray-400">@{farcasterUser.username}</p>
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleFarcasterSignIn}
              disabled={farcasterLoading}
              className="w-full"
              size="lg"
            >
              {farcasterLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Continue with Farcaster"
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">
                  Or continue with email
                </span>
              </div>
            </div>
            
            {!showEmailForm && (
              <Button 
                variant="outline" 
                onClick={() => setShowEmailForm(true)}
                className="w-full"
                size="sm"
              >
                Use Email & Password Instead
              </Button>
            )}
          </div>
        )}

        {/* Email Sign In Form - show always on web, or when requested in Mini App */}
        {(showEmailForm || !isMiniApp) && (
          <>
            {emailNotConfirmed && (
              <Alert className="mb-4 bg-amber-800 border-amber-700">
                <AlertDescription className="flex flex-col gap-2">
                  <p>Your email address has not been confirmed yet. Please check your inbox for a confirmation email.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-amber-600 hover:bg-amber-700"
                    onClick={handleResendConfirmation}
                    disabled={resendingEmail}
                  >
                    {resendingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Confirmation Email
                      </>
                    )}
                  </Button>

                  {process.env.NODE_ENV === "development" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-purple-600 hover:bg-purple-700"
                      onClick={handleDevConfirm}
                      disabled={loading}
                    >
                      Dev: Confirm Email
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {resendSuccess && (
              <Alert className="mb-4 bg-green-800 border-green-700">
                <AlertDescription>Confirmation email has been resent. Please check your inbox.</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900"
                />
              </div>

              {error && !emailNotConfirmed && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                variant={isMiniApp && farcasterUser ? "outline" : "default"}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Option to go back to Farcaster sign-in in Mini App */}
            {isMiniApp && farcasterUser && showEmailForm && (
              <div className="mt-4 text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowEmailForm(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  ← Back to Farcaster Sign In
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <p className="text-sm text-slate-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:underline">
            Sign Up
          </Link>
        </p>
        
        {/* Mini App context indicator */}
        {isMiniApp && (
          <p className="text-xs text-gray-500 text-center">
            Running in Farcaster Mini App
          </p>
        )}
      </CardFooter>
    </Card>
  )
}