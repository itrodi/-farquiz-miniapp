import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

// This is a dynamic metadata generator for the quiz share pages
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient()

  // Get the quiz with category and questions
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(`
      *,
      categories(name, emoji),
      questions(*)
    `)
    .eq("id", params.id)
    .single()

  if (quizError || !quiz) {
    return {
      title: 'Quiz Not Found - FarQuiz',
      description: 'This quiz could not be found.'
    }
  }

  const frameMetadata = {
    version: 'next',
    imageUrl: `https://farquizapp.vercel.app/quiz/${params.id}/share/opengraph-image`,
    button: {
      title: 'Take Quiz',
      action: {
        type: 'launch_frame',
        name: 'FarQuiz',
        url: `https://farquizapp.vercel.app/quiz/${params.id}`,
        splashImageUrl: 'https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_splash-h61l64V89HzQsrn3v0Ey1RJGCVtPvq.png?Ik5m',
        splashBackgroundColor: '#8B5CF6'
      }
    }
  }

  const categoryText = quiz.categories?.name || 'General'
  const difficultyText = quiz.difficulty || 'Mixed'
  const timeText = `${quiz.time_limit} minutes`
  const questionsText = `${quiz.questions.length} questions`

  return {
    title: `${quiz.title} - FarQuiz`,
    description: `Test your knowledge with this ${difficultyText} ${categoryText} quiz. ${questionsText}, takes about ${timeText}.`,
    other: {
      'fc:frame': JSON.stringify(frameMetadata)
    }
  }
}

export default function QuizShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 