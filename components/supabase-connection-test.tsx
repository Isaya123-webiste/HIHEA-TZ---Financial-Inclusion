"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, Database, Users, Building } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface ConnectionTest {
  name: string
  status: "pending" | "success" | "error"
  message: string
  icon: React.ReactNode
}

export default function SupabaseConnectionTest() {
  const [tests, setTests] = useState<ConnectionTest[]>([
    {
      name: "Database Connection",
      status: "pending",
      message: "Testing connection...",
      icon: <Database className="h-4 w-4" />,
    },
    {
      name: "Profiles Table",
      status: "pending",
      message: "Checking profiles table...",
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: "Branches Table",
      status: "pending",
      message: "Checking branches table...",
      icon: <Building className="h-4 w-4" />,
    },
  ])

  const runTests = async () => {
    // Reset all tests
    setTests((prev) => prev.map((test) => ({ ...test, status: "pending" as const })))

    // Test 1: Basic connection
    try {
      const { error } = await supabase.from("profiles").select("count").limit(1)

      setTests((prev) =>
        prev.map((test) =>
          test.name === "Database Connection"
            ? {
                ...test,
                status: error ? "error" : "success",
                message: error ? `Connection failed: ${error.message}` : "Connected successfully",
              }
            : test,
        ),
      )
    } catch (err: any) {
      setTests((prev) =>
        prev.map((test) =>
          test.name === "Database Connection"
            ? { ...test, status: "error", message: `Connection error: ${err.message}` }
            : test,
        ),
      )
    }

    // Test 2: Profiles table
    try {
      const { data, error } = await supabase.from("profiles").select("id").limit(1)

      setTests((prev) =>
        prev.map((test) =>
          test.name === "Profiles Table"
            ? {
                ...test,
                status: error ? "error" : "success",
                message: error ? `Profiles error: ${error.message}` : "Profiles table accessible",
              }
            : test,
        ),
      )
    } catch (err: any) {
      setTests((prev) =>
        prev.map((test) =>
          test.name === "Profiles Table"
            ? { ...test, status: "error", message: `Profiles error: ${err.message}` }
            : test,
        ),
      )
    }

    // Test 3: Branches table
    try {
      const { data, error } = await supabase.from("branches").select("id").limit(1)

      setTests((prev) =>
        prev.map((test) =>
          test.name === "Branches Table"
            ? {
                ...test,
                status: error ? "error" : "success",
                message: error ? `Branches error: ${error.message}` : "Branches table accessible",
              }
            : test,
        ),
      )
    } catch (err: any) {
      setTests((prev) =>
        prev.map((test) =>
          test.name === "Branches Table"
            ? { ...test, status: "error", message: `Branches error: ${err.message}` }
            : test,
        ),
      )
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const allPassed = tests.every((test) => test.status === "success")
  const anyFailed = tests.some((test) => test.status === "error")

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(allPassed ? "success" : anyFailed ? "error" : "pending")}
          Supabase Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {test.icon}
                {getStatusIcon(test.status)}
              </div>
              <div className="flex-1">
                <div className="font-medium">{test.name}</div>
                <div
                  className={`text-sm ${
                    test.status === "success"
                      ? "text-green-600"
                      : test.status === "error"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {test.message}
                </div>
              </div>
            </div>
          ))}
        </div>

        {allPassed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">All tests passed!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your Supabase connection is working correctly. You can now proceed with the application.
            </p>
          </div>
        )}

        {anyFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Some tests failed</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Please run the database schema script and check your environment variables.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={runTests} variant="outline">
            Run Tests Again
          </Button>
          <Button onClick={() => (window.location.href = "/")}>Go to Login</Button>
        </div>
      </CardContent>
    </Card>
  )
}
