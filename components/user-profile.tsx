"use client"

import { useAuth } from "@/contexts/auth-kit-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export function UserProfile() {
  const { isAuthenticated, isLoading, profile, signOut } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" variant="outline" className="text-white">
        <Link href="/login">Sign In</Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={profile.pfpUrl || "/placeholder.svg"} alt={profile.username || "User"} />
        <AvatarFallback>{profile.username?.slice(0, 2) || "FC"}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{profile.displayName || profile.username || "Farcaster User"}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={signOut} className="ml-2 h-8 px-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </Button>
    </div>
  )
}
