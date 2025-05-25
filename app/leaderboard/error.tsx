"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Leaderboard error:", error)
  }, [error])

  return (
    <div className="container max-w-md md:max-w-4xl mx-auto px-4 py-4 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Leaderboards</h1>

      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="mb-6 text-gray-200">We encountered an error while loading the leaderboard.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => reset()} variant="outline">
                Try again
              </Button>
              <Button onClick={() => router.push("/")}>Return to home</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
