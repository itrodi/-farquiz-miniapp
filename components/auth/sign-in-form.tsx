"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { sdk } from "@farcaster/frame-sdk"
import { farcasterAuth } from "@/lib/farcaster-auth"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInMiniApp, setIsInMiniApp] = useState(false)
  const [checkingContext, setCheckingContext] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkContext = async () => {
      try {
        const inMiniApp = await farcasterAuth.isInMiniApp()
        setIsInMiniApp(inMiniApp)
        
        if (inMiniApp) {
          console.log("🚀 Running in Farcaster Mini App")
          // Auto sign-in for Farcaster users
          await handleFarcasterSignIn()
        }
      } catch (error) {
        console.error("Error checking context:", error)
      } finally {
        setCheckingContext(false)
      }
    }

    checkContext()
  }, [])

  const handleFarcasterSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await farcasterAuth.signInWithFarcaster()
      
      if (result.success) {
        console.log("Farcaster sign-in successful")
        router.push("/")
        router.refresh()
      } else {
        setError(result.error || "Failed to sign in with Farcaster")
      }
    } catch (error) {
      console.error("Farcaster sign-in error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      router.push("/")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  if (checkingContext) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-gray-500">Checking authentication...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          {isInMiniApp 
            ? "Sign in with your Farcaster account" 
            : "Enter your email and password to sign in"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isInMiniApp ? (
          <div className="space-y-4">
            <Button
              onClick={handleFarcasterSignIn}
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in with Farcaster"
              )}
            </Button>
            <p className="text-sm text-center text-gray-500">
              We'll use your Farcaster account to create or sign in to your FarQuiz profile
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-gray-500">
          Don't have an account?{" "}
          <Link href="/signup" className="text-purple-600 hover:underline">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}