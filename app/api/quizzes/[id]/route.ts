import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const id = params.id

  try {
    // Get the quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(`
        *,
        categories(name, emoji),
        profiles(username, display_name, avatar_url)
      `)
      .eq("id", id)
      .single()

    if (quizError) {
      throw quizError
    }

    // Get the questions
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", id)
      .order("order_index")

    if (questionsError) {
      throw questionsError
    }

    // Increment the play count
    await supabase
      .from("quizzes")
      .update({ plays: quiz.plays + 1 })
      .eq("id", id)

    return NextResponse.json({ ...quiz, questions })
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 })
  }
}
