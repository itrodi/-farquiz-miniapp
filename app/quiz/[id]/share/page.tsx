'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Share2, ExternalLink, Play } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { Tables } from '@/lib/supabase/database.types'

interface QuizWithDetails extends Tables<"quizzes"> {
  categories: Tables<"categories"> | null
  questions: Tables<"questions">[]
}

export default function QuizSharePage() {
  const params = useParams()
  const [quiz, setQuiz] = useState<QuizWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [sharing, setSharing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        // Check if we're in a Mini App
        const isInMiniApp = await sdk.isInMiniApp()
        setIsMiniApp(isInMiniApp)
        
        // Get the quiz with category and questions
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories(name, emoji),
            questions(*)
          `)
          .eq("id", params.id)
          .single()

        if (quizError) throw quizError
        setQuiz(quizData)
      } catch (error) {
        console.error('Error fetching quiz:', error)
        toast({
          title: 'Error',
          description: 'Failed to load quiz details',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
        if (isMiniApp) {
          sdk.actions.ready()
        }
      }
    }

    if (params.id) {
      initializeAndFetch()
    }
  }, [params.id])

  const shareToFarcaster = async () => {
    if (!quiz) return
    
    try {
      setSharing(true)
      
      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}/quiz/${params.id}/share`
      const text = `Check out this ${quiz.categories?.name || 'quiz'}: "${quiz.title}" ${quiz.emoji || '🎮'}\n\nThink you can ace it?`
      
      if (isMiniApp) {
        // Use Mini App compose action
        await sdk.actions.composeCast({
          text: text,
          embeds: [shareUrl]
        })
        
        toast({
          title: 'Success!',
          description: 'Cast composer opened with your quiz share'
        })
      } else {
        // Fallback for web - open Warpcast compose
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(shareUrl)}`
        window.open(warpcastUrl, '_blank')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: 'Share failed',
        description: 'Could not open cast composer',
        variant: 'destructive'
      })
    } finally {
      setSharing(false)
    }
  }

  const copyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/quiz/${params.id}/share`
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link copied!',
        description: 'Quiz share link copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy link to clipboard',
        variant: 'destructive'
      })
    }
  }

  const takeQuiz = async () => {
    if (isMiniApp) {
      // In Mini App, navigate directly
      window.location.href = `/quiz/${params.id}`
    } else {
      // On web, open in new tab
      window.open(`${window.location.origin}/quiz/${params.id}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Quiz not found</h1>
        <p className="text-gray-400 mb-6">The quiz you're looking for doesn't exist or has been removed.</p>
        {isMiniApp ? (
          <Button onClick={() => window.location.href = '/'}>
            Browse Quizzes
          </Button>
        ) : (
          <Button asChild>
            <a href="/">Browse Quizzes</a>
          </Button>
        )}
      </div>
    )
  }

  const estimatedTime = `${Math.ceil(quiz.time_limit / 60)} minutes`
  const categoryText = quiz.categories?.name || 'General'

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center max-w-2xl mx-auto">
      {/* Quiz Title */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">{quiz.emoji || '🎮'}</span>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
      </div>
      
      {/* Quiz Description */}
      {quiz.description && (
        <p className="text-lg text-gray-300 mb-6 max-w-md">
          {quiz.description}
        </p>
      )}
      
      {/* Quiz Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-md">
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <div className="text-sm text-gray-400">Category</div>
          <div className="font-semibold">
            {quiz.categories?.emoji} {categoryText}
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <div className="text-sm text-gray-400">Difficulty</div>
          <div className="font-semibold capitalize">
            {quiz.difficulty || 'Mixed'}
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <div className="text-sm text-gray-400">Questions</div>
          <div className="font-semibold">{quiz.questions.length}</div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <div className="text-sm text-gray-400">Time</div>
          <div className="font-semibold">{estimatedTime}</div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button 
          onClick={takeQuiz}
          size="lg" 
          className="flex-1"
        >
          <Play className="mr-2 h-5 w-5" />
          Take Quiz
        </Button>
        
        <Button 
          onClick={shareToFarcaster}
          variant="outline" 
          size="lg"
          disabled={sharing}
          className="flex-1"
        >
          <Share2 className="mr-2 h-5 w-5" />
          {sharing ? 'Sharing...' : 'Share on Farcaster'}
        </Button>
      </div>
      
      {/* Additional Actions */}
      <div className="mt-4">
        <Button 
          onClick={copyLink}
          variant="ghost" 
          size="sm"
          className="text-gray-400 hover:text-gray-300"
        >
          Copy Link
        </Button>
        
        {!isMiniApp && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-400 hover:text-gray-300 ml-4"
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            Open FarQuiz
          </Button>
        )}
      </div>
      
      {/* Context Indicator */}
      {isMiniApp && (
        <div className="mt-6 text-xs text-gray-500">
          Running in Farcaster Mini App
        </div>
      )}
    </div>
  )
}