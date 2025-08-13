"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Sparkles } from "lucide-react"
import { generateBranchReport } from "@/lib/ai-actions"

interface AiReportGeneratorProps {
  branches: Array<{ id: string; name: string }>
  userRole: string
  userId?: string
}

export default function AiReportGenerator({ branches, userRole, userId }: AiReportGeneratorProps) {
  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [generatedReport, setGeneratedReport] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const periods = [
    { value: "weekly", label: "Weekly Report" },
    { value: "monthly", label: "Monthly Report" },
    { value: "quarterly", label: "Quarterly Report" },
    { value: "yearly", label: "Annual Report" },
  ]

  const generateReport = async () => {
    if (!selectedBranch || !selectedPeriod) return

    setIsGenerating(true)
    try {
      // Mock metrics data - in real app, fetch from your database
      const mockMetrics = [
        { name: "Total Members", value: 1250, change: "+12%" },
        { name: "Active Loans", value: 890, change: "+8%" },
        { name: "Savings Accounts", value: 1100, change: "+15%" },
        { name: "Financial Literacy Sessions", value: 45, change: "+20%" },
      ]

      const result = await generateBranchReport(userId || "anonymous", selectedBranch, selectedPeriod, mockMetrics)

      if (result.success) {
        setGeneratedReport(result.report)
      } else {
        setGeneratedReport("Failed to generate report. Please try again.")
      }
    } catch (error) {
      console.error("Report generation error:", error)
      setGeneratedReport("An error occurred while generating the report.")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = () => {
    const blob = new Blob([generatedReport], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `HIH_Report_${selectedPeriod}_${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Branch</label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Choose branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Report Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Choose period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={generateReport}
          disabled={!selectedBranch || !selectedPeriod || isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating AI Report...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate AI Report
            </>
          )}
        </Button>

        {generatedReport && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Generated Report</h3>
              <Button
                onClick={downloadReport}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
              {generatedReport}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Add named export for compatibility
export { default as AIReportGenerator } from "./ai-report-generator"
