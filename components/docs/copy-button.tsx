"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={() => {
        void navigator.clipboard.writeText(value)
        setCopied(true)
      }}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  )
}
