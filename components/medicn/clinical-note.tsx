"use client"

import * as React from "react"
import { Check, CheckCheck, Clock, FileEdit, FileText, Lock, PenLine, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

export type NoteTemplate = "soap" | "hp" | "progress" | "procedure"
export type NoteStatus = "draft" | "signed" | "cosigned" | "amended"

export interface NoteSection {
  key: string
  label: string
  content: string
  placeholder?: string
}

export interface ClinicalNoteData {
  id?: string
  template: NoteTemplate
  sections: NoteSection[]
  status: NoteStatus
  author?: string
  cosigner?: string
  signedAt?: string
  cosignedAt?: string
  createdAt?: string
  updatedAt?: string
}

export const NOTE_TEMPLATES: Record<NoteTemplate, { key: string; label: string; placeholder: string }[]> = {
  soap: [
    {
      key: "subjective",
      label: "Subjective",
      placeholder: "Chief complaint, history of present illness, patient symptoms and narrative...",
    },
    {
      key: "objective",
      label: "Objective",
      placeholder: "Vital signs, physical examination findings, diagnostic/lab results...",
    },
    {
      key: "assessment",
      label: "Assessment",
      placeholder: "Clinical impression, differential diagnoses, status of active problems...",
    },
    {
      key: "plan",
      label: "Plan",
      placeholder: "Medications prescribed, diagnostics ordered, patient education, follow-up...",
    },
  ],
  hp: [
    {
      key: "chiefComplaint",
      label: "Chief Complaint",
      placeholder: "Primary reason for visit...",
    },
    {
      key: "hpi",
      label: "History of Present Illness",
      placeholder: "Chronological description of the development of the patient's present illness...",
    },
    {
      key: "ros",
      label: "Review of Systems",
      placeholder: "Constitutional, cardiovascular, respiratory, gastrointestinal...",
    },
    {
      key: "pmh",
      label: "Past Medical / Surgical History",
      placeholder: "Chronic conditions, past surgeries, hospitalizations...",
    },
    {
      key: "physicalExam",
      label: "Physical Examination",
      placeholder: "General appearance, HEENT, chest, heart, abdomen, extremities, neuro...",
    },
    {
      key: "assessmentPlan",
      label: "Assessment & Plan",
      placeholder: "Diagnoses, medical decision making, therapeutic plan...",
    },
  ],
  progress: [
    {
      key: "intervalHistory",
      label: "Interval History",
      placeholder: "Events since last encounter, changes in symptoms...",
    },
    {
      key: "exam",
      label: "Focused Physical Exam",
      placeholder: "Targeted examination findings...",
    },
    {
      key: "assessmentPlan",
      label: "Assessment & Plan",
      placeholder: "Current clinical trajectory, medication adjustments, orders...",
    },
  ],
  procedure: [
    {
      key: "preOpDiagnosis",
      label: "Pre-Operative Diagnosis",
      placeholder: "Pre-procedure diagnosis...",
    },
    {
      key: "postOpDiagnosis",
      label: "Post-Operative Diagnosis",
      placeholder: "Post-procedure diagnosis...",
    },
    {
      key: "procedurePerformed",
      label: "Procedure Performed",
      placeholder: "Full description of surgical / interventional procedure...",
    },
    {
      key: "findings",
      label: "Operative Findings",
      placeholder: "Pathology identified, anatomy noted, specimens sent...",
    },
    {
      key: "complications",
      label: "Complications & Blood Loss",
      placeholder: "EBL, adverse events, instrument count confirmation...",
    },
    {
      key: "disposition",
      label: "Plan & Post-Procedure Care",
      placeholder: "Recovery instructions, monitoring requirements, discharge criteria...",
    },
  ],
}

export function getNoteStatusInfo(status: NoteStatus): { label: string; status: ClinicalStatus } {
  switch (status) {
    case "draft":
      return { label: "Draft", status: "watch" }
    case "signed":
      return { label: "Signed", status: "normal" }
    case "cosigned":
      return { label: "Co-signed", status: "info" }
    case "amended":
      return { label: "Amended", status: "abnormal" }
  }
}

export interface ClinicalNoteProps extends Omit<React.ComponentProps<"div">, "title"> {
  template?: NoteTemplate
  status?: NoteStatus
  author?: string
  cosigner?: string
  signedAt?: string
  cosignedAt?: string
  defaultSections?: NoteSection[]
  sections?: NoteSection[]
  onSectionsChange?: (sections: NoteSection[]) => void
  onSave?: (note: ClinicalNoteData) => void
  onSign?: (note: ClinicalNoteData) => void
  onAmend?: () => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function ClinicalNote({
  template = "soap",
  status = "draft",
  author,
  cosigner,
  signedAt,
  cosignedAt,
  defaultSections,
  sections: controlledSections,
  onSectionsChange,
  onSave,
  onSign,
  onAmend,
  readOnly = false,
  title,
  className,
  ...props
}: ClinicalNoteProps) {
  const templateConfig = NOTE_TEMPLATES[template] || NOTE_TEMPLATES.soap

  const [internalSections, setInternalSections] = React.useState<NoteSection[]>(() => {
    if (defaultSections && defaultSections.length > 0) return defaultSections
    return templateConfig.map((item) => ({
      key: item.key,
      label: item.label,
      content: "",
      placeholder: item.placeholder,
    }))
  })

  const sections = controlledSections ?? internalSections

  const handleContentChange = (key: string, content: string) => {
    const next = sections.map((s) => (s.key === key ? { ...s, content } : s))
    if (!controlledSections) {
      setInternalSections(next)
    }
    onSectionsChange?.(next)
  }

  const isLocked = readOnly || status === "signed" || status === "cosigned"
  const statusInfo = getNoteStatusInfo(status)

  const handleSave = () => {
    onSave?.({
      template,
      sections,
      status,
      author,
      cosigner,
      signedAt,
      cosignedAt,
    })
  }

  const handleSign = () => {
    onSign?.({
      template,
      sections,
      status: "signed",
      author,
      cosigner,
      signedAt: signedAt ?? new Date().toLocaleString(),
    })
  }

  return (
    <div
      data-slot="clinical-note"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {title ?? `${template.toUpperCase()} Clinical Note`}
          </h3>
          <ClinicalStatusBadge status={statusInfo.status} dot={status === "draft"}>
            {statusInfo.label}
          </ClinicalStatusBadge>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {author && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <User className="size-3 text-muted-foreground" />
              {author}
            </span>
          )}
          {signedAt && (
            <span className="inline-flex items-center gap-1">
              <Check className="size-3 text-clinical-normal" />
              {signedAt}
            </span>
          )}
          {cosigner && (
            <span className="inline-flex items-center gap-1">
              <CheckCheck className="size-3 text-clinical-info" />
              Co-signed by {cosigner}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/60 p-4 space-y-4">
        {sections.map((section) => {
          const config = templateConfig.find((t) => t.key === section.key)
          const placeholder = section.placeholder ?? config?.placeholder ?? ""

          return (
            <div key={section.key} className="space-y-1.5 pt-3 first:pt-0">
              <Label
                htmlFor={`note-sec-${section.key}`}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {section.label}
              </Label>
              <Textarea
                id={`note-sec-${section.key}`}
                value={section.content}
                disabled={isLocked}
                placeholder={placeholder}
                onChange={(e) => handleContentChange(section.key, e.target.value)}
                rows={3}
                className={cn(
                  "resize-y font-mono text-sm leading-relaxed",
                  isLocked && "opacity-90 bg-muted/30 cursor-default"
                )}
              />
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3">
        <div className="text-xs text-muted-foreground">
          {isLocked ? (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" /> Note is locked for editing
            </span>
          ) : (
            <span>All entries are part of the legal medical record.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLocked && onAmend && (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onAmend}>
              <FileEdit className="mr-1 size-3.5" />
              Amend note
            </Button>
          )}

          {!isLocked && (
            <>
              {onSave && (
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSave}>
                  Save draft
                </Button>
              )}
              {onSign && (
                <Button size="sm" className="h-8 text-xs" onClick={handleSign}>
                  <PenLine className="mr-1 size-3.5" />
                  Sign note
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
