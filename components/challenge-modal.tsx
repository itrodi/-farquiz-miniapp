"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface ChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  recipientId: string
  recipientName: string
}

export function ChallengeModal({ isOpen, onClose, recipientId, recipientName }: ChallengeModalProps) {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [challenging, setChallenging] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from("quizzes")
          .select("id, title, description, emoji, category_id, categories(name)")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(20)

        if (debouncedSearchQuery) {
          query = query.ilike("title", `%${debouncedSearchQuery}%`)
        }

        const { data, error } = await query

        if (error) throw error
        setQuizzes(data || [])
      } catch (error) {
        console.error("Error fetching quizzes:", error)
        toast({
          title: "Error",
          description: "Failed to load quizzes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchQuizzes()
    }
  }, [debouncedSearchQuery, isOpen])

  const handleChallenge = async (quizId: string) => {
    setChallenging(true)
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          quiz_id: quizId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create challenge")
      }

      const data = await response.json()

      toast({
        title: "Challenge sent!",
        description: `You've challenged ${recipientName} to a quiz.`,
      })

      onClose()

      // Navigate to the quiz to play it immediately
      router.push(`/quiz/${quizId}?challenge=${data.id}`)
    } catch (error) {
      console.error("Error creating challenge:", error)
      toast({
        title: "Error",
        description: "Failed to send challenge. Please try again.",
        variant: "destructive",
      })
    } finally {
      setChallenging(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Challenge {recipientName}</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            type="search"
            placeholder="Search quizzes..."
            className="bg-slate-800 border-slate-700 pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {quiz.emoji && <span className="mr-1">{quiz.emoji}</span>}
                          {quiz.title}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-1">{quiz.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{quiz.categories?.name}</p>
                      </div>
                      <Button size="sm" onClick={() => handleChallenge(quiz.id)} disabled={challenging}>
                        {challenging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Challenge"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {quizzes.length === 0 && (
                <div className="text-center py-8 text-gray-400">No quizzes found. Try a different search term.</div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
