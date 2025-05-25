"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
  quizId: string
  quizTitle: string
}

export function UserSearchModal({ isOpen, onClose, quizId, quizTitle }: UserSearchModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [challenging, setChallenging] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        setUsers([])
        return
      }

      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const currentUserId = session?.user?.id

        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .or(`username.ilike.%${debouncedSearchQuery}%,display_name.ilike.%${debouncedSearchQuery}%`)
          .neq("id", currentUserId)
          .limit(10)

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error("Error searching users:", error)
        toast({
          title: "Error",
          description: "Failed to search users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchUsers()
    }
  }, [debouncedSearchQuery, isOpen])

  const handleChallenge = async (userId: string, userName: string) => {
    setChallenging(true)
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: userId,
          quiz_id: quizId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create challenge")
      }

      const data = await response.json()

      toast({
        title: "Challenge sent!",
        description: `You've challenged ${userName} to this quiz.`,
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
          <DialogTitle>Challenge a Friend</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            type="search"
            placeholder="Search users..."
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
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.display_name?.charAt(0) || user.username?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.display_name || user.username}</div>
                      {user.username && user.display_name && (
                        <div className="text-sm text-gray-400">@{user.username}</div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleChallenge(user.id, user.display_name || user.username)}
                    disabled={challenging}
                  >
                    {challenging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Challenge"}
                  </Button>
                </div>
              ))}

              {debouncedSearchQuery.length >= 2 && users.length === 0 && (
                <div className="text-center py-8 text-gray-400">No users found. Try a different search term.</div>
              )}

              {debouncedSearchQuery.length < 2 && (
                <div className="text-center py-8 text-gray-400">Type at least 2 characters to search for users.</div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
