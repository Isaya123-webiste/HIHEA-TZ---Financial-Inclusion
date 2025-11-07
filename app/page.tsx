"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import LoginLayout from "@/components/login-layout"
import { signInAndRedirect } from "@/lib/auth-actions"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    console.log("[v0] Login form submitted for:", email)

    if (!email || !password) {
      setError("Email and password are required")
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      console.log("[v0] Calling signInAndRedirect...")
      const result = await signInAndRedirect(formData)

      console.log("[v0] signInAndRedirect result:", result)

      if (result.error) {
        console.log("[v0] Login error:", result.error)
        setError(result.error)
        setLoading(false)
      } else if (result.success) {
        setSuccess("Login successful! Redirecting...")

        // Use router.push for client-side navigation
        if (result.redirectUrl) {
          console.log("[v0] Redirecting to:", result.redirectUrl)
          // Short delay to show success message
          setTimeout(() => {
            router.push(result.redirectUrl!)
          }, 500)
        }
      }
    } catch (error: any) {
      console.error("[v0] Sign in error:", error)
      setError(`An unexpected error occurred: ${error.message || "Please try again"}`)
      setLoading(false)
    }
  }

  return (
    <LoginLayout title="Welcome back" subtitle="Sign in to access your dashboard">
      <form onSubmit={handleSignIn} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm hover:underline" style={{ color: "#009edb" }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              <span className="sr-only">Toggle password visibility</span>
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: "#009edb" }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </LoginLayout>
  )
}
