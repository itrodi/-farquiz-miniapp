"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface CategoryFilterProps {
  onCategorySelect: (category: string | null) => void
  selectedCategory: string | null
}

export function CategoryFilter({ onCategorySelect, selectedCategory }: CategoryFilterProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase.from("categories").select("*").order("name")

        if (error) throw error
        setCategories(data || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [supabase])

  if (loading) {
    return <div className="h-10 bg-slate-800 rounded animate-pulse"></div>
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex space-x-2 pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategorySelect(null)}
          className="shrink-0"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id.toString() ? "default" : "outline"}
            size="sm"
            onClick={() => onCategorySelect(category.id.toString())}
            className="shrink-0"
          >
            {category.emoji} {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
