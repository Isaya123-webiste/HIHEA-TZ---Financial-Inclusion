"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import ImageSlideshow from "@/components/image-slideshow"

interface LoginLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  rightContent?: any
}

export default function LoginLayout({ children, title, subtitle }: LoginLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left side - Login/Register Form */}
        <div className="flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex justify-center">
              <Link href="/" className="inline-flex items-center justify-center">
                <Image
                  src="/hihea-hand-in-hand-logo.png"
                  alt="Hand in Hand Eastern Africa Logo"
                  width={120}
                  height={36}
                  priority
                  className="h-auto w-auto"
                />
              </Link>
            </div>
            <div className="mb-8 text-center">
              <h2 className="mt-6 text-3xl font-bold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            <div className="mt-16 border-t pt-6 text-center">
              <p className="text-xs text-gray-600">© 2025 Hand in Hand Eastern Africa. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Right side - Image Slideshow */}
        <div className="hidden lg:block lg:w-1/2">
          <ImageSlideshow />
        </div>
      </div>
    </div>
  )
}
