"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Star } from "lucide-react"

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isLight = theme === "light"

  const handleToggle = () => {
    const newTheme = isLight ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  return (
    <button
      onClick={handleToggle}
      className="relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none"
      style={{
        backgroundColor: isLight ? "#6B9FFF" : "#1a1a2e",
      }}
      aria-label="Toggle dark mode"
    >
      {/* Toggle Circle */}
      <div
        className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 flex items-center justify-center"
        style={{
          left: isLight ? "4px" : "26px",
        }}
      >
        {isLight ? (
          <Sun className="w-4 h-4 text-yellow-400" />
        ) : (
          <Moon className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Decorative dots for light mode */}
      {isLight && (
        <>
          <div className="absolute right-2 top-1.5 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
          <div className="absolute right-3.5 bottom-1.5 w-1 h-1 bg-white rounded-full opacity-40"></div>
        </>
      )}

      {/* Decorative stars and dots for dark mode */}
      {!isLight && (
        <>
          <div className="absolute left-3 top-1 w-1 h-1 bg-white rounded-full opacity-70"></div>
          <Star className="absolute left-2.5 bottom-1.5 w-2.5 h-2.5 text-white opacity-60 fill-white" />
          <div className="absolute right-2 top-1.5 w-1 h-1 bg-white rounded-full opacity-50"></div>
        </>
      )}
    </button>
  )
}
