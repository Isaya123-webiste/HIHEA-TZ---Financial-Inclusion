import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    // Only attempt session refresh for routes that need authentication
    // Skip refresh for API routes and static assets (they're already filtered in matcher)
    const pathname = request.nextUrl.pathname
    const shouldRefreshSession = !pathname.startsWith('/login') && !pathname.startsWith('/register')
    
    if (shouldRefreshSession) {
      // Use a timeout to prevent lock contention from blocking requests
      // Set a shorter timeout to fail fast on lock conflicts
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Session refresh timeout')), 2000)
      )
      
      await Promise.race([
        supabase.auth.getUser(),
        timeoutPromise
      ])
    }
  } catch (error) {
    // Ignore session errors - they will be handled by individual pages
    // Lock errors and AbortErrors are expected in concurrent scenarios and are safe to ignore
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (!errorMsg.includes('Lock') && !errorMsg.includes('AbortError') && !errorMsg.includes('timeout')) {
      console.log("[v0] Middleware: Unexpected session error:", errorMsg)
    }
  }

  return supabaseResponse
}
