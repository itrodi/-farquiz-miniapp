"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, FileUp, Loader2, Download, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { validateQuiz, parseCSV, groupCSVByQuiz, convertToDatabaseFormat, generateQuizTemplate } from "@/lib/quiz-utils"
import type { QuizType } from "@/lib/supabase/database.types"

export default function AdminImportQuizzesPage() {
  const [jsonData, setJsonData] = useState("")
  const [csvData, setCsvData] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("json")
  const [templateType, setTemplateType] = useState<QuizType>("standard")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleGenerateTemplate = () => {
    const template = generateQuizTemplate(templateType)
    setJsonData(JSON.stringify(template, null, 2))
    setValidationErrors([])
  }

  const handlePreview = () => {
    try {
      let data
      if (activeTab === "json") {
        if (!jsonData.trim()) {
          toast({
            title: "No data",
            description: "Please enter JSON data to preview",
            variant: "destructive",
          })
          return
        }

        try {
          data = JSON.parse(jsonData)
          if (!Array.isArray(data)) {
            data = [data] // Convert single quiz to array
          }
        } catch (error) {
          throw new Error("Invalid JSON format")
        }
      } else {
        if (!csvData.trim()) {
          toast({
            title: "No data",
            description: "Please enter CSV data to preview",
            variant: "destructive",
          })
          return
        }

        const parsedCsv = parseCSV(csvData)
        const groupedQuizzes = groupCSVByQuiz(parsedCsv)
        data = Object.values(groupedQuizzes)
      }

      // Validate quizzes
      let allErrors: string[] = []
      data.forEach((quiz: any, index: number) => {
        const { valid, errors } = validateQuiz(quiz)
        if (!valid) {
          allErrors = [...allErrors, ...errors.map((err) => `Quiz ${index + 1}: ${err}`)]
        }
      })

      if (allErrors.length > 0) {
        setValidationErrors(allErrors)
        setPreviewData(null)
        setPreviewMode(false)
      } else {
        setValidationErrors([])
        setPreviewData(data)
        setPreviewMode(true)
      }
    } catch (error) {
      console.error("Error during preview:", error)
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      setPreviewData(null)
      setPreviewMode(false)
    }
  }

  const handleJsonImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "No data",
        description: "Please enter JSON data to import",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Parse JSON data
      let quizzes
      try {
        quizzes = JSON.parse(jsonData)
        if (!Array.isArray(quizzes)) {
          quizzes = [quizzes] // Convert single quiz to array
        }
      } catch (error) {
        throw new Error("Invalid JSON format")
      }

      // Validate quizzes
      let allErrors: string[] = []
      quizzes.forEach((quiz: any, index: number) => {
        const { valid, errors } = validateQuiz(quiz)
        if (!valid) {
          allErrors = [...allErrors, ...errors.map((err) => `Quiz ${index + 1}: ${err}`)]
        }
      })

      if (allErrors.length > 0) {
        setValidationErrors(allErrors)
        throw new Error("Validation failed")
      }

      // Process each quiz
      let successCount = 0
      let errorCount = 0

      for (const quiz of quizzes) {
        try {
          const { quiz: dbQuiz, questions: dbQuestions } = convertToDatabaseFormat(quiz)

          // Insert quiz
          const { data: newQuiz, error: quizError } = await supabase.from("quizzes").insert(dbQuiz).select().single()

          if (quizError) throw quizError

          // Insert questions
          const questionsToInsert = dbQuestions.map((q) => ({
            ...q,
            quiz_id: newQuiz.id,
          }))

          const { error: questionsError } = await supabase.from("questions").insert(questionsToInsert)

          if (questionsError) throw questionsError

          successCount++
        } catch (error) {
          console.error(`Error importing quiz: ${error}`)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${successCount} quizzes${
            errorCount > 0 ? ` (${errorCount} failed)` : ""
          }`,
        })
        router.push("/admin/quizzes")
      } else {
        toast({
          title: "Import failed",
          description: "No quizzes were imported. Please check your data format.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during import:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCsvImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "No data",
        description: "Please enter CSV data to import",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Parse CSV data
      const parsedCsv = parseCSV(csvData)
      const groupedQuizzes = groupCSVByQuiz(parsedCsv)

      // Validate quizzes
      let allErrors: string[] = []
      Object.values(groupedQuizzes).forEach((quiz: any, index: number) => {
        const { valid, errors } = validateQuiz(quiz)
        if (!valid) {
          allErrors = [...allErrors, ...errors.map((err) => `Quiz ${index + 1}: ${err}`)]
        }
      })

      if (allErrors.length > 0) {
        setValidationErrors(allErrors)
        throw new Error("Validation failed")
      }

      // Import each quiz
      let successCount = 0
      let errorCount = 0

      for (const title in groupedQuizzes) {
        try {
          const quiz = groupedQuizzes[title]
          const { quiz: dbQuiz, questions: dbQuestions } = convertToDatabaseFormat(quiz)

          // Insert quiz
          const { data: newQuiz, error: quizError } = await supabase.from("quizzes").insert(dbQuiz).select().single()

          if (quizError) throw quizError

          // Insert questions
          const questionsToInsert = dbQuestions.map((q) => ({
            ...q,
            quiz_id: newQuiz.id,
          }))

          const { error: questionsError } = await supabase.from("questions").insert(questionsToInsert)

          if (questionsError) throw questionsError

          successCount++
        } catch (error) {
          console.error(`Error importing quiz: ${error}`)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${successCount} quizzes${
            errorCount > 0 ? ` (${errorCount} failed)` : ""
          }`,
        })
        router.push("/admin/quizzes")
      } else {
        toast({
          title: "Import failed",
          description: "No quizzes were imported. Please check your data format.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during import:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImport = () => {
    setValidationErrors([])
    setPreviewMode(false)

    if (activeTab === "json") {
      handleJsonImport()
    } else {
      handleCsvImport()
    }
  }

  const downloadTemplate = () => {
    const template = generateQuizTemplate(templateType)
    const jsonString = JSON.stringify(template, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${templateType}-quiz-template.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
        <h1 className="text-2xl font-bold">Import Quizzes</h1>
      </div>

      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardContent className="p-6">
          <div className="mb-6">
            <Label className="mb-2 block">Quiz Template</Label>
            <div className="flex gap-2">
              <Select value={templateType} onValueChange={(value) => setTemplateType(value as QuizType)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 w-full">
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Quiz</SelectItem>
                  <SelectItem value="geography">Geography Quiz</SelectItem>
                  <SelectItem value="image-based">Image-Based Quiz</SelectItem>
                  <SelectItem value="timeline">Timeline Quiz</SelectItem>
                  <SelectItem value="categorization">Categorization Quiz</SelectItem>
                  <SelectItem value="word-logic">Word & Logic Quiz</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateTemplate} variant="outline" className="whitespace-nowrap">
                Generate Template
              </Button>
              <Button onClick={downloadTemplate} variant="outline" className="whitespace-nowrap">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="csv">CSV</TabsTrigger>
            </TabsList>

            <TabsContent value="json">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jsonData">JSON Data</Label>
                  <Textarea
                    id="jsonData"
                    placeholder='{"title":"Quiz Title","description":"Quiz Description","emoji":"🧠","time_limit":60,"questions":[{"text":"Question text","type":"multiple-choice","options":[{"id":"a","text":"Option 1"},{"id":"b","text":"Option 2"}],"correctAnswer":"b"}]}'
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    className="bg-slate-700 border-slate-600 min-h-[300px] font-mono text-sm"
                  />
                </div>

                <div className="text-sm text-slate-400">
                  <p className="font-medium mb-2">Enhanced JSON Format:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Provide an array of quiz objects or a single quiz object</li>
                    <li>Each quiz must have a title, time_limit, and an array of questions</li>
                    <li>Each question must have text, type, and the correct answer(s)</li>
                    <li>
                      Question types: multiple-choice, fill-blank, image-choice, map-click, matching, ordering,
                      timeline, audio, categorize, list
                    </li>
                    <li>Use the template generator to see examples of different quiz types</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="csv">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvData">CSV Data</Label>
                  <Textarea
                    id="csvData"
                    placeholder="title,description,emoji,time_limit,question,question_type,options,correct_answer
Quiz Title,Quiz Description,🧠,60,What is 2+2?,multiple-choice,1|2|3|4,4"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    className="bg-slate-700 border-slate-600 min-h-[300px] font-mono text-sm"
                  />
                </div>

                <div className="text-sm text-slate-400">
                  <p className="font-medium mb-2">Enhanced CSV Format:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>First row must contain headers</li>
                    <li>Required headers: title, question, question_type, correct_answer or correct_answers</li>
                    <li>
                      Optional headers: description, emoji, time_limit, options, media_type, media_url, media_alt,
                      points, hint, explanation, tags, validation_type, validation_threshold, alternate_answers,
                      shuffle_options, question_time_limit, quiz_type, difficulty, scoring_type, flow_type
                    </li>
                    <li>For multiple options or answers, use | as a separator</li>
                    <li>Questions with the same title will be grouped into one quiz</li>
                    <li>For complex data like matching pairs, use JSON format in the cell</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {previewMode && previewData && (
            <div className="mt-6 border border-slate-600 rounded-md p-4 bg-slate-900">
              <h3 className="text-lg font-medium mb-2">Preview</h3>
              <div className="max-h-[300px] overflow-y-auto">
                {previewData.map((quiz: any, index: number) => (
                  <div key={index} className="mb-4 pb-4 border-b border-slate-700 last:border-0">
                    <h4 className="font-medium">{quiz.title}</h4>
                    <p className="text-sm text-slate-400">{quiz.description}</p>
                    <p className="text-sm">
                      {quiz.emoji} • {quiz.time_limit}s • {quiz.questions.length} questions
                    </p>
                    <div className="mt-2">
                      <p className="text-xs text-slate-500">Question types:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.from(new Set(quiz.questions.map((q: any) => q.type))).map((type: any) => (
                          <span key={type} className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/quizzes">Cancel</Link>
            </Button>
            <Button onClick={handlePreview} variant="outline" disabled={isSubmitting}>
              Preview
            </Button>
            <Button onClick={handleImport} disabled={isSubmitting} className="flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
