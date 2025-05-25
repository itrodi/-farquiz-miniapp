"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"

export default function AdminCreateAchievementPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [emoji, setEmoji] = useState("🏆")
  const [criteriaType, setCriteriaType] = useState("quizzes_taken")
  const [criteriaValue, setCriteriaValue] = useState("5")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the achievement",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create criteria object based on type
      const criteria: any = { type: criteriaType }

      if (criteriaType === "quizzes_taken" || criteriaType === "quizzes_created" || criteriaType === "perfect_score") {
        criteria.count = Number.parseInt(criteriaValue)
      } else if (criteriaType === "total_score") {
        criteria.value = Number.parseInt(criteriaValue)
      }

      // Insert achievement
      const { data, error } = await supabase
        .from("achievements")
        .insert({
          name,
          description,
          emoji,
          criteria,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Achievement created",
        description: "The achievement has been created successfully",
      })

      router.push("/admin/achievements")
    } catch (error) {
      console.error("Error creating achievement:", error)
      toast({
        title: "Error",
        description: "Failed to create achievement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin/achievements">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Achievement</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Achievement Name</Label>
              <Input
                id="name"
                placeholder="e.g., Quiz Master"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-700 border-slate-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Complete 10 quizzes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                placeholder="🏆"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="criteriaType">Criteria Type</Label>
                <Select value={criteriaType} onValueChange={setCriteriaType}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select criteria type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quizzes_taken">Quizzes Taken</SelectItem>
                    <SelectItem value="quizzes_created">Quizzes Created</SelectItem>
                    <SelectItem value="perfect_score">Perfect Scores</SelectItem>
                    <SelectItem value="total_score">Total Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="criteriaValue">{criteriaType === "total_score" ? "Score Value" : "Count"}</Label>
                <Input
                  id="criteriaValue"
                  type="number"
                  min="1"
                  placeholder={criteriaType === "total_score" ? "e.g., 1000" : "e.g., 5"}
                  value={criteriaValue}
                  onChange={(e) => setCriteriaValue(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/achievements">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Achievement"}
          </Button>
        </div>
      </form>
    </div>
  )
}
