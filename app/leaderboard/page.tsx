import LeaderboardClientWrapper from "./client"

export default function LeaderboardPage() {
  return (
    <div className="container max-w-md md:max-w-4xl mx-auto px-4 py-4 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Leaderboards</h1>
      <LeaderboardClientWrapper />
    </div>
  )
}
