import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 pb-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}

export function H2({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn("mt-12 mb-4 scroll-mt-20 border-b pb-2 text-xl font-semibold tracking-tight", className)}>
      {children}
    </h2>
  )
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mt-8 mb-3 scroll-mt-20 text-base font-semibold tracking-tight">
      {children}
    </h3>
  )
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("my-3 leading-7 text-foreground/85", className)}>{children}</p>
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">{children}</code>
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="ml-3 flex flex-col gap-8 border-l pl-7 [counter-reset:step]">{children}</ol>
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="relative [counter-increment:step] before:absolute before:-left-[2.65rem] before:flex before:size-7 before:items-center before:justify-center before:rounded-full before:border before:bg-background before:font-mono before:text-xs before:content-[counter(step)]">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </li>
  )
}

export function Callout({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "warning" }) {
  return (
    <div
      className={cn(
        "my-4 rounded-xl border px-4 py-3 text-sm leading-6",
        tone === "warning"
          ? "border-amber-500/30 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200"
          : "bg-muted/50"
      )}
    >
      {children}
    </div>
  )
}
