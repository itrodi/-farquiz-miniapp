import { Button } from "@/components/ui/button"
import Link from "next/link"
import { categories } from "@/lib/data"

export function PopularCategories() {
  // Only show first 4 categories
  const displayCategories = categories.slice(0, 4)

  return (
    <div className="grid grid-cols-2 gap-3">
      {displayCategories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          className="h-auto py-3 flex flex-col items-center justify-center gap-1 bg-slate-800 border-slate-700 hover:bg-slate-700"
          asChild
        >
          <Link href={`/explore?category=${category.id}`}>
            <span className="text-2xl mb-1">{category.emoji}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </Link>
        </Button>
      ))}
    </div>
  )
}
