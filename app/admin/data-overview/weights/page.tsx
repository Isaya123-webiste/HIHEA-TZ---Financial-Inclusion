"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronDown, ChevronUp, Edit2, TrendingUp, AlertCircle, Zap } from "lucide-react"
import { getUsageWeights, updateWeight, type WeightConfig } from "@/lib/weights-actions"
import { ToastContainer, useToast } from "@/components/toast"

type Factor = "USAGE" | "ACCESS" | "BARRIERS"

const AVAILABLE_FACTORS: {
  value: Factor
  label: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
}[] = [
  {
    value: "USAGE",
    label: "USAGE",
    description: "Financial service usage patterns and metrics",
    icon: <Zap className="w-6 h-6" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  // ACCESS and BARRIERS will be added in future
]

export default function WeightsConfigurationPage() {
  const [weights, setWeights] = useState<WeightConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedFactor, setSelectedFactor] = useState<Factor>("USAGE")

  const [expandedSections, setExpandedSections] = useState({
    MAIN_FACTOR: true,
    SUB_FACTOR: true,
    KPI: true,
    KRI: true,
  })

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingWeight, setEditingWeight] = useState<WeightConfig | null>(null)
  const [editValue, setEditValue] = useState("")

  const { toasts, showSuccess, showError, removeToast } = useToast()

  useEffect(() => {
    loadWeights()
  }, [selectedFactor])

  const loadWeights = async () => {
    try {
      setLoading(true)
      if (selectedFactor === "USAGE") {
        const result = await getUsageWeights()
        if (result.success) {
          setWeights(result.data)
        } else {
          showError(result.error || "Failed to load weights")
        }
      }
    } catch (error) {
      console.error("Load weights error:", error)
      showError("Failed to load weights")
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (weight: WeightConfig) => {
    setEditingWeight(weight)
    setEditValue(weight.weight_value.toString())
    setShowEditDialog(true)
  }

  const handleSaveWeight = async () => {
    if (!editingWeight || !editValue) return

    const newValue = Number.parseFloat(editValue)
    if (isNaN(newValue)) {
      showError("Invalid weight value")
      return
    }

    setUpdating(true)
    try {
      const result = await updateWeight(editingWeight.metric_key, newValue)
      if (result.success) {
        setWeights(weights.map((w) => (w.id === editingWeight.id ? { ...w, weight_value: newValue } : w)))
        showSuccess(`Weight updated: ${editingWeight.metric_name} = ${newValue}`)
        setShowEditDialog(false)
        setEditingWeight(null)
      } else {
        showError(result.error || "Failed to update weight")
      }
    } catch (error) {
      console.error("Save weight error:", error)
      showError("Failed to save weight")
    } finally {
      setUpdating(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const groupedWeights = weights.reduce(
    (acc, weight) => {
      if (!acc[weight.category]) {
        acc[weight.category] = []
      }
      acc[weight.category].push(weight)
      return acc
    },
    {} as Record<string, WeightConfig[]>,
  )

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      MAIN_FACTOR: "Main Factor",
      SUB_FACTOR: "Sub-Factors",
      KPI: "KPIs (Success Metrics)",
      KRI: "KRIs (Risk Metrics)",
    }
    return labels[category] || category
  }

  const getCategoryDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      MAIN_FACTOR: "Primary weight for the USAGE measurement system",
      SUB_FACTOR: "Component weights that make up the main factor",
      KPI: "Key Performance Indicators measuring success outcomes",
      KRI: "Key Risk Indicators measuring potential risks",
    }
    return descriptions[category] || ""
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      MAIN_FACTOR: <TrendingUp className="w-5 h-5" />,
      SUB_FACTOR: <div className="w-5 h-5 bg-blue-200 rounded" />,
      KPI: <div className="w-5 h-5 bg-green-200 rounded" />,
      KRI: <AlertCircle className="w-5 h-5" />,
    }
    return icons[category]
  }

  const selectedFactorDetails = AVAILABLE_FACTORS.find((f) => f.value === selectedFactor)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Weights Configuration</h1>
            <p className="text-slate-600">Manage weight values for the USAGE measurement system</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Select Measurement System</h2>
            <p className="text-sm text-slate-600 mt-1">Choose the measurement system to configure weights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_FACTORS.map((factor) => (
              <button
                key={factor.value}
                onClick={() => setSelectedFactor(factor.value)}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                  selectedFactor === factor.value
                    ? `${factor.borderColor} ${factor.bgColor} shadow-lg ring-2 ring-offset-2 ring-amber-300`
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="p-6 relative z-10">
                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${factor.bgColor} ${factor.color} mb-4`}
                  >
                    {factor.icon}
                  </div>

                  {/* Label */}
                  <h3 className="text-lg font-bold text-slate-900 text-left mb-2">{factor.label}</h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 text-left">{factor.description}</p>

                  {/* Selected indicator */}
                  {selectedFactor === factor.value && (
                    <div className="mt-4 flex items-center gap-2 text-amber-600 font-medium text-sm">
                      <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                      Selected
                    </div>
                  )}
                </div>

                {/* Background accent */}
                {selectedFactor === factor.value && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-transparent opacity-30 -mr-16 -mt-16 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="space-y-3 text-center">
              <div className="animate-spin inline-flex items-center justify-center w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full"></div>
              <p className="text-slate-600">Loading weights...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedWeights).map(([category, categoryWeights]) => (
              <Card key={category} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleSection(category as keyof typeof expandedSections)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-slate-600">
                      {expandedSections[category as keyof typeof expandedSections] ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-slate-500">{getCategoryIcon(category)}</div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{getCategoryLabel(category)}</h2>
                      <p className="text-sm text-slate-500 mt-1">{getCategoryDescription(category)}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {categoryWeights.length} items
                  </span>
                </div>

                {expandedSections[category as keyof typeof expandedSections] && (
                  <CardContent className="pt-0 px-6 pb-6 space-y-3 bg-slate-50">
                    {categoryWeights.map((weight, idx) => (
                      <div
                        key={weight.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-sm font-medium">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">{weight.metric_name}</p>
                              {weight.description && (
                                <p className="text-sm text-slate-600 mt-0.5">{weight.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{weight.weight_value}</p>
                            <p className="text-xs text-slate-500 mt-1">Weight Value</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(weight)}
                            className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Weight Value</DialogTitle>
            <DialogDescription>
              Update the weight for: <span className="font-semibold text-slate-900">{editingWeight?.metric_name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight-input" className="text-slate-700 font-medium">
                New Weight Value
              </Label>
              <Input
                id="weight-input"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="0.5"
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">Current value: {editingWeight?.weight_value}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWeight} disabled={updating} className="bg-blue-600 hover:bg-blue-700">
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
