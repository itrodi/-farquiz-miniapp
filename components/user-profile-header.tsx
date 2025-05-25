"use client"

import { useAuth } from "@/contexts/auth-kit-context"
import { LogOut, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function UserProfileHeader() {
  const { isAuthenticated, isLoading, profile, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const handleSignOut = async () => {
    await signOut()
    setShowDropdown(false)
  }

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse"></div>
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 transition-colors text-white text-sm font-medium"
      >
        Login
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden border-2 border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        aria-label="User menu"
      >
        {profile?.pfpUrl ? (
          <Image
            src={profile.pfpUrl || "/placeholder.svg"}
            alt="Profile"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-slate-700 text-white">
            <User className="h-4 w-4" />
          </div>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
              <div className="font-medium">{profile?.displayName || profile?.username || "User"}</div>
              <div className="text-xs text-gray-500">{profile?.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              role="menuitem"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
