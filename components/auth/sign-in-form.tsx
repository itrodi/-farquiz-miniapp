"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl") || "/"
  const registered = searchParams.get("registered") === "true"
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
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

      console.log("Sign in successful, redirecting to homepage")
      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      })

      // Force a hard navigation to the homepage
      window.location.href = "/"
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message || "An error occurred during sign in")
    } finally {
      setLoading(false)
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

      window.location.href = "/"
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
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        {registered && (
          <Alert className="mb-4 bg-green-800 border-green-700">
            <AlertDescription>
              Account created successfully! Please check your email to confirm your account before signing in.
            </AlertDescription>
          </Alert>
        )}

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

        <form onSubmit={handleSignIn} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <p className="text-sm text-slate-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
