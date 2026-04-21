import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Noto_Sans_Symbols as Material_Symbols_Outlined } from "next/font/google"
import { ThemeProvider } from "next-themes"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta-sans" })
const materialSymbols = Material_Symbols_Outlined({ weight: "400", subsets: ["symbols"] })

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${materialSymbols.variable}`} suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${plusJakartaSans.style.fontFamily};
  --font-sans: ${plusJakartaSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-material-symbols: ${materialSymbols.variable};
}
        `}</style>

      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
