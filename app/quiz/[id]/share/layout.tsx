// app/quiz/[id]/share/layout.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

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

  // Get base URL from environment or default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://farquizapp.vercel.app'

  // Enhanced frame metadata for Mini App compatibility
  const frameMetadata = {
    version: 'next',
    imageUrl: `${baseUrl}/quiz/${params.id}/share/opengraph-image`,
    button: {
      title: `${quiz.emoji || '🧠'} Take Quiz`,
      action: {
        type: 'launch_frame',
        name: 'FarQuiz',
        url: `${baseUrl}/?quiz=${params.id}&utm_source=farcaster&utm_medium=frame`,
        splashImageUrl: 'https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_splash-h61l64V89HzQsrn3v0Ey1RJGCVtPvq.png?Ik5m',
        splashBackgroundColor: '#8B5CF6'
      }
    }
  }

  const categoryText = quiz.categories?.name || 'General'
  const difficultyText = quiz.difficulty || 'Mixed'
  const timeText = `${Math.ceil(quiz.time_limit / 60)} minutes`
  const questionsText = `${quiz.questions.length} questions`

  // Enhanced description for social sharing
  const description = `${difficultyText} ${categoryText} quiz • ${questionsText} • ~${timeText} • Can you beat the leaderboard?`

  return {
    title: `${quiz.title} - FarQuiz`,
    description: description,
    openGraph: {
      title: `${quiz.emoji || '🎮'} ${quiz.title}`,
      description: quiz.description || description,
      images: [`${baseUrl}/quiz/${params.id}/share/opengraph-image`],
      type: 'website',
      siteName: 'FarQuiz',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${quiz.emoji || '🎮'} ${quiz.title}`,
      description: quiz.description || description,
      images: [`${baseUrl}/quiz/${params.id}/share/opengraph-image`],
    },
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