import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 630,
}

export default async function Image({ params }: { params: { id: string } }) {
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
    // Return a default error image
    return new ImageResponse(
      (
        <div
          style={{
            height: '630px',
            width: '1200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e1e1e',
            color: 'white',
          }}
        >
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>Quiz Not Found</div>
          <div style={{ fontSize: '32px', color: '#9CA3AF' }}>This quiz could not be found.</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  const categoryText = quiz.categories?.name || 'General'
  const difficultyText = quiz.difficulty || 'Mixed'
  const timeText = `${quiz.time_limit} minutes`
  const questionsText = `${quiz.questions.length} Questions`

  return new ImageResponse(
    (
      <div
        style={{
          height: '630px',
          width: '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          color: 'white',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '60px' }}>{quiz.title}</div>
            {quiz.emoji && <div style={{ fontSize: '60px' }}>{quiz.emoji}</div>}
          </div>
          <div style={{ fontSize: '40px', marginBottom: '40px', color: '#8B5CF6' }}>
            {categoryText} {quiz.categories?.emoji} • {difficultyText}
          </div>
          <div style={{ fontSize: '32px', color: '#9CA3AF' }}>
            {questionsText} • {timeText}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
} 