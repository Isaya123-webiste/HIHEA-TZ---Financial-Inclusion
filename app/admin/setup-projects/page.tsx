"use client"

import { useState } from "react"
import { setupProjectsTable } from "@/lib/setup-projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupProjectsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSetup = async () => {
    setLoading(true)
    setResult(null)

    try {
      const res = await setupProjectsTable()
      setResult(res)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Setup Projects Table</CardTitle>
          <CardDescription>
            Click the button below to create the projects table in Supabase and populate it with the 7 NGO projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSetup} disabled={loading} size="lg" className="w-full">
            {loading ? "Setting up..." : "Create Projects Table"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <p className={`font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}>{result.message}</p>

              {result.projects && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Projects created:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.projects.map((project: any) => (
                      <li key={project.id} className="text-sm">
                        {project.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.details && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Details:</p>
                  <ul className="text-sm space-y-1">
                    {result.details.map((detail: any, idx: number) => (
                      <li key={idx} className={detail.success ? "text-green-700" : "text-red-700"}>
                        {detail.name}: {detail.success ? "✓" : `✗ ${detail.error}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
