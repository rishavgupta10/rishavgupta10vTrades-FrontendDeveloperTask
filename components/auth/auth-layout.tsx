import type { ReactNode } from "react"
import { HeroPanel } from "./hero-panel"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-svh bg-ink text-white">
      <div className="mx-auto grid min-h-svh w-full max-w-(--layout-max-width) gap-(--layout-gap) p-(--layout-gutter) lg:grid-cols-(--layout-grid-columns) lg:items-stretch lg:gap-0">
        <HeroPanel />
        <div className="flex items-center justify-center py-(--layout-form-padding-y) lg:py-0">
          {children}
        </div>
      </div>
    </main>
  )
}
