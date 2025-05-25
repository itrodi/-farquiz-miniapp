"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LeaderboardDiagnosticProps {
  quizId: string
}

export function LeaderboardDiagnostic({ quizId }: LeaderboardDiagnosticProps) {
  const [rawData, setRawData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Fetching raw data for quiz:", quizId)

      // 1. First, check if the quiz exists
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("id", quizId)
        .single()

      if (quizError) {
        throw new Error(`Quiz check failed: ${quizError.message}`)
      }

      // 2. Check user_scores table structure
      const { data: tableInfo, error: tableError } = await supabase.rpc("get_table_info", {
        table_name: "user_scores",
      })

      // 3. Get all scores for this quiz without joins
      const { data: scores, error: scoresError } = await supabase.from("user_scores").select("*").eq("quiz_id", quizId)

      if (scoresError) {
        throw new Error(`Scores query failed: ${scoresError.message}`)
      }

      // 4. Try to get profiles separately
      let profiles = null
      let profilesError = null
      if (scores && scores.length > 0) {
        const userIds = scores.map((score) => score.user_id).filter(Boolean)
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesErr } = await supabase
            .from("profiles")
            .select("*")
            .in("id", userIds)
          profiles = profilesData
          profilesError = profilesErr
        }
      }

      setRawData({
        quiz,
        tableInfo,
        scores,
        profiles,
        errors: {
          profilesError: profilesError ? profilesError.message : null,
        },
      })
    } catch (err: any) {
      console.error("Diagnostic error:", err)
      setError(err.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (quizId) {
      fetchData()
    }
  }, [quizId])

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Leaderboard Diagnostic</span>
          <Button size="sm" onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <>
            <h3 className="font-medium mb-2">Quiz Info:</h3>
            <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto mb-4">
              {rawData?.quiz ? JSON.stringify(rawData.quiz, null, 2) : "Loading..."}
            </pre>

            <h3 className="font-medium mb-2">Scores ({rawData?.scores?.length || 0}):</h3>
            <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto mb-4">
              {rawData?.scores ? JSON.stringify(rawData.scores.slice(0, 5), null, 2) : "Loading..."}
              {rawData?.scores && rawData.scores.length > 5 ? "\n... (more items)" : ""}
            </pre>

            <h3 className="font-medium mb-2">Profiles ({rawData?.profiles?.length || 0}):</h3>
            <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto mb-4">
              {rawData?.profiles ? JSON.stringify(rawData.profiles.slice(0, 3), null, 2) : "Loading..."}
              {rawData?.profiles && rawData.profiles.length > 3 ? "\n... (more items)" : ""}
            </pre>

            <h3 className="font-medium mb-2">Table Info:</h3>
            <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto">
              {rawData?.tableInfo ? JSON.stringify(rawData.tableInfo, null, 2) : "Loading..."}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  )
}
