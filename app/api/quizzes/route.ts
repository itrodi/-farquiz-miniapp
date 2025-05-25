import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get("category")
  const filter = searchParams.get("filter") || "all"
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const page = Number.parseInt(searchParams.get("page") || "0")

  try {
    let query = supabase
      .from("quizzes")
      .select(`
        *,
        categories(name, emoji),
        profiles(username, display_name, avatar_url)
      `)
      .eq("is_published", true)

    if (category && category !== "all") {
      query = query.eq("category_id", category)
    }

    if (filter === "popular") {
      query = query.order("plays", { ascending: false })
    } else if (filter === "new") {
      query = query.order("created_at", { ascending: false })
    } else if (filter === "trending") {
      // For trending, we could implement a more complex algorithm
      // For now, let's just use a combination of recency and popularity
      query = query.order("plays", { ascending: false }).order("created_at", { ascending: false })
    }

    // Add pagination
    query = query.range(page * limit, (page + 1) * limit - 1)

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { title, description, emoji, category_id, time_limit, questions } = await request.json()

    // Get the user's ID from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user_id = session.user.id

    // Insert the quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title,
        description,
        emoji,
        category_id,
        creator_id: user_id,
        time_limit: time_limit || 60,
        is_published: true,
      })
      .select()
      .single()

    if (quizError) {
      throw quizError
    }

    // Insert the questions
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q: any, index: number) => ({
        quiz_id: quiz.id,
        text: q.text,
        question_type: q.type,
        options: q.options || null,
        correct_answer: q.correctAnswer || null,
        correct_answers: q.correctAnswers || null,
        image_url: q.imageUrl || null,
        map_url: q.mapUrl || null,
        map_coordinates: q.correctCoordinates || null,
        order_index: index,
      }))

      const { error: questionsError } = await supabase.from("questions").insert(questionsToInsert)

      if (questionsError) {
        throw questionsError
      }
    }

    // Update the user's quizzes_created count
    await supabase
      .from("profiles")
      .update({ quizzes_created: supabase.rpc("increment", { x: 1 }) })
      .eq("id", user_id)

    return NextResponse.json(quiz)
  } catch (error) {
    console.error("Error creating quiz:", error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}
