import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: "Email, password, and username are required" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if username is already taken
    const { data: existingUser, error: usernameCheckError } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle()

    if (usernameCheckError) {
      console.error("Error checking username:", usernameCheckError)
      return NextResponse.json({ error: `Error checking username: ${usernameCheckError.message}` }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "Username is already taken. Please choose another one." }, { status: 400 })
    }

    // Sign up the user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      console.error("Server-side signup error:", signUpError)
      return NextResponse.json({ error: `Authentication error: ${signUpError.message}` }, { status: 500 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "User creation failed - no user returned" }, { status: 500 })
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        username,
        display_name: username,
        avatar_url: null,
        total_score: 0,
        quizzes_taken: 0,
        quizzes_created: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: `Profile creation error: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (error: any) {
    console.error("Unexpected server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
