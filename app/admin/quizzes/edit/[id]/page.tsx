"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

// Define proper types for our quiz questions
interface BaseQuestion {
  id?: string
  text: string
  type: string
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice"
  options: string[]
  correctAnswer: string
}

interface ImageQuestion extends BaseQuestion {
  type: "image"
  imageUrl: string
  correctAnswer: string
}

interface ListQuestion extends BaseQuestion {
  type: "list"
  correctAnswers: string[]
}

interface MapQuestion extends BaseQuestion {
  type: "map"
  mapUrl: string
  mapCoordinates: { x: number; y: number }
}

interface FillBlankQuestion extends BaseQuestion {
  type: "fill-blank"
  correctAnswer: string
  validation?: {
    type: string
    alternateAnswers?: string[]
  }
  media?: {
    type: string
    url: string
    alt?: string
  }
  hint?: string
}

type QuizQuestion = MultipleChoiceQuestion | ImageQuestion | ListQuestion | MapQuestion | FillBlankQuestion

export default function AdminEditQuizPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const quizId = params.id

  // Basic quiz info
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [emoji, setEmoji] = useState("🧠")
  const [category, setCategory] = useState("")
  const [timeLimit, setTimeLimit] = useState("60")
  const [quizType, setQuizType] = useState<"multiple-choice" | "image" | "list" | "map" | "fill-blank">(
    "multiple-choice",
  )
  const [difficulty, setDifficulty] = useState("medium")

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])

  // Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // Fetch quiz data and categories on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch quiz data
        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories(name, emoji)
          `)
          .eq("id", quizId)
          .single()

        if (quizError) {
          throw quizError
        }

        // Set quiz data
        setTitle(quiz.title)
        setDescription(quiz.description || "")
        setEmoji(quiz.emoji || "🧠")
        setCategory(quiz.category_id ? String(quiz.category_id) : "")
        setTimeLimit(String(quiz.time_limit))
        setQuizType((quiz.quiz_type as any) || "multiple-choice")
        setDifficulty(quiz.difficulty || "medium")

        // Fetch questions
        const { data: fetchedQuestions, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index")

        if (questionsError) {
          throw questionsError
        }

        // Transform questions to our format
        const transformedQuestions: QuizQuestion[] = fetchedQuestions.map((q: any) => {
          if (q.question_type === "multiple-choice") {
            return {
              id: q.id,
              text: q.text,
              type: "multiple-choice",
              options: q.options || ["", "", "", ""],
              correctAnswer: q.correct_answer || "",
            }
          } else if (q.question_type === "image") {
            return {
              id: q.id,
              text: q.text,
              type: "image",
              imageUrl: q.image_url || "",
              correctAnswer: q.correct_answer || "",
            }
          } else if (q.question_type === "list") {
            return {
              id: q.id,
              text: q.text,
              type: "list",
              correctAnswers: q.correct_answers || ["", ""],
            }
          } else if (q.question_type === "map") {
            return {
              id: q.id,
              text: q.text,
              type: "map",
              mapUrl: q.map_url || "",
              mapCoordinates: q.map_coordinates || { x: 50, y: 50 },
            }
          } else if (q.question_type === "fill-blank") {
            return {
              id: q.id,
              text: q.text,
              type: "fill-blank",
              correctAnswer: q.correct_answer || "",
              validation: q.validation || { type: "case-insensitive" },
              media: q.media || null,
              hint: q.hint || "",
            }
          }

          // Default to multiple choice if type is unknown
          return {
            id: q.id,
            text: q.text,
            type: "multiple-choice",
            options: q.options || ["", "", "", ""],
            correctAnswer: q.correct_answer || "",
          }
        })

        setQuestions(transformedQuestions)

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase.from("categories").select("*")

        if (categoriesError) {
          throw categoriesError
        }

        setCategories(categoriesData || [])
      } catch (error) {
        console.error("Error fetching quiz:", error)
        toast({
          title: "Error",
          description: "Failed to load quiz data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [quizId, supabase, toast])

  const handleAddQuestion = () => {
    if (quizType === "multiple-choice") {
      setQuestions([
        ...questions,
        {
          text: "",
          options: ["", "", "", ""],
          correctAnswer: "",
          type: "multiple-choice",
        },
      ])
    } else if (quizType === "image") {
      setQuestions([
        ...questions,
        {
          text: "",
          imageUrl: "",
          correctAnswer: "",
          type: "image",
        },
      ])
    } else if (quizType === "list") {
      setQuestions([
        ...questions,
        {
          text: "",
          correctAnswers: ["", ""],
          type: "list",
        },
      ])
    } else if (quizType === "map") {
      setQuestions([
        ...questions,
        {
          text: "",
          mapUrl: "",
          mapCoordinates: { x: 50, y: 50 },
          type: "map",
        },
      ])
    } else if (quizType === "fill-blank") {
      setQuestions([
        ...questions,
        {
          text: "",
          correctAnswer: "",
          type: "fill-blank",
          validation: { type: "case-insensitive" },
        },
      ])
    }
  }

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions]
    newQuestions.splice(index, 1)
    setQuestions(newQuestions)
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions] as any[]
    newQuestions[index][field] = value
    setQuestions(newQuestions)
  }

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions] as MultipleChoiceQuestion[]
    // Make sure options is defined and is an array
    if (!newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options = ["", "", "", ""]
    }
    newQuestions[questionIndex].options[optionIndex] = value
    setQuestions(newQuestions)
  }

  const handleCorrectAnswerChange = (questionIndex: number, value: string) => {
    const newQuestions = [...questions] as any[]
    newQuestions[questionIndex].correctAnswer = value
    setQuestions(newQuestions)
  }

  const handleListAnswerChange = (questionIndex: number, answerIndex: number, value: string) => {
    const newQuestions = [...questions] as ListQuestion[]
    // Make sure correctAnswers is defined and is an array
    if (!newQuestions[questionIndex].correctAnswers) {
      newQuestions[questionIndex].correctAnswers = ["", ""]
    }
    newQuestions[questionIndex].correctAnswers[answerIndex] = value
    setQuestions(newQuestions)
  }

  const handleAddListAnswer = (questionIndex: number) => {
    const newQuestions = [...questions] as ListQuestion[]
    // Make sure correctAnswers is defined and is an array
    if (!newQuestions[questionIndex].correctAnswers) {
      newQuestions[questionIndex].correctAnswers = []
    }
    newQuestions[questionIndex].correctAnswers.push("")
    setQuestions(newQuestions)
  }

  const handleRemoveListAnswer = (questionIndex: number, answerIndex: number) => {
    const newQuestions = [...questions] as ListQuestion[]
    // Make sure correctAnswers is defined and is an array
    if (!newQuestions[questionIndex].correctAnswers) {
      return
    }
    newQuestions[questionIndex].correctAnswers.splice(answerIndex, 1)
    setQuestions(newQuestions)
  }

  const handleQuizTypeChange = (value: "multiple-choice" | "image" | "list" | "map" | "fill-blank") => {
    setQuizType(value)

    if (questions.length === 0) {
      // If no questions yet, add a default one for the selected type
      if (value === "multiple-choice") {
        setQuestions([
          {
            text: "",
            options: ["", "", "", ""],
            correctAnswer: "",
            type: "multiple-choice",
          },
        ])
      } else if (value === "image") {
        setQuestions([
          {
            text: "",
            imageUrl: "",
            correctAnswer: "",
            type: "image",
          },
        ])
      } else if (value === "list") {
        setQuestions([
          {
            text: "",
            correctAnswers: ["", ""],
            type: "list",
          },
        ])
      } else if (value === "map") {
        setQuestions([
          {
            text: "",
            mapUrl: "",
            mapCoordinates: { x: 50, y: 50 },
            type: "map",
          },
        ])
      } else if (value === "fill-blank") {
        setQuestions([
          {
            text: "",
            correctAnswer: "",
            type: "fill-blank",
            validation: { type: "case-insensitive" },
          },
        ])
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your quiz",
        variant: "destructive",
      })
      return
    }

    if (questions.length === 0) {
      toast({
        title: "Questions required",
        description: "Please add at least one question to your quiz",
        variant: "destructive",
      })
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        toast({
          title: `Question ${i + 1} is incomplete`,
          description: "Please enter text for all questions",
          variant: "destructive",
        })
        return
      }

      if (q.type === "multiple-choice") {
        const mcq = q as MultipleChoiceQuestion
        if (mcq.options.some((opt: string) => !opt.trim())) {
          toast({
            title: `Question ${i + 1} is incomplete`,
            description: "Please fill in all options",
            variant: "destructive",
          })
          return
        }

        if (!mcq.correctAnswer) {
          toast({
            title: `Question ${i + 1} is incomplete`,
            description: "Please select a correct answer",
            variant: "destructive",
          })
          return
        }
      } else if (q.type === "image") {
        const iq = q as ImageQuestion
        if (!iq.imageUrl) {
          toast({
            title: `Question ${i + 1} is incomplete`,
            description: "Please provide an image URL",
            variant: "destructive",
          })
          return
        }

        if (!iq.correctAnswer.trim()) {
          toast({
            title: `Question ${i + 1} is incomplete`,
            description: "Please provide a correct answer",
            variant: "destructive",
          })
          return
        }
      } else if (q.type === "list") {
        const lq = q as ListQuestion
        if (lq.correctAnswers && lq.correctAnswers.some((ans: string) => !ans.trim())) {
          toast({
            title: `Question ${i + 1} is incomplete`,
            description: "Please fill in all answers in the list",
            variant: "destructive",
          })
          return
        }
      } else if (q.type === "map") {
        const mq = q as MapQuestion
        if (!mq.mapUrl) {
          toast({
            title: `Question ${i + 1} is incomplete`,
            description: "Please provide a map URL",
            variant: "destructive",
          })
          return
        }
      } else if (q.type === "fill-blank") {
        const fbq = q as FillBlankQuestion
        if (!fbq.correctAnswer.trim()) {
          toast({
            title: `Question ${i + 1} is incomplete`,
            description: "Please provide a correct answer",
            variant: "destructive",
          })
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      // Update quiz
      const { error: quizError } = await supabase
        .from("quizzes")
        .update({
          title,
          description,
          emoji,
          category_id: category ? Number.parseInt(category) : null,
          time_limit: Number.parseInt(timeLimit),
          difficulty,
          quiz_type: quizType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quizId)

      if (quizError) throw quizError

      // Get IDs of existing questions to determine which to delete
      const { data: existingQuestions, error: fetchError } = await supabase
        .from("questions")
        .select("id")
        .eq("quiz_id", quizId)

      if (fetchError) throw fetchError

      const existingIds = existingQuestions.map((q: any) => q.id)
      const updatedIds = questions.map((q) => q.id).filter(Boolean)

      // Find IDs to delete (in existing but not in updated)
      const idsToDelete = existingIds.filter((id: string) => !updatedIds.includes(id))

      // Delete questions that were removed
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from("questions").delete().in("id", idsToDelete)

        if (deleteError) throw deleteError
      }

      // Update or insert questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        let questionData: any = {}

        // Common fields
        questionData = {
          quiz_id: quizId,
          text: q.text,
          question_type: q.type,
          order_index: i,
        }

        // Type-specific fields
        if (q.type === "multiple-choice") {
          const mcq = q as MultipleChoiceQuestion
          questionData.options = mcq.options
          questionData.correct_answer = mcq.correctAnswer
        } else if (q.type === "image") {
          const iq = q as ImageQuestion
          questionData.image_url = iq.imageUrl
          questionData.correct_answer = iq.correctAnswer
        } else if (q.type === "list") {
          const lq = q as ListQuestion
          questionData.correct_answers = lq.correctAnswers
        } else if (q.type === "map") {
          const mq = q as MapQuestion
          questionData.map_url = mq.mapUrl
          questionData.map_coordinates = mq.mapCoordinates
        } else if (q.type === "fill-blank") {
          const fbq = q as FillBlankQuestion
          questionData.correct_answer = fbq.correctAnswer
          questionData.validation = fbq.validation || { type: "case-insensitive" }
          if (fbq.media) questionData.media = fbq.media
          if (fbq.hint) questionData.hint = fbq.hint
        }

        if (q.id) {
          // Update existing question
          const { error: updateError } = await supabase.from("questions").update(questionData).eq("id", q.id)

          if (updateError) throw updateError
        } else {
          // Insert new question
          const { error: insertError } = await supabase.from("questions").insert(questionData)

          if (insertError) throw insertError
        }
      }

      toast({
        title: "Quiz updated!",
        description: "Your quiz has been updated successfully",
      })

      router.push("/admin/quizzes")
    } catch (error) {
      console.error("Error updating quiz:", error)
      toast({
        title: "Error updating quiz",
        description: "There was an error updating your quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-10 mr-2" />
          <Skeleton className="h-8 w-48" />
        </div>

        <Skeleton className="h-64 w-full" />

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin/quizzes">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Quiz: {title}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                placeholder="Enter a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this quiz about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji</Label>
                <Input
                  id="emoji"
                  placeholder="🧠"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Safely map over categories, which is now guaranteed to be an array */}
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.emoji} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                <Select value={timeLimit} onValueChange={setTimeLimit}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="90">90 seconds</SelectItem>
                    <SelectItem value="120">120 seconds</SelectItem>
                    <SelectItem value="180">180 seconds</SelectItem>
                    <SelectItem value="240">240 seconds</SelectItem>
                    <SelectItem value="300">300 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quizType">Quiz Type</Label>
                <Select value={quizType} onValueChange={handleQuizTypeChange}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="map">Map</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        {questions.map((question, qIndex) => (
          <Card key={qIndex} className="bg-slate-800 border-slate-700 mb-4">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Question {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`question-${qIndex}`}>Question</Label>
                <Input
                  id={`question-${qIndex}`}
                  placeholder="Enter your question"
                  value={question.text}
                  onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              {question.type === "multiple-choice" && (
                <div className="space-y-3">
                  <Label>Answer Options</Label>
                  {(question as MultipleChoiceQuestion).options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, optionIndex, e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                      <Button
                        type="button"
                        variant={(question as MultipleChoiceQuestion).correctAnswer === option ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCorrectAnswerChange(qIndex, option)}
                        className="shrink-0"
                      >
                        Correct
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "fill-blank" && (
                <div className="space-y-3">
                  <div>
                    <Label>Correct Answer</Label>
                    <Input
                      placeholder="The correct answer"
                      value={(question as FillBlankQuestion).correctAnswer || ""}
                      onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label>Media URL (Optional)</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={(question as FillBlankQuestion).media?.url || ""}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "media", {
                          ...((question as FillBlankQuestion).media || {}),
                          url: e.target.value,
                          type: "image",
                        })
                      }
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label>Hint (Optional)</Label>
                    <Input
                      placeholder="Hint for the question"
                      value={(question as FillBlankQuestion).hint || ""}
                      onChange={(e) => handleQuestionChange(qIndex, "hint", e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
              )}

              {question.type === "image" && (
                <div className="space-y-3">
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={(question as ImageQuestion).imageUrl || ""}
                      onChange={(e) => handleQuestionChange(qIndex, "imageUrl", e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Correct Answer</Label>
                    <Input
                      placeholder="The correct answer"
                      value={(question as ImageQuestion).correctAnswer || ""}
                      onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
              )}

              {question.type === "list" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Correct Answers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddListAnswer(qIndex)}
                      className="text-xs"
                    >
                      Add Answer
                    </Button>
                  </div>

                  {((question as ListQuestion).correctAnswers || []).map((answer, answerIndex) => (
                    <div key={answerIndex} className="flex items-center gap-2">
                      <Input
                        placeholder={`Answer ${answerIndex + 1}`}
                        value={answer}
                        onChange={(e) => handleListAnswerChange(qIndex, answerIndex, e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                      {(question as ListQuestion).correctAnswers?.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveListAnswer(qIndex, answerIndex)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.type === "map" && (
                <div className="space-y-3">
                  <div>
                    <Label>Map URL</Label>
                    <Input
                      placeholder="https://example.com/map.jpg"
                      value={(question as MapQuestion).mapUrl || ""}
                      onChange={(e) => handleQuestionChange(qIndex, "mapUrl", e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>X Coordinate</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={(question as MapQuestion).mapCoordinates?.x || 50}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, "mapCoordinates", {
                            ...((question as MapQuestion).mapCoordinates || { x: 50, y: 50 }),
                            x: Number.parseInt(e.target.value),
                          })
                        }
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label>Y Coordinate</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={(question as MapQuestion).mapCoordinates?.y || 50}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, "mapCoordinates", {
                            ...((question as MapQuestion).mapCoordinates || { x: 50, y: 50 }),
                            y: Number.parseInt(e.target.value),
                          })
                        }
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center mb-6">
          <Button type="button" variant="outline" onClick={handleAddQuestion} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/quizzes">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Updating Quiz...
              </>
            ) : (
              "Update Quiz"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
