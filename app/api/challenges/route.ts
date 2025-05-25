import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const status = searchParams.get("status") || "active"

  try {
    // Get the user's ID from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user_id = session.user.id

    let query = supabase.from("challenges").select(`
        *,
        challenger:profiles!challenger_id(username, display_name, avatar_url),
        recipient:profiles!recipient_id(username, display_name, avatar_url),
        quiz:quizzes(title, emoji)
      `)

    if (status === "active") {
      // Active challenges are pending challenges where the user is the recipient
      query = query.eq("recipient_id", user_id).eq("status", "pending")
    } else if (status === "sent") {
      // Sent challenges are challenges where the user is the challenger
      query = query.eq("challenger_id", user_id)
    } else if (status === "history") {
      // History includes completed challenges where the user is either challenger or recipient
      query = query.or(`challenger_id.eq.${user_id},recipient_id.eq.${user_id}`).eq("status", "completed")
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching challenges:", error)
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { recipient_id, quiz_id } = await request.json()

    // Get the user's ID from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const challenger_id = session.user.id

    // Validate that the recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", recipient_id)
      .single()

    if (recipientError) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Create the challenge
    const { data, error } = await supabase
      .from("challenges")
      .insert({
        challenger_id,
        recipient_id,
        quiz_id,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating challenge:", error)
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
  }
}
