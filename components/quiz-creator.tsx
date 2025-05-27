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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/simplified-auth-context"

// Define proper types for our quiz questions
interface BaseQuestion {
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

type QuizQuestion = MultipleChoiceQuestion | ImageQuestion | ListQuestion | MapQuestion

export function QuizCreator() {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const { profile, isAuthenticated } = useAuth()

  // Basic quiz info
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [emoji, setEmoji] = useState("🧠")
  const [category, setCategory] = useState("")
  const [timeLimit, setTimeLimit] = useState("60")
  const [quizType, setQuizType] = useState<"multiple-choice" | "image" | "list" | "map">("multiple-choice")

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Questions state with proper initialization for each type
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      type: "multiple-choice",
    },
  ])

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("categories").select("*")
        if (error) {
          throw error
        }
        setCategories(data || []) // Ensure we always have an array
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        })
        setCategories([]) // Ensure we always have an array even if fetch fails
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [supabase, toast])

  // Get the user ID when authenticated
  useEffect(() => {
    const getUserId = async () => {
      if (isAuthenticated && profile?.id) {
        setUserId(profile.id)
      }
    }

    getUserId()
  }, [isAuthenticated, profile])

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

  const handleQuizTypeChange = (value: "multiple-choice" | "image" | "list" | "map") => {
    setQuizType(value)

    // Reset questions based on new quiz type
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated || !userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a quiz",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

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
      }
    }

    setIsSubmitting(true)

    try {
      // Insert quiz
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          title,
          description,
          emoji,
          category_id: category ? Number.parseInt(category) : null,
          creator_id: userId,
          time_limit: Number.parseInt(timeLimit),
          is_published: true,
        })
        .select()
        .single()

      if (quizError) throw quizError

      // Insert questions
      const questionsToInsert = questions.map((q, index) => {
        if (q.type === "multiple-choice") {
          const mcq = q as MultipleChoiceQuestion
          return {
            quiz_id: quiz.id,
            text: mcq.text,
            question_type: "multiple-choice",
            options: mcq.options,
            correct_answer: mcq.correctAnswer,
            order_index: index,
          }
        } else if (q.type === "image") {
          const iq = q as ImageQuestion
          return {
            quiz_id: quiz.id,
            text: iq.text,
            question_type: "image",
            image_url: iq.imageUrl,
            correct_answer: iq.correctAnswer,
            order_index: index,
          }
        } else if (q.type === "list") {
          const lq = q as ListQuestion
          return {
            quiz_id: quiz.id,
            text: lq.text,
            question_type: "list",
            correct_answers: lq.correctAnswers,
            order_index: index,
          }
        } else if (q.type === "map") {
          const mq = q as MapQuestion
          return {
            quiz_id: quiz.id,
            text: mq.text,
            question_type: "map",
            map_url: mq.mapUrl,
            map_coordinates: mq.mapCoordinates,
            order_index: index,
          }
        }
      })

      const { error: questionsError } = await supabase.from("questions").insert(questionsToInsert)

      if (questionsError) throw questionsError

      // Update user stats
      await supabase
        .from("profiles")
        .update({
          quizzes_created: supabase.rpc("increment", { x: 1 }),
        })
        .eq("id", userId)

      toast({
        title: "Quiz created!",
        description: "Your quiz has been published successfully",
      })

      router.push(`/quiz/${quiz.id}`)
    } catch (error) {
      console.error("Error creating quiz:", error)
      toast({
        title: "Error creating quiz",
        description: "There was an error creating your quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" asChild className="p-1 mr-2">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Create a Quiz</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-800 border-slate-700 mb-4">
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

            <div className="grid grid-cols-2 gap-4">
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4">
          <Label>Quiz Type</Label>
          {/* Properly wrap TabsList within Tabs component */}
          <Tabs value={quizType} onValueChange={handleQuizTypeChange} className="w-full">
            <TabsList className="grid grid-cols-4 bg-slate-800 w-full mt-2">
              <TabsTrigger value="multiple-choice">Choice</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Quiz..." : "Create Quiz"}
        </Button>
      </form>
    </div>
  )
}
