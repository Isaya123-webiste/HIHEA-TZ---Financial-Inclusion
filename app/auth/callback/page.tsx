"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL (contains the tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        const type = hashParams.get("type")

        if (type === "signup" && accessToken && refreshToken) {
          // Set the session with the tokens from the email verification
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error("Session error:", error)
            setStatus("error")
            setMessage("Failed to verify your email. Please try again.")
            return
          }

          if (data.user) {
            setStatus("success")
            setMessage("Your email has been verified successfully! You can now access your dashboard.")

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push("/dashboard")
            }, 3000)
          }
        } else {
          // Handle other auth callbacks or errors
          const { data, error } = await supabase.auth.getSession()

          if (error) {
            setStatus("error")
            setMessage("Authentication failed. Please try signing in again.")
          } else if (data.session) {
            setStatus("success")
            setMessage("Authentication successful! Redirecting to dashboard...")
            router.push("/dashboard")
          } else {
            setStatus("error")
            setMessage("No valid authentication found. Please sign in again.")
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        setStatus("error")
        setMessage("An unexpected error occurred during authentication.")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-teal-600" />}
            {status === "success" && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === "error" && <AlertCircle className="h-6 w-6 text-red-600" />}

            {status === "loading" && "Verifying your email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>

          {status === "success" && (
            <div className="space-y-2">
              <p className="text-sm text-green-600">Redirecting to dashboard in 3 seconds...</p>
              <Button onClick={() => router.push("/dashboard")} className="w-full bg-teal-600 hover:bg-teal-700">
                Go to Dashboard Now
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <Button onClick={() => router.push("/")} className="w-full bg-teal-600 hover:bg-teal-700">
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
