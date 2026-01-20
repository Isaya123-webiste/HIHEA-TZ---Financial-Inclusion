"use client"

import DarkModeToggle from "@/components/dark-mode-toggle"

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
            <span>Administrator</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  )
}
