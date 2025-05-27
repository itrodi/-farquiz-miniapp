// components/auth-status.tsx
'use client'

import { useAuth } from "@/contexts/simplified-auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AuthStatus() {
  const { isAuthenticated, isLoading, profile, signOut } = useAuth()

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Authenticating with Farcaster...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isAuthenticated || !profile) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            Farcaster Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-orange-400/10 border-orange-400/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              FarQuiz requires Farcaster authentication. Please open this app through a Farcaster client to sign in automatically.
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2 text-sm text-gray-400">
            <p>• Open Warpcast or another Farcaster client</p>
            <p>• Navigate to FarQuiz Mini App</p>
            <p>• You'll be automatically authenticated</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          Authenticated via Farcaster
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>
              {profile.display_name?.charAt(0) || profile.username?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold">
              {profile.display_name || profile.username || "Anonymous"}
            </h3>
            {profile.username && (
              <p className="text-sm text-gray-400">@{profile.username}</p>
            )}
            <p className="text-xs text-gray-500">FID: {profile.farcaster_fid}</p>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-purple-400">
              {profile.total_score || 0}
            </div>
            <div className="text-xs text-gray-400">Total Score</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-700 rounded-lg p-2">
            <div className="font-semibold">{profile.quizzes_taken || 0}</div>
            <div className="text-xs text-gray-400">Quizzes Taken</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-2">
            <div className="font-semibold">{profile.quizzes_created || 0}</div>
            <div className="text-xs text-gray-400">Quizzes Created</div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple inline auth check for pages
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8">
        <AuthStatus />
      </div>
    )
  }

  return <>{children}</>
}