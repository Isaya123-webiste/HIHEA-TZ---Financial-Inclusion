"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Loader2 } from "lucide-react"
import { generateBranchReport } from "@/lib/ai-actions"

interface AiReportGeneratorProps {
  branchId?: string
  userRole?: string
}

export default function AiReportGenerator({ branchId = "", userRole = "user" }: AiReportGeneratorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [generatedReport, setGeneratedReport] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async () => {
    if (!selectedPeriod) return

    setIsGenerating(true)
    try {
      const result = await generateBranchReport(branchId, selectedPeriod)

      if (result.success) {
        setGeneratedReport(result.report)
      } else {
        setGeneratedReport(`Error generating report: ${result.error}`)
      }
    } catch (error) {
      console.error("Report generation error:", error)
      setGeneratedReport("Failed to generate report. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = () => {
    if (!generatedReport) return

    const blob = new Blob([generatedReport], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `financial-report-${selectedPeriod}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>AI Report Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Report Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select reporting period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="quarterly">Quarterly Report</SelectItem>
                <SelectItem value="yearly">Annual Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerateReport} disabled={!selectedPeriod || isGenerating} className="min-w-[120px]">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        </div>

        {generatedReport && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Generated Report</h3>
              <Button onClick={handleDownloadReport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <Textarea
              value={generatedReport}
              onChange={(e) => setGeneratedReport(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Generated report will appear here..."
            />
          </div>
        )}

        {!generatedReport && !isGenerating && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>
              Select a reporting period and click "Generate Report" to create an AI-powered financial inclusion report.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Named export for compatibility
export { AiReportGenerator }
export const AIReportGenerator = AiReportGenerator
