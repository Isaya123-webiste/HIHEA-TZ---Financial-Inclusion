"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, User, Building } from "lucide-react"
import { completeAccountSetup, validateInvitationToken } from "@/lib/account-setup-actions"

export default function SetupAccountPage() {
  const [tokenData, setTokenData] = useState<any>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("Invalid or missing invitation token")
        setLoading(false)
        return
      }

      try {
        const result = await validateInvitationToken(token)

        if (result.success && result.user) {
          setTokenData(result.user)
        } else {
          setError(result.error || "Invalid or expired invitation token")
        }
      } catch (error) {
        console.error("Token validation error:", error)
        setError("Failed to validate invitation token")
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleSetupAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSetupLoading(true)
    setError(null)

    // Validation
    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      setSetupLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setSetupLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setSetupLoading(false)
      return
    }

    try {
      const result = await completeAccountSetup(token!, password)

      if (result.success) {
        setSuccess(true)

        // Redirect based on user role after 3 seconds
        setTimeout(() => {
          const role = result.role || tokenData?.role
          let redirectPath = "/"

          switch (role) {
            case "admin":
              redirectPath = "/admin"
              break
            case "branch_manager":
              redirectPath = "/dashboard/branch-manager"
              break
            case "program_officer":
              redirectPath = "/dashboard/program-officer"
              break
            case "branch_report_officer":
            case "report_officer": // Legacy support
              redirectPath = "/branch-report-officer"
              break
            default:
              redirectPath = "/?message=account-setup-complete"
          }

          router.push(redirectPath)
        }, 3000)
      } else {
        setError(result.error || "Failed to complete account setup")
      }
    } catch (error) {
      console.error("Account setup error:", error)
      setError("An unexpected error occurred")
    } finally {
      setSetupLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "branch_manager":
        return "Branch Manager"
      case "program_officer":
        return "Program Officer"
      case "branch_report_officer":
      case "report_officer": // Legacy support
        return "Branch Report Officer"
      case "admin":
        return "Administrator"
      default:
        return role?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "User"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent mx-auto"
                style={{ borderColor: "#009edb", borderTopColor: "transparent" }}
              ></div>
              <p className="mt-2 text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !tokenData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2" style={{ color: "#009edb" }}>
              <AlertCircle className="h-6 w-6" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button
              onClick={() => router.push("/")}
              className="w-full text-white"
              style={{ backgroundColor: "#009edb" }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Account Setup Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your account has been successfully set up. You can now access your {getRoleDisplayName(tokenData?.role)}{" "}
              dashboard.
            </p>
            <p className="text-sm text-green-600">Redirecting to your dashboard in 3 seconds...</p>
            <Button
              onClick={() => {
                const role = tokenData?.role
                let redirectPath = "/"

                switch (role) {
                  case "admin":
                    redirectPath = "/admin"
                    break
                  case "branch_manager":
                    redirectPath = "/dashboard/branch-manager"
                    break
                  case "program_officer":
                    redirectPath = "/dashboard/program-officer"
                    break
                  case "branch_report_officer":
                  case "report_officer": // Legacy support
                    redirectPath = "/branch-report-officer"
                    break
                  default:
                    redirectPath = "/"
                }

                router.push(redirectPath)
              }}
              className="w-full text-white"
              style={{ backgroundColor: "#009edb" }}
            >
              Go to Dashboard Now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-lg p-3 w-fit" style={{ backgroundColor: "#009edb" }}>
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Complete Your Account Setup</CardTitle>
          <p className="text-muted-foreground">Welcome to HIH Financial Inclusion</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{tokenData?.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{tokenData?.branch_name}</span>
            </div>
            <div className="text-sm text-muted-foreground">Role: {getRoleDisplayName(tokenData?.role)}</div>
          </div>

          <form onSubmit={handleSetupAccount} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={setupLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  disabled={setupLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={setupLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  disabled={setupLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: "#009edb" }}
              disabled={setupLoading}
            >
              {setupLoading ? "Setting up your account..." : "Complete Setup & Access Dashboard"}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            By completing your account setup, you agree to HIH Financial Inclusion's terms of service and privacy
            policy.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
