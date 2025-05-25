"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { QuizResults } from "@/components/quiz-results"
import { AlertCircle, HelpCircle, ArrowLeft, ArrowRight, SkipForward, Check, X } from "lucide-react"
import { shuffleArray } from "@/lib/array-utils"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface ImageFillQuizProps {
  quiz: any
  questions: any[]
}

export function ImageFillQuiz({ quiz, questions: originalQuestions }: ImageFillQuizProps) {
  // Shuffle questions on component mount
  const [questions] = useState(() => shuffleArray(originalQuestions))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""))
  const [results, setResults] = useState<boolean[]>(Array(questions.length).fill(undefined))
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(Array(questions.length).fill(false))
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showFeedback, setShowFeedback] = useState<boolean | null>(null)
  const [timeTaken, setTimeTaken] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (timeLeft <= 0) {
      finishQuiz()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
      setTimeTaken((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  useEffect(() => {
    // Focus the input when the question changes
    if (inputRef.current) {
      inputRef.current.focus()
    }
    setShowHint(false)
    setShowFeedback(null)
  }, [currentQuestionIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = e.target.value
    setAnswers(newAnswers)

    // Clear feedback when typing a new answer
    if (showFeedback !== null) {
      setShowFeedback(null)
    }
  }

  const checkAnswer = (answer: string, question: any): boolean => {
    // Guard against empty answers
    if (!answer || !answer.trim()) return false

    // Guard against invalid question object
    if (!question) return false

    const userAnswer = answer.trim()

    // Guard against missing correctAnswer
    const correctAnswer = question.correctAnswer || question.correct_answer || ""
    if (!correctAnswer) return false

    const validation = question.validation || { type: "exact" }

    // Check based on validation type
    switch (validation.type) {
      case "case-insensitive":
        if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
          return true
        }
        // Check alternate answers if provided
        if (validation.alternateAnswers && Array.isArray(validation.alternateAnswers)) {
          return validation.alternateAnswers.some(
            (alt: string) => alt && userAnswer.toLowerCase() === alt.toLowerCase(),
          )
        }
        return false

      case "contains":
        if (correctAnswer.toLowerCase().includes(userAnswer.toLowerCase())) {
          return true
        }
        // Check alternate answers if provided
        if (validation.alternateAnswers && Array.isArray(validation.alternateAnswers)) {
          return validation.alternateAnswers.some(
            (alt: string) => alt && alt.toLowerCase().includes(userAnswer.toLowerCase()),
          )
        }
        return false

      case "fuzzy":
        // Simple fuzzy matching - check if the answer is at least 80% similar
        const threshold = validation.threshold || 0.8
        const similarity = calculateSimilarity(userAnswer.toLowerCase(), correctAnswer.toLowerCase())
        if (similarity >= threshold) {
          return true
        }
        // Check alternate answers if provided
        if (validation.alternateAnswers && Array.isArray(validation.alternateAnswers)) {
          return validation.alternateAnswers.some(
            (alt: string) => alt && calculateSimilarity(userAnswer.toLowerCase(), alt.toLowerCase()) >= threshold,
          )
        }
        return false

      case "exact":
      default:
        if (userAnswer === correctAnswer) {
          return true
        }
        // Check alternate answers if provided
        if (validation.alternateAnswers && Array.isArray(validation.alternateAnswers)) {
          return validation.alternateAnswers.some((alt: string) => alt && alt === userAnswer)
        }
        return false
    }
  }

  // Simple Levenshtein distance for fuzzy matching
  const calculateSimilarity = (a: string, b: string): number => {
    if (!a || !b) return 0
    if (a.length === 0) return 0
    if (b.length === 0) return 0

    const matrix = []

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          )
        }
      }
    }

    // Calculate similarity as 1 - (distance / max length)
    const distance = matrix[b.length][a.length]
    return 1 - distance / Math.max(a.length, b.length)
  }

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return

    const isCorrect = checkAnswer(answers[currentQuestionIndex], currentQuestion)
    const newResults = [...results]
    newResults[currentQuestionIndex] = isCorrect
    setResults(newResults)

    const newAnsweredQuestions = [...answeredQuestions]
    newAnsweredQuestions[currentQuestionIndex] = true
    setAnsweredQuestions(newAnsweredQuestions)

    // Show feedback
    setShowFeedback(isCorrect)

    // Only automatically move to next question if the answer is correct
    if (isCorrect) {
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
          finishQuiz()
        }
      }, 1500)
    }
    // If answer is wrong, let the user try again or manually skip
  }

  const handleSkip = () => {
    // Record the current answer as incorrect if not already answered
    if (!answeredQuestions[currentQuestionIndex]) {
      const newResults = [...results]
      newResults[currentQuestionIndex] = false
      setResults(newResults)

      const newAnsweredQuestions = [...answeredQuestions]
      newAnsweredQuestions[currentQuestionIndex] = true
      setAnsweredQuestions(newAnsweredQuestions)
    }

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      finishQuiz()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      finishQuiz()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitAnswer()
    }
  }

  const finishQuiz = async () => {
    setIsSubmitting(true)

    // Calculate final results for any unanswered questions
    const finalResults = [...results]
    for (let i = 0; i < questions.length; i++) {
      if (finalResults[i] === undefined) {
        finalResults[i] = checkAnswer(answers[i] || "", questions[i])
      }
    }

    // Calculate score
    const score = finalResults.filter(Boolean).length
    const totalQuestions = questions.length
    const percentage = Math.round((score / totalQuestions) * 100)
    const finalTimeTaken = timeTaken

    try {
      // Save score to database
      await supabase.from("user_scores").insert({
        quiz_id: quiz.id,
        user_id: "anonymous", // Using a placeholder user ID since we're not using authentication
        score: score,
        max_score: totalQuestions,
        percentage: percentage,
        time_taken: finalTimeTaken,
        completed_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error saving score:", error)
    }

    setResults(finalResults)
    setShowResults(true)
    setIsSubmitting(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  if (showResults) {
    return (
      <QuizResults
        score={results.filter(Boolean).length}
        totalQuestions={questions.length}
        timeTaken={timeTaken}
        quizId={quiz.id}
        quizTitle={quiz.title}
        quiz={quiz}
        questions={questions}
        answers={answers}
        results={results}
      />
    )
  }

  // Guard against missing currentQuestion
  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold mb-4">Error loading question</h2>
        <p className="mb-4">There was a problem loading this question.</p>
        <Button onClick={finishQuiz}>Finish Quiz</Button>
      </div>
    )
  }

  // Get the image URL from either media.url or image_url
  const getImageUrl = () => {
    if (currentQuestion.media && currentQuestion.media.url) {
      return currentQuestion.media.url
    }
    if (currentQuestion.image_url) {
      return currentQuestion.image_url
    }
    return "/placeholder.svg"
  }

  // Get the image alt text
  const getImageAlt = () => {
    if (currentQuestion.media && currentQuestion.media.alt) {
      return currentQuestion.media.alt
    }
    return "Question image"
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="text-sm font-medium">{formatTime(timeLeft)}</div>
      </div>

      <Progress value={(currentQuestionIndex / questions.length) * 100} className="mb-6" />

      <Card
        className={`bg-slate-800 border-slate-700 mb-6 relative overflow-hidden ${
          showFeedback !== null ? (showFeedback ? "ring-2 ring-green-500" : "ring-2 ring-red-500") : ""
        }`}
      >
        {showFeedback !== null && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-opacity-30 ${
              showFeedback ? "bg-green-900" : "bg-red-900"
            }`}
          >
            <div className={`rounded-full p-3 ${showFeedback ? "bg-green-500" : "bg-red-500"}`}>
              {showFeedback ? <Check className="h-8 w-8 text-white" /> : <X className="h-8 w-8 text-white" />}
            </div>
          </div>
        )}

        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">{currentQuestion.text}</h2>

          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-md h-48 md:h-64 overflow-hidden rounded-md">
              <Image
                src={getImageUrl() || "/placeholder.svg"}
                alt={getImageAlt()}
                fill
                style={{ objectFit: "contain" }}
                className="bg-slate-900"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type your answer here..."
                value={answers[currentQuestionIndex] || ""}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="bg-slate-700 border-slate-600"
                disabled={showFeedback === true} // Only disable if answer is correct
              />
            </div>

            {/* Show message when user gets it wrong, but don't reveal the answer */}
            {showFeedback === false && (
              <div className="mt-2 text-sm bg-red-900 bg-opacity-20 p-2 rounded-md">
                <p>Incorrect. Try again or skip to the next question.</p>
                <p className="text-xs mt-1 text-gray-400">All correct answers will be shown at the end of the quiz.</p>
              </div>
            )}

            {currentQuestion.hint && (
              <div>
                <Button variant="outline" size="sm" onClick={toggleHint} className="flex items-center gap-1 text-xs">
                  <HelpCircle className="h-3 w-3" />
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                {showHint && (
                  <div className="mt-2 text-sm bg-slate-700 p-2 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <p>{currentQuestion.hint}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0 || showFeedback === true}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <Button variant="outline" onClick={handleSkip} disabled={showFeedback === true}>
            <SkipForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmitAnswer} disabled={!answers[currentQuestionIndex] || showFeedback === true}>
            Submit
          </Button>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentQuestionIndex === questions.length - 1 || showFeedback === true}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
