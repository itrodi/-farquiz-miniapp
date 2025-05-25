import { Button } from "@/components/ui/button"
import Link from "next/link"
import { categories } from "@/lib/data"

export function CategoryList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          className="h-auto py-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-800"
          asChild
        >
          <Link href={`/quizzes?category=${category.id}`}>
            <span className="text-3xl mb-2">{category.emoji}</span>
            <span className="text-lg font-medium">{category.name}</span>
            <span className="text-xs text-slate-400">{category.quizCount} quizzes</span>
          </Link>
        </Button>
      ))}
    </div>
  )
}
