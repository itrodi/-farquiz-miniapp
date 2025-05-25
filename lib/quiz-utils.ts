import type { EnhancedQuiz } from "@/lib/supabase/database.types"

// Helper function to validate a quiz object
export function validateQuiz(quiz: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!quiz.title) errors.push("Quiz title is required")
  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    errors.push("Quiz must have at least one question")
  }

  // Validate each question
  if (Array.isArray(quiz.questions)) {
    quiz.questions.forEach((question: any, index: number) => {
      if (!question.text) errors.push(`Question ${index + 1} is missing text`)
      if (!question.type) errors.push(`Question ${index + 1} is missing type`)

      // Validate based on question type
      switch (question.type) {
        case "multiple-choice":
          if (!Array.isArray(question.options) || question.options.length < 2) {
            errors.push(`Question ${index + 1} must have at least 2 options`)
          }
          if (!question.correctAnswer) {
            errors.push(`Question ${index + 1} is missing correctAnswer`)
          }
          break
        case "fill-blank":
          if (!question.correctAnswer && !question.correctAnswers) {
            errors.push(`Question ${index + 1} is missing correctAnswer or correctAnswers`)
          }
          break
        case "image-choice":
          if (!question.media || !question.media.url) {
            errors.push(`Question ${index + 1} is missing image media`)
          }
          if (!Array.isArray(question.options) || question.options.length < 2) {
            errors.push(`Question ${index + 1} must have at least 2 options`)
          }
          if (!question.correctAnswer) {
            errors.push(`Question ${index + 1} is missing correctAnswer`)
          }
          break
        case "map-click":
          if (!question.media || !question.media.url) {
            errors.push(`Question ${index + 1} is missing map media`)
          }
          if (!question.correctAnswer && typeof question.correctAnswer !== "object") {
            errors.push(`Question ${index + 1} is missing map coordinates`)
          }
          break
        case "matching":
          if (!question.correctAnswer || typeof question.correctAnswer !== "object") {
            errors.push(`Question ${index + 1} is missing matching pairs`)
          }
          break
        case "ordering":
          if (!Array.isArray(question.options) || question.options.length < 2) {
            errors.push(`Question ${index + 1} must have at least 2 items to order`)
          }
          if (!Array.isArray(question.correctAnswer)) {
            errors.push(`Question ${index + 1} is missing correct order`)
          }
          break
        case "timeline":
          if (!Array.isArray(question.options) || question.options.length < 2) {
            errors.push(`Question ${index + 1} must have at least 2 timeline events`)
          }
          if (!Array.isArray(question.correctAnswer)) {
            errors.push(`Question ${index + 1} is missing correct timeline order`)
          }
          break
        case "audio":
          if (!question.media || !question.media.url || question.media.type !== "audio") {
            errors.push(`Question ${index + 1} is missing audio media`)
          }
          if (!question.correctAnswer) {
            errors.push(`Question ${index + 1} is missing correctAnswer`)
          }
          break
        case "categorize":
          if (!question.options || !Array.isArray(question.options)) {
            errors.push(`Question ${index + 1} is missing items to categorize`)
          }
          if (!question.correctAnswer || typeof question.correctAnswer !== "object") {
            errors.push(`Question ${index + 1} is missing category assignments`)
          }
          break
        case "list":
          if (!Array.isArray(question.correctAnswers) || question.correctAnswers.length === 0) {
            errors.push(`Question ${index + 1} must have at least one correct answer`)
          }
          break
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Helper function to parse CSV data
export function parseCSV(csvData: string): any[] {
  const lines = csvData.split("\n").filter((line) => line.trim())
  const headers = lines[0].split(",").map((h) => h.trim())
  const results: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())
    if (values.length !== headers.length) continue

    const row: Record<string, any> = {}
    headers.forEach((header, index) => {
      // Try to parse JSON for complex fields
      if (values[index] && (values[index].startsWith("{") || values[index].startsWith("["))) {
        try {
          row[header] = JSON.parse(values[index])
        } catch {
          row[header] = values[index]
        }
      } else if (header === "options" && values[index]) {
        // Handle pipe-separated options
        row[header] = values[index].split("|").map((opt) => opt.trim())
      } else if (header === "correct_answers" && values[index]) {
        // Handle pipe-separated correct answers
        row[header] = values[index].split("|").map((ans) => ans.trim())
      } else if (header === "tags" && values[index]) {
        // Handle pipe-separated tags
        row[header] = values[index].split("|").map((tag) => tag.trim())
      } else {
        row[header] = values[index]
      }
    })

    results.push(row)
  }

  return results
}

// Helper function to group CSV rows by quiz title
export function groupCSVByQuiz(csvRows: any[]): Record<string, any> {
  const quizzesByTitle: Record<string, any> = {}

  for (const row of csvRows) {
    const title = row.title
    if (!title) continue

    if (!quizzesByTitle[title]) {
      quizzesByTitle[title] = {
        title,
        description: row.description || "",
        emoji: row.emoji || "🎮",
        time_limit: Number.parseInt(row.time_limit || "60"),
        quiz_type: row.quiz_type || "standard",
        difficulty: row.difficulty || "medium",
        scoring_type: row.scoring_type || "standard",
        flow_type: row.flow_type || "sequential",
        tags: row.quiz_tags ? row.quiz_tags.split("|").map((t: string) => t.trim()) : [],
        settings: row.settings ? (typeof row.settings === "string" ? JSON.parse(row.settings) : row.settings) : {},
        questions: [],
      }
    }

    // Add question if it exists
    if (row.question) {
      const question: any = {
        text: row.question,
        type: row.question_type || "multiple-choice",
      }

      // Handle options
      if (row.options) {
        if (Array.isArray(row.options)) {
          question.options = row.options
        } else if (typeof row.options === "string") {
          question.options = row.options.split("|").map((opt: string) => opt.trim())
        }
      }

      // Handle correct answers
      if (row.correct_answer) {
        question.correctAnswer = row.correct_answer
      }
      if (row.correct_answers) {
        question.correctAnswers = Array.isArray(row.correct_answers)
          ? row.correct_answers
          : row.correct_answers.split("|").map((ans: string) => ans.trim())
      }

      // Handle media
      if (row.media_url) {
        question.media = {
          type: row.media_type || "image",
          url: row.media_url,
          alt: row.media_alt || "",
        }
      }

      // Handle other fields
      if (row.points) question.points = Number.parseInt(row.points)
      if (row.hint) question.hint = row.hint
      if (row.explanation) question.explanation = row.explanation
      if (row.tags) {
        question.tags = Array.isArray(row.tags) ? row.tags : row.tags.split("|").map((tag: string) => tag.trim())
      }

      // Handle validation
      if (row.validation_type) {
        question.validation = {
          type: row.validation_type,
          threshold: row.validation_threshold ? Number.parseFloat(row.validation_threshold) : undefined,
          alternateAnswers: row.alternate_answers
            ? row.alternate_answers.split("|").map((ans: string) => ans.trim())
            : undefined,
        }
      }

      // Handle question settings
      if (row.shuffle_options || row.question_time_limit) {
        question.settings = {}
        if (row.shuffle_options) question.settings.shuffleOptions = row.shuffle_options === "true"
        if (row.question_time_limit) question.settings.timeLimit = Number.parseInt(row.question_time_limit)
      }

      quizzesByTitle[title].questions.push(question)
    }
  }

  return quizzesByTitle
}

// Helper function to normalize options format
export function normalizeOptions(options: any[]): string[] {
  if (!options || !Array.isArray(options)) return []

  // Check if options are in the format [{id: 'a', text: 'Option A'}, ...]
  if (options.length > 0 && typeof options[0] === "object" && "text" in options[0]) {
    return options.map((opt) => opt.text)
  }

  // Already in the format ['Option A', 'Option B', ...]
  return options
}

// Helper function to convert from the enhanced format to database format
export function convertToDatabaseFormat(quiz: EnhancedQuiz): any {
  const dbQuiz = {
    title: quiz.title,
    description: quiz.description || "",
    emoji: quiz.emoji || "🎮",
    time_limit: quiz.time_limit,
    quiz_type: quiz.quiz_type || "standard",
    settings: quiz.settings || {},
    tags: quiz.tags || [],
    difficulty: quiz.difficulty || "medium",
    scoring_type: quiz.scoring_type || "standard",
    flow_type: quiz.flow_type || "sequential",
    is_published: true,
  }

  const dbQuestions = quiz.questions.map((question, index) => {
    const dbQuestion: any = {
      text: question.text,
      question_type: question.type,
      order_index: index,
      points: question.points || 1,
      hint: question.hint || null,
      explanation: question.explanation || null,
      tags: question.tags || [],
      settings: question.settings || {},
      media: question.media || null,
      validation: question.validation || null,
    }

    // Handle type-specific fields
    switch (question.type) {
      case "multiple-choice":
      case "image-choice":
        // Normalize options to string array format
        dbQuestion.options = normalizeOptions(question.options || [])
        dbQuestion.correct_answer = question.correctAnswer as string
        break
      case "fill-blank":
        dbQuestion.correct_answer = question.correctAnswer as string
        dbQuestion.correct_answers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : question.correctAnswers || []
        break
      case "map-click":
        dbQuestion.map_coordinates = question.correctAnswer
        break
      case "matching":
      case "categorize":
        dbQuestion.options = normalizeOptions(question.options || [])
        dbQuestion.correct_answer = JSON.stringify(question.correctAnswer)
        break
      case "ordering":
      case "timeline":
        dbQuestion.options = normalizeOptions(question.options || [])
        dbQuestion.correct_answers = question.correctAnswer as string[]
        break
      case "audio":
        dbQuestion.correct_answer = question.correctAnswer as string
        break
      case "list":
        dbQuestion.correct_answers = question.correctAnswers || []
        break
    }

    return dbQuestion
  })

  return { quiz: dbQuiz, questions: dbQuestions }
}

// Helper function to generate a template for a specific quiz type
export function generateQuizTemplate(quizType: string): EnhancedQuiz {
  switch (quizType) {
    case "geography":
      return {
        title: "Geography Quiz Template",
        description: "Test your knowledge of world geography",
        emoji: "🌍",
        time_limit: 300,
        quiz_type: "geography",
        difficulty: "medium",
        questions: [
          {
            text: "Identify this country on the map",
            type: "map-click",
            media: {
              type: "svg",
              url: "https://example.com/world-map.svg",
              alt: "World map",
            },
            correctAnswer: { x: 48.2, y: 16.3 }, // Example coordinates
            points: 10,
            hint: "This country is in Europe",
          },
          {
            text: "Which country does this flag belong to?",
            type: "image-choice",
            media: {
              type: "image",
              url: "https://example.com/flag.jpg",
              alt: "Country flag",
            },
            options: [
              { id: "a", text: "France" },
              { id: "b", text: "Germany" },
              { id: "c", text: "Italy" },
              { id: "d", text: "Spain" },
            ],
            correctAnswer: "a",
          },
          {
            text: "Match these capitals to their countries",
            type: "matching",
            options: [
              { id: "a", text: "Paris" },
              { id: "b", text: "Berlin" },
              { id: "c", text: "Rome" },
              { id: "d", text: "Madrid" },
            ],
            correctAnswer: { a: "France", b: "Germany", c: "Italy", d: "Spain" },
          },
        ],
      }
    case "image-based":
      return {
        title: "Image Quiz Template",
        description: "Test your visual recognition skills",
        emoji: "🖼️",
        time_limit: 180,
        quiz_type: "image-based",
        difficulty: "easy",
        questions: [
          {
            text: "What is shown in this image?",
            type: "image-choice",
            media: {
              type: "image",
              url: "https://example.com/image1.jpg",
              alt: "Mystery image",
            },
            options: [
              { id: "a", text: "Option A" },
              { id: "b", text: "Option B" },
              { id: "c", text: "Option C" },
              { id: "d", text: "Option D" },
            ],
            correctAnswer: "b",
          },
          {
            text: "Identify the zoomed-in object",
            type: "fill-blank",
            media: {
              type: "image",
              url: "https://example.com/zoomed-image.jpg",
              alt: "Zoomed image",
            },
            correctAnswer: "keyboard",
            validation: {
              type: "case-insensitive",
              alternateAnswers: ["computer keyboard", "typing keyboard"],
            },
          },
        ],
      }
    case "timeline":
      return {
        title: "Timeline Quiz Template",
        description: "Arrange historical events in chronological order",
        emoji: "📅",
        time_limit: 240,
        quiz_type: "timeline",
        difficulty: "hard",
        questions: [
          {
            text: "Arrange these historical events in chronological order",
            type: "ordering",
            options: [
              { id: "a", text: "World War I" },
              { id: "b", text: "Moon Landing" },
              { id: "c", text: "Fall of the Berlin Wall" },
              { id: "d", text: "American Civil War" },
            ],
            correctAnswer: ["d", "a", "b", "c"],
          },
          {
            text: "When did this event occur?",
            type: "multiple-choice",
            media: {
              type: "image",
              url: "https://example.com/historical-event.jpg",
              alt: "Historical event",
            },
            options: [
              { id: "a", text: "1945" },
              { id: "b", text: "1969" },
              { id: "c", text: "1989" },
              { id: "d", text: "2001" },
            ],
            correctAnswer: "b",
          },
        ],
      }
    case "categorization":
      return {
        title: "Categorization Quiz Template",
        description: "Sort items into their correct categories",
        emoji: "📊",
        time_limit: 300,
        quiz_type: "categorization",
        difficulty: "medium",
        questions: [
          {
            text: "Sort these animals into their correct categories",
            type: "categorize",
            options: [
              { id: "a", text: "Lion" },
              { id: "b", text: "Shark" },
              { id: "c", text: "Eagle" },
              { id: "d", text: "Frog" },
              { id: "e", text: "Dolphin" },
              { id: "f", text: "Snake" },
            ],
            correctAnswer: {
              Mammals: ["a", "e"],
              Fish: ["b"],
              Birds: ["c"],
              Amphibians: ["d"],
              Reptiles: ["f"],
            },
          },
        ],
      }
    case "word-logic":
      return {
        title: "Word & Logic Quiz Template",
        description: "Test your word skills and logical thinking",
        emoji: "🔤",
        time_limit: 240,
        quiz_type: "word-logic",
        difficulty: "medium",
        questions: [
          {
            text: "What word can be formed from these letters: QUZI",
            type: "fill-blank",
            correctAnswer: "quiz",
            validation: {
              type: "exact",
            },
          },
          {
            text: "Complete the pattern: 2, 4, 8, 16, ...",
            type: "fill-blank",
            correctAnswer: "32",
            validation: {
              type: "exact",
            },
          },
          {
            text: "Which word does not belong in this group?",
            type: "multiple-choice",
            options: [
              { id: "a", text: "Apple" },
              { id: "b", text: "Banana" },
              { id: "c", text: "Carrot" },
              { id: "d", text: "Orange" },
            ],
            correctAnswer: "c",
            explanation: "Carrot is a vegetable, while the others are fruits.",
          },
        ],
      }
    default:
      return {
        title: "Standard Quiz Template",
        description: "A basic quiz template",
        emoji: "❓",
        time_limit: 180,
        quiz_type: "standard",
        difficulty: "medium",
        questions: [
          {
            text: "Sample multiple choice question",
            type: "multiple-choice",
            options: [
              { id: "a", text: "Option A" },
              { id: "b", text: "Option B" },
              { id: "c", text: "Option C" },
              { id: "d", text: "Option D" },
            ],
            correctAnswer: "a",
          },
          {
            text: "Sample fill in the blank question",
            type: "fill-blank",
            correctAnswer: "answer",
            validation: {
              type: "case-insensitive",
            },
          },
        ],
      }
  }
}

// Helper function to create an array utility for shuffling
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
