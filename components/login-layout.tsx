"use client"

import type React from "react"
import Link from "next/link"
import { FileText } from "lucide-react"
import ImageSlideshow from "@/components/image-slideshow"

interface LoginLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  rightContent?: any
}

export default function LoginLayout({ children, title, subtitle }: LoginLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Login/Register Form */}
      <div className="flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-teal-600 p-2">
              <FileText className="h-6 w-6 text-white" />
            </Link>
          </div>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">HIH</h1>
            <h2 className="mt-6 text-3xl font-bold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

      {/* Right side - Image Slideshow */}
      <div className="hidden lg:block lg:w-1/2">
        <ImageSlideshow />
      </div>
    </div>
  )
}
