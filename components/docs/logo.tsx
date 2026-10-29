import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <path d="M10 6h4v4h4v4h-4v4h-4v-4H6v-4h4z" className="fill-primary-foreground" />
    </svg>
  )
}
