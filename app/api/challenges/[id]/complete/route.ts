import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const challengeId = params.id

  try {
    console.log("Challenge complete API called for challenge ID:", challengeId)

    const { score } = await request.json()
    console.log("Score submitted:", score)

    // Get the user's ID from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      console.error("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user_id = session.user.id
    console.log("User ID:", user_id)

    // Get the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single()

    if (challengeError) {
      console.error("Error fetching challenge:", challengeError)
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    if (!challenge) {
      console.error("Challenge not found")
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    console.log("Challenge data:", challenge)

    // Check if the user is a participant
    if (challenge.challenger_id !== user_id && challenge.recipient_id !== user_id) {
      console.error("User is not a participant in this challenge")
      return NextResponse.json({ error: "You're not a participant in this challenge" }, { status: 403 })
    }

    // Determine if the user is the challenger or recipient
    const isChallenger = challenge.challenger_id === user_id

    // Update the appropriate score
    const updateData: any = {}
    if (isChallenger) {
      updateData.challenger_score = score
    } else {
      updateData.recipient_score = score
    }

    console.log("Updating challenge with:", updateData)

    // If both scores are now set, mark the challenge as completed
    if (
      (isChallenger && challenge.recipient_score !== null) ||
      (!isChallenger && challenge.challenger_score !== null)
    ) {
      updateData.status = "completed"

      // Determine the winner and award points
      const challengerScore = isChallenger ? score : challenge.challenger_score
      const recipientScore = isChallenger ? challenge.recipient_score : score

      if (challengerScore > recipientScore) {
        // Challenger wins
        await updateUserScore(supabase, challenge.challenger_id, 3)
      } else if (recipientScore > challengerScore) {
        // Recipient wins
        await updateUserScore(supabase, challenge.recipient_id, 3)
      } else {
        // Draw
        await updateUserScore(supabase, challenge.challenger_id, 1)
        await updateUserScore(supabase, challenge.recipient_id, 1)
      }
    }

    // Update the challenge
    const { error: updateError } = await supabase.from("challenges").update(updateData).eq("id", challengeId)

    if (updateError) {
      console.error("Error updating challenge:", updateError)
      throw updateError
    }

    console.log("Challenge updated successfully")
    return NextResponse.json({ success: true, challengeId })
  } catch (error) {
    console.error("Error completing challenge:", error)
    return NextResponse.json({ error: "Failed to complete challenge" }, { status: 500 })
  }
}

async function updateUserScore(supabase: any, userId: string, points: number) {
  try {
    console.log(`Updating user ${userId} score with ${points} points`)

    // First get the current score
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("total_score")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return
    }

    const currentScore = profile?.total_score || 0
    const newScore = currentScore + points

    console.log(`Current score: ${currentScore}, New score: ${newScore}`)

    // Update the score
    const { error: updateError } = await supabase.from("profiles").update({ total_score: newScore }).eq("id", userId)

    if (updateError) {
      console.error("Error updating user score:", updateError)
    }
  } catch (error) {
    console.error("Error updating user score:", error)
  }
}
