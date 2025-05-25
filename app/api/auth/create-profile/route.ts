import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, username, displayName } = await request.json()

    if (!userId || !username) {
      return NextResponse.json({ error: "User ID and username are required" }, { status: 400 })
    }

    const supabase = createClient()

    // Create profile record
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      username,
      display_name: displayName || username,
      avatar_url: null,
      total_score: 0,
      quizzes_taken: 0,
      quizzes_created: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Server profile creation error:", error)
      return NextResponse.json({ error: `Failed to create profile: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
