import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const challengeId = params.id

  try {
    // Get the user's ID from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user_id = session.user.id

    // Get the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("recipient_id", user_id) // Ensure the user is the recipient
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: "Challenge not found or you're not the recipient" }, { status: 404 })
    }

    if (challenge.status !== "pending") {
      return NextResponse.json({ error: "Challenge is not pending" }, { status: 400 })
    }

    // Update the challenge status to "declined"
    const { error: updateError } = await supabase
      .from("challenges")
      .update({ status: "declined" })
      .eq("id", challengeId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error declining challenge:", error)
    return NextResponse.json({ error: "Failed to decline challenge" }, { status: 500 })
  }
}
