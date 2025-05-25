import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"
import Link from "next/link"
import { quizzes } from "@/lib/data"

export function QuizList({ category = "all" }: { category?: string }) {
  // Filter quizzes by category if needed
  const filteredQuizzes = category === "all" ? quizzes : quizzes.filter((quiz) => quiz.category === category)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredQuizzes.map((quiz) => (
        <Card key={quiz.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
              </div>
              <Badge variant="outline">{quiz.categoryName}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2 flex-grow">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>{quiz.questions.length} questions</span>
              </div>
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                <span>{quiz.plays} plays</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 line-clamp-2">{quiz.longDescription || quiz.description}</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/quiz/${quiz.id}`}>Start Quiz</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
