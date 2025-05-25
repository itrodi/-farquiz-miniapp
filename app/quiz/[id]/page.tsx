import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { MultipleChoiceQuiz } from "@/components/quiz-types/multiple-choice-quiz"
import { ImageQuiz } from "@/components/quiz-types/image-quiz"
import { ListQuiz } from "@/components/quiz-types/list-quiz"
import { MapQuiz } from "@/components/quiz-types/map-quiz"
import { ImageFillQuiz } from "@/components/quiz-types/image-fill-quiz"
import { MixedQuiz } from "@/components/quiz-types/mixed-quiz"

export const dynamic = "force-dynamic"

export default async function QuizPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Fetch quiz data
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(`
      *,
      categories(*)
    `)
    .eq("id", params.id)
    .single()

  if (quizError || !quiz) {
    console.error("Error fetching quiz:", quizError)
    notFound()
  }

  // Fetch questions
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", params.id)
    .order("order_index", { ascending: true })

  if (questionsError || !questions || questions.length === 0) {
    console.error("Error fetching questions:", questionsError)
    notFound()
  }

  // Increment play count
  await supabase
    .from("quizzes")
    .update({ plays: (quiz.plays || 0) + 1 })
    .eq("id", params.id)

  // Debug information
  console.log("Quiz type:", quiz.quiz_type)
  console.log("First question type:", questions[0].question_type || questions[0].type)
  console.log("First question has media:", !!questions[0].media)

  // Check if this is a mixed quiz (has different question types)
  const hasMixedQuestionTypes = () => {
    const types = new Set()
    for (const question of questions) {
      types.add(question.question_type || question.type)
    }
    return types.size > 1
  }

  // Determine which quiz component to use
  const renderQuizComponent = () => {
    // If it's a mixed quiz, use the MixedQuiz component
    if (hasMixedQuestionTypes()) {
      return <MixedQuiz quiz={quiz} questions={questions} />
    }

    // Check for image-based fill-in-the-blank quiz
    if (
      (quiz.quiz_type === "image-based" &&
        (questions[0].question_type === "fill-blank" || questions[0].type === "fill-blank")) ||
      (questions[0].media && (questions[0].question_type === "fill-blank" || questions[0].type === "fill-blank"))
    ) {
      return <ImageFillQuiz quiz={quiz} questions={questions} />
    }

    // Check for standard question types
    switch (questions[0].question_type || questions[0].type) {
      case "multiple-choice":
        return <MultipleChoiceQuiz quiz={quiz} questions={questions} />
      case "image":
        return <ImageQuiz quiz={quiz} questions={questions} />
      case "list":
        return <ListQuiz quiz={quiz} questions={questions} />
      case "map":
        return <MapQuiz quiz={quiz} questions={questions} />
      case "fill-blank":
        return <ImageFillQuiz quiz={quiz} questions={questions} />
      default:
        // If we can't determine the type, try to infer from the structure
        if (questions[0].media) {
          return <ImageFillQuiz quiz={quiz} questions={questions} />
        }
        return <MultipleChoiceQuiz quiz={quiz} questions={questions} />
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          {quiz.emoji && <span>{quiz.emoji}</span>}
          {quiz.title}
        </h1>
        {quiz.description && <p className="text-gray-400 mb-2">{quiz.description}</p>}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {quiz.categories?.name && <span className="bg-gray-800 px-2 py-1 rounded-full">{quiz.categories.name}</span>}
          {quiz.difficulty && <span className="bg-gray-800 px-2 py-1 rounded-full capitalize">{quiz.difficulty}</span>}
          <span>•</span>
          <span>{quiz.time_limit} seconds</span>
          <span>•</span>
          <span>{questions.length} questions</span>
          <span>•</span>
          <span>{quiz.plays} plays</span>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading quiz...</div>}>{renderQuizComponent()}</Suspense>
    </div>
  )
}
