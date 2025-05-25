import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const id = params.id

  try {
    const { status, recipient_score } = await request.json()

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
      .eq("id", id)
      .single()

    if (challengeError) {
      throw challengeError
    }

    // Verify that the user is the recipient
    if (challenge.recipient_id !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update the challenge
    const update: any = { status }
    if (recipient_score !== undefined) {
      update.recipient_score = recipient_score
    }

    const { data, error } = await supabase.from("challenges").update(update).eq("id", id).select().single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating challenge:", error)
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 })
  }
}
