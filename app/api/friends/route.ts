import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "accepted"

  try {
    // Get the user's ID from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user_id = session.user.id

    let query

    if (status === "pending") {
      // Get friend requests sent to the user
      query = supabase
        .from("friends")
        .select(`
          id, created_at, 
          sender:profiles!sender_id(id, username, display_name, avatar_url)
        `)
        .eq("recipient_id", user_id)
        .eq("status", "pending")
    } else if (status === "sent") {
      // Get friend requests sent by the user
      query = supabase
        .from("friends")
        .select(`
          id, created_at, 
          recipient:profiles!recipient_id(id, username, display_name, avatar_url)
        `)
        .eq("sender_id", user_id)
        .eq("status", "pending")
    } else {
      // Get accepted friends (both ways)
      query = supabase
        .from("friends")
        .select(`
          id, created_at,
          sender:profiles!sender_id(id, username, display_name, avatar_url),
          recipient:profiles!recipient_id(id, username, display_name, avatar_url)
        `)
        .or(`sender_id.eq.${user_id},recipient_id.eq.${user_id}`)
        .eq("status", "accepted")
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // For accepted friends, format the response to show the friend's info
    if (status === "accepted") {
      const formattedData = data.map((friend) => {
        const isSender = friend.sender.id === user_id
        return {
          id: friend.id,
          created_at: friend.created_at,
          friend: isSender ? friend.recipient : friend.sender,
        }
      })

      return NextResponse.json(formattedData)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching friends:", error)
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { recipient_id } = await request.json()

    // Get the user's ID from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sender_id = session.user.id

    // Check if a friend request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from("friends")
      .select("id, status")
      .or(
        `and(sender_id.eq.${sender_id},recipient_id.eq.${recipient_id}),and(sender_id.eq.${recipient_id},recipient_id.eq.${sender_id})`,
      )
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      throw checkError
    }

    if (existingRequest) {
      if (existingRequest.status === "accepted") {
        return NextResponse.json({ error: "Already friends" }, { status: 400 })
      } else if (existingRequest.status === "pending") {
        return NextResponse.json({ error: "Friend request already sent" }, { status: 400 })
      }
    }

    // Create the friend request
    const { data, error } = await supabase
      .from("friends")
      .insert({
        sender_id,
        recipient_id,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating friend request:", error)
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 })
  }
}
