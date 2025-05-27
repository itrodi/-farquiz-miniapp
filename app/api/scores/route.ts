// app/api/scores/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { quiz_id, score, max_score, time_taken, user_fid } = await request.json()

    if (!user_fid) {
      return NextResponse.json({ error: "User FID is required" }, { status: 400 })
    }

    // Get user profile by FID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('farcaster_fid', user_fid)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const user_id = profile.id
    const percentage = Math.round((score / max_score) * 100)

    // Insert the score
    const { data, error } = await supabase
      .from("user_scores")
      .insert({
        user_id,
        quiz_id,
        score,
        max_score,
        percentage,
        time_taken,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update the user's total_score and quizzes_taken
    await supabase
      .from("profiles")
      .update({
        total_score: profile.total_score + score,
        quizzes_taken: profile.quizzes_taken + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", user_id)

    // Check for achievements
    await checkAchievements(supabase, user_id, quiz_id, percentage)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error saving score:", error)
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 })
  }
}

async function checkAchievements(supabase: any, user_id: string, quiz_id: string, percentage: number) {
  try {
    // Get all achievements
    const { data: achievements } = await supabase.from("achievements").select("*")

    // Get user's current achievements
    const { data: userAchievements } = await supabase.from("user_achievements").select("*").eq("user_id", user_id)

    // Check each achievement
    for (const achievement of achievements) {
      const userAchievement = userAchievements.find((ua: any) => ua.achievement_id === achievement.id)

      // If the user doesn't have this achievement yet
      if (!userAchievement) {
        // Create it with initial progress
        await supabase.from("user_achievements").insert({
          user_id,
          achievement_id: achievement.id,
          progress: 0,
          max_progress: 100,
          unlocked: false,
        })
      }

      // Update progress based on achievement criteria
      if (achievement.criteria) {
        const criteria = achievement.criteria

        // Example: Perfect Score achievement
        if (criteria.type === "perfect_score" && percentage === 100) {
          await updateAchievementProgress(supabase, user_id, achievement.id, 100, 100)
        }

        // Example: Quizzes Taken achievement
        if (criteria.type === "quizzes_taken") {
          const { data: profile } = await supabase.from("profiles").select("quizzes_taken").eq("id", user_id).single()

          const progress = Math.min(100, (profile.quizzes_taken / criteria.count) * 100)
          await updateAchievementProgress(supabase, user_id, achievement.id, progress, 100)
        }

        // Add more achievement types as needed
      }
    }
  } catch (error) {
    console.error("Error checking achievements:", error)
  }
}

async function updateAchievementProgress(
  supabase: any,
  user_id: string,
  achievement_id: number,
  progress: number,
  max_progress: number,
) {
  try {
    const { data: userAchievement } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user_id)
      .eq("achievement_id", achievement_id)
      .single()

    const unlocked = progress >= max_progress
    const update: any = { progress, max_progress }

    // If newly unlocked, set the unlocked_at timestamp
    if (unlocked && !userAchievement.unlocked) {
      update.unlocked = true
      update.unlocked_at = new Date().toISOString()
    }

    await supabase.from("user_achievements").update(update).eq("user_id", user_id).eq("achievement_id", achievement_id)
  } catch (error) {
    console.error("Error updating achievement progress:", error)
  }
}