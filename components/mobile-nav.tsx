"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-slate-800 border-t border-slate-700">
      <div className="grid h-full grid-cols-2">
        <Link
          href="/"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-slate-700",
            pathname === "/" && "text-purple-400",
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          href="/explore"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-slate-700",
            pathname === "/explore" && "text-purple-400",
          )}
        >
          <Search className="w-5 h-5" />
          <span className="text-xs mt-1">Explore</span>
        </Link>
      </div>
    </div>
  )
}
