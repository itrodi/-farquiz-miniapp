import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// WARNING: This route is for development purposes only
// It allows bypassing email confirmation in development environments
export async function POST(request: NextRequest) {
  // Only allow this in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get user by email
    const { data: userData, error: userError } = await supabase
      .from("auth.users")
      .select("id, email_confirmed_at")
      .eq("email", email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If email is already confirmed, return success
    if (userData.email_confirmed_at) {
      return NextResponse.json({ message: "Email already confirmed" })
    }

    // Update email_confirmed_at to current timestamp
    // Note: This is a direct database update and bypasses normal confirmation flow
    // Only use this in development
    const { error: updateError } = await supabase
      .from("auth.users")
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq("id", userData.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to confirm email" }, { status: 500 })
    }

    return NextResponse.json({ message: "Email confirmed successfully" })
  } catch (error) {
    console.error("Error in dev-confirm route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
