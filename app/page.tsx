import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain } from "lucide-react"
import Link from "next/link"
import { FeaturedQuizzes } from "@/components/featured-quizzes"
import { PopularCategories } from "@/components/popular-categories"
import { TrendingQuizzes } from "@/components/trending-quizzes"

export default function Home() {
  return (
    <div className="container max-w-md md:max-w-4xl mx-auto px-4 py-4 md:py-8">
      <div className="flex flex-col items-center justify-center text-center mb-6 md:mb-10">
        <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-600 mb-3">
          <Brain className="h-6 w-6 md:h-8 md:w-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white">FarQuiz</h1>
        <p className="text-sm md:text-base text-slate-300">The Ultimate Quiz Experience</p>
      </div>

      <div className="mb-6 md:mb-10 md:max-w-md md:mx-auto">
        <Button className="w-full" size="sm" asChild>
          <Link href="/explore">Explore Quizzes</Link>
        </Button>
      </div>

      <div className="space-y-6 md:space-y-10 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        <section className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold">Featured</h2>
            <Link href="/explore?filter=featured" className="text-xs md:text-sm text-purple-400">
              See all
            </Link>
          </div>
          <FeaturedQuizzes />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold">Categories</h2>
            <Link href="/categories" className="text-xs md:text-sm text-purple-400">
              See all
            </Link>
          </div>
          <PopularCategories />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold">Trending Now</h2>
            <Link href="/explore?filter=trending" className="text-xs md:text-sm text-purple-400">
              See all
            </Link>
          </div>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3">
              <TrendingQuizzes />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
