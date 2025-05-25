import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { leaderboardUsers } from "@/lib/data"

export function LeaderboardPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Leaderboard</CardTitle>
        <CardDescription>Top quiz masters this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboardUsers.map((user, index) => (
            <div key={user.fid} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="relative w-10 h-10">
                  <Image
                    src={user.pfpUrl || "/placeholder.svg"}
                    alt={user.displayName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-xs text-slate-400">@{user.username}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{user.score}</div>
                <div className="text-xs text-slate-400">{user.quizzesTaken} quizzes</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
