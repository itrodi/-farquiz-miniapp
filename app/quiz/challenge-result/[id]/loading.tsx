import { Loader2 } from "lucide-react"

export default function ChallengeResultLoading() {
  return (
    <div className="container max-w-md md:max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
        <p className="text-center text-gray-400">Loading challenge results...</p>
      </div>
    </div>
  )
}
