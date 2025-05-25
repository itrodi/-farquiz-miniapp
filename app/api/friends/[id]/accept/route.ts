import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const friendRequestId = params.id

  try {
    // Get the user's ID from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user_id = session.user.id

    // Verify the friend request exists and is sent to the current user
    const { data: friendRequest, error: checkError } = await supabase
      .from("friends")
      .select("id, sender_id, recipient_id, status")
      .eq("id", friendRequestId)
      .eq("recipient_id", user_id)
      .eq("status", "pending")
      .single()

    if (checkError) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    // Update the friend request status to accepted
    const { data, error } = await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("id", friendRequestId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error accepting friend request:", error)
    return NextResponse.json({ error: "Failed to accept friend request" }, { status: 500 })
  }
}
