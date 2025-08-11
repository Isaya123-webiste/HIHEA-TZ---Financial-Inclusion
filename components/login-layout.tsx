"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { FileText } from "lucide-react"

interface Metric {
  label: string
  value: string
  color: string
}

interface Stat {
  value: string
  label: string
}

interface RightContentProps {
  heading: string
  description: string
  stats: Stat[]
  metrics: Metric[]
}

interface LoginLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  rightContent: RightContentProps
}

export default function LoginLayout({ children, title, subtitle, rightContent }: LoginLayoutProps) {
  // Images for the right panel
  const images = [
    "/placeholder.svg?height=200&width=200",
    "/placeholder.svg?height=200&width=200",
    "/placeholder.svg?height=200&width=200",
  ]

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

      {/* Right side - Info Panel */}
      <div className="hidden bg-teal-600 lg:block lg:w-1/2">
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-white">
          {/* Decorative images */}
          <div className="absolute left-12 top-12 rounded-lg overflow-hidden">
            <Image
              src={images[0] || "/placeholder.svg"}
              alt="Community member"
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
          </div>
          <div className="absolute right-12 top-12 rounded-lg overflow-hidden">
            <Image
              src={images[1] || "/placeholder.svg"}
              alt="Community member"
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
          </div>
          <div className="absolute bottom-12 left-1/4 rounded-lg overflow-hidden">
            <Image
              src={images[2] || "/placeholder.svg"}
              alt="Community member"
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
          </div>

          {/* Financial inclusion card */}
          <div className="mb-12 w-full max-w-md rounded-xl bg-teal-500/50 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Financial Inclusion</h3>
              <div className="flex space-x-1">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
              </div>
            </div>

            {rightContent.metrics.map((metric, index) => (
              <div key={index} className="mb-4">
                <div className="mb-1 flex items-center justify-between">
                  <span>{metric.label}</span>
                  <span className="font-semibold">{metric.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-teal-700/50">
                  <div
                    className={`h-2 rounded-full ${metric.color}`}
                    style={{ width: metric.value.replace("+", "") }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="text-center">
            <h2 className="text-3xl font-bold">{rightContent.heading}</h2>
            <p className="mx-auto mt-4 max-w-md text-teal-50">{rightContent.description}</p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid w-full max-w-md grid-cols-3 gap-6">
            {rightContent.stats.map((stat, index) => (
              <div key={index} className="rounded-xl bg-teal-500/50 p-4 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-teal-50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
