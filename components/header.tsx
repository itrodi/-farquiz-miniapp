import { Brain } from "lucide-react"
import Link from "next/link"
import { UserProfileHeader } from "./user-profile-header"

export function Header() {
  return (
    <header className="bg-slate-800 border-b border-slate-700 py-3 px-4">
      <div className="container max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">FarQuiz</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/explore" className="text-sm font-medium hover:text-white">
            Explore
          </Link>
        </nav>

        <UserProfileHeader />
      </div>
    </header>
  )
}
