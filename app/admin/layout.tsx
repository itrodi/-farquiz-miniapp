import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Award, Users, LayoutDashboard, LogOut } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin Dashboard - BrainCast",
  description: "Admin dashboard for BrainCast",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-slate-700">
        <div className="flex h-16 items-center px-4 container max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="font-bold text-lg flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            <span className="hidden sm:inline">BrainCast Admin</span>
            <span className="sm:hidden">Admin</span>
          </Link>
          <nav className="ml-auto flex items-center space-x-4">
            <Link href="/" className="text-sm font-medium">
              Return to App
            </Link>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/login">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log out</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
      <div className="flex-1 flex">
        <div className="hidden md:flex w-64 flex-col border-r border-slate-700">
          <div className="p-4 space-y-4">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/quizzes">
                <BookOpen className="mr-2 h-4 w-4" />
                Quizzes
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/achievements">
                <Award className="mr-2 h-4 w-4" />
                Achievements
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8">
          <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/quizzes">
                <BookOpen className="mr-2 h-4 w-4" />
                Quizzes
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/achievements">
                <Award className="mr-2 h-4 w-4" />
                Achievements
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Link>
            </Button>
          </div>
          <Separator className="md:hidden mb-4" />
          {children}
        </div>
      </div>
    </div>
  )
}
