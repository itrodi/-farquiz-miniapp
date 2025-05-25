"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserQuizzes } from "@/components/user-quizzes"
import { UserAchievements } from "@/components/user-achievements"
import { UserChallenges } from "@/components/user-challenges"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-kit-context"
import { toast } from "@/components/ui/use-toast"

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [userQuizzes, setUserQuizzes] = useState<any[]>([])
  const [userAchievements, setUserAchievements] = useState<any[]>([])
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([])
  const [selectedQuizId, setSelectedQuizId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [challengeLoading, setChallengeLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { profile: currentUserProfile, isAuthenticated } = useAuth()
  const userId = params.id

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true)
      try {
        // Get the user profile
        const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error || !profileData) {
          notFound()
        }

        setProfile(profileData)

        // Get user's quizzes
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories(*)
          `)
          .eq("creator_id", userId)
          .order("created_at", { ascending: false })

        setUserQuizzes(quizzes || [])

        // Get user's achievements
        const { data: achievements } = await supabase
          .from("user_achievements")
          .select(`
            *,
            achievements(*)
          `)
          .eq("user_id", userId)

        setUserAchievements(achievements || [])

        // Get available quizzes for challenges
        const { data: allQuizzes } = await supabase
          .from("quizzes")
          .select("id, title, emoji")
          .eq("is_published", true)
          .order("plays", { ascending: false })
          .limit(20)

        setAvailableQuizzes(allQuizzes || [])
        if (allQuizzes && allQuizzes.length > 0) {
          setSelectedQuizId(allQuizzes[0].id)
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [userId])

  const handleChallenge = async () => {
    if (!isAuthenticated || !currentUserProfile) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to challenge other users.",
        variant: "destructive",
      })
      return
    }

    if (currentUserProfile.id === userId) {
      toast({
        title: "Cannot challenge yourself",
        description: "You cannot challenge yourself to a quiz.",
        variant: "destructive",
      })
      return
    }

    if (!selectedQuizId) {
      toast({
        title: "No quiz selected",
        description: "Please select a quiz for the challenge.",
        variant: "destructive",
      })
      return
    }

    setChallengeLoading(true)
    try {
      // Create the challenge
      await fetch("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: userId,
          quiz_id: selectedQuizId,
        }),
      })

      toast({
        title: "Challenge created!",
        description: `You've challenged ${profile.display_name || profile.username} to a quiz. Take the quiz now to set your score.`,
      })

      // Redirect to the quiz
      router.push(`/quiz/${selectedQuizId}?challenge=true`)
    } catch (error) {
      console.error("Error creating challenge:", error)
      toast({
        title: "Failed to create challenge",
        description: "There was an error creating the challenge. Please try again.",
        variant: "destructive",
      })
    } finally {
      setChallengeLoading(false)
      setDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return notFound()
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="mb-8 bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold mb-1">{profile?.display_name || profile?.username || "Anonymous"}</h1>
              {profile?.username && <p className="text-gray-400 mb-4">@{profile.username}</p>}

              <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.total_score || 0}</p>
                  <p className="text-sm text-gray-400">Total Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.quizzes_taken || 0}</p>
                  <p className="text-sm text-gray-400">Quizzes Taken</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.quizzes_created || 0}</p>
                  <p className="text-sm text-gray-400">Quizzes Created</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userAchievements?.filter((a) => a.unlocked).length || 0}</p>
                  <p className="text-sm text-gray-400">Achievements</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center sm:justify-end mt-6 gap-2">
            {isAuthenticated && currentUserProfile?.id !== userId && (
              <>
                <Button variant="outline">Add Friend</Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Challenge</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Challenge to a Quiz</DialogTitle>
                      <DialogDescription>
                        Challenge {profile?.display_name || profile?.username} to a quiz. You'll take the quiz first to
                        set your score.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select a Quiz</label>
                          <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a quiz" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableQuizzes.map((quiz) => (
                                <SelectItem key={quiz.id} value={quiz.id}>
                                  {quiz.emoji && <span className="mr-2">{quiz.emoji}</span>}
                                  {quiz.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleChallenge} disabled={challengeLoading}>
                        {challengeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {challengeLoading ? "Creating Challenge..." : "Challenge"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="quizzes">
        <TabsList className="mb-6">
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes">
          <UserQuizzes quizzes={userQuizzes} />
        </TabsContent>

        <TabsContent value="achievements">
          <UserAchievements achievements={userAchievements} />
        </TabsContent>

        <TabsContent value="challenges">
          <UserChallenges userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
