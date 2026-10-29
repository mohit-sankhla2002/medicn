import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export type ClinicalStatus = "normal" | "watch" | "abnormal" | "critical" | "info" | "unknown"

export const CLINICAL_STATUS_LABELS: Record<ClinicalStatus, string> = {
  normal: "Normal",
  watch: "Borderline",
  abnormal: "Abnormal",
  critical: "Critical",
  info: "Info",
  unknown: "No data",
}

const clinicalStatusBadgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      status: {
        normal: "border-clinical-normal/25 bg-clinical-normal/10 text-clinical-normal-foreground",
        watch: "border-clinical-watch/25 bg-clinical-watch/10 text-clinical-watch-foreground",
        abnormal: "border-clinical-abnormal/25 bg-clinical-abnormal/10 text-clinical-abnormal-foreground",
        critical: "border-clinical-critical/25 bg-clinical-critical/10 text-clinical-critical-foreground",
        info: "border-clinical-info/25 bg-clinical-info/10 text-clinical-info-foreground",
        unknown: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { status: "unknown" },
  }
)

const dotClasses: Record<ClinicalStatus, string> = {
  normal: "bg-clinical-normal",
  watch: "bg-clinical-watch",
  abnormal: "bg-clinical-abnormal",
  critical: "bg-clinical-critical",
  info: "bg-clinical-info",
  unknown: "bg-muted-foreground/50",
}

export interface ClinicalStatusBadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof clinicalStatusBadgeVariants> {
  /** Show a leading status dot. Critical dots pulse unless reduced motion is preferred. */
  dot?: boolean
}

export function ClinicalStatusBadge({
  status = "unknown",
  dot = true,
  className,
  children,
  ...props
}: ClinicalStatusBadgeProps) {
  const value = status ?? "unknown"
  return (
    <span
      data-slot="clinical-status-badge"
      data-status={value}
      className={cn(clinicalStatusBadgeVariants({ status: value }), className)}
      {...props}
    >
      {dot && (
        <span aria-hidden className="relative flex size-1.5">
          {value === "critical" && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-clinical-critical opacity-60 motion-reduce:hidden" />
          )}
          <span className={cn("relative inline-flex size-1.5 rounded-full", dotClasses[value])} />
        </span>
      )}
      {children ?? CLINICAL_STATUS_LABELS[value]}
    </span>
  )
}

export { clinicalStatusBadgeVariants }
