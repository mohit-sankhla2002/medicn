"use client"

import * as React from "react"
import { AlertTriangle, Check, CheckCircle2, Eraser, FileSignature, Lock, PenLine, Shield, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

export type ConsentType = "procedure" | "research" | "hipaa" | "general"
export type ConsentStatus = "unsigned" | "signed" | "witnessed" | "revoked"
export type SignatureMode = "type" | "draw"

export interface ConsentData {
  id?: string
  type: ConsentType
  procedureName: string
  description?: string
  risks?: string
  benefits?: string
  alternatives?: string
  status: ConsentStatus
  patientSignature?: string
  patientPrintedName?: string
  witnessName?: string
  signedAt?: string
  signatureMode?: SignatureMode
}

export const CONSENT_TYPES: Record<ConsentType, { title: string; defaultHeader: string }> = {
  procedure: {
    title: "Informed Consent for Procedure",
    defaultHeader: "Surgical / Procedural Informed Consent & Disclosure",
  },
  research: {
    title: "Clinical Research Informed Consent",
    defaultHeader: "Protocol Participation & Biomedical Data Consent",
  },
  hipaa: {
    title: "HIPAA & Health Information Disclosure",
    defaultHeader: "Notice of Privacy Practices & Authorized Disclosure",
  },
  general: {
    title: "General Treatment Consent",
    defaultHeader: "Conditions of Registration & Outpatient Care Consent",
  },
}

export function getConsentStatusInfo(status: ConsentStatus): { label: string; status: ClinicalStatus } {
  switch (status) {
    case "unsigned":
      return { label: "Unsigned", status: "watch" }
    case "signed":
      return { label: "Signed", status: "normal" }
    case "witnessed":
      return { label: "Witnessed", status: "info" }
    case "revoked":
      return { label: "Revoked", status: "critical" }
  }
}

export interface ConsentFormProps extends Omit<React.ComponentProps<"div">, "title"> {
  type?: ConsentType
  procedureName?: string
  description?: string
  risks?: string
  benefits?: string
  alternatives?: string
  status?: ConsentStatus
  patientPrintedName?: string
  witnessName?: string
  signedAt?: string
  defaultSignatureMode?: SignatureMode
  onSign?: (data: ConsentData) => void
  onRevoke?: () => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function ConsentForm({
  type = "procedure",
  procedureName = "Procedure",
  description,
  risks,
  benefits,
  alternatives,
  status = "unsigned",
  patientPrintedName: initialPrintedName = "",
  witnessName: initialWitnessName = "",
  signedAt: initialSignedAt,
  defaultSignatureMode = "type",
  onSign,
  onRevoke,
  readOnly = false,
  title,
  className,
  ...props
}: ConsentFormProps) {
  const [signatureMode, setSignatureMode] = React.useState<SignatureMode>(defaultSignatureMode)
  const [printedName, setPrintedName] = React.useState(initialPrintedName)
  const [witness, setWitness] = React.useState(initialWitnessName)
  const [hasDrawn, setHasDrawn] = React.useState(false)

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const isDrawing = React.useRef(false)

  const isLocked = readOnly || status === "signed" || status === "witnessed" || status === "revoked"
  const typeConfig = CONSENT_TYPES[type] || CONSENT_TYPES.procedure
  const statusInfo = getConsentStatusInfo(status)

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isLocked) return
    isDrawing.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "currentColor"
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || isLocked) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawing.current = false
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleSign = () => {
    const signatureData =
      signatureMode === "draw" && canvasRef.current
        ? canvasRef.current.toDataURL("image/png")
        : printedName

    onSign?.({
      type,
      procedureName,
      description,
      risks,
      benefits,
      alternatives,
      status: "signed",
      patientSignature: signatureData,
      patientPrintedName: printedName,
      witnessName: witness,
      signedAt: initialSignedAt ?? new Date().toLocaleString(),
      signatureMode,
    })
  }

  return (
    <div
      data-slot="consent-form"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <FileSignature className="size-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">{title ?? typeConfig.title}</h3>
            <p className="text-xs text-muted-foreground">{typeConfig.defaultHeader}</p>
          </div>
        </div>

        <ClinicalStatusBadge status={statusInfo.status}>
          {statusInfo.label}
        </ClinicalStatusBadge>
      </div>

      <div className="space-y-4 p-5 text-sm">
        {/* Procedure title banner */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Procedure / Clinical Intervention
          </span>
          <p className="text-base font-semibold text-foreground mt-0.5">{procedureName}</p>
        </div>

        {description && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Description of Procedure
            </span>
            <p className="text-muted-foreground leading-relaxed text-xs">{description}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {risks && (
            <div className="rounded-lg border border-clinical-watch/20 bg-clinical-watch/5 p-3 space-y-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-clinical-watch-foreground uppercase tracking-wider">
                <AlertTriangle className="size-3" /> Foreseeable Risks & Complications
              </span>
              <p className="text-xs text-foreground/80 leading-relaxed">{risks}</p>
            </div>
          )}

          {benefits && (
            <div className="rounded-lg border border-clinical-normal/20 bg-clinical-normal/5 p-3 space-y-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-clinical-normal-foreground uppercase tracking-wider">
                <Check className="size-3" /> Anticipated Clinical Benefits
              </span>
              <p className="text-xs text-foreground/80 leading-relaxed">{benefits}</p>
            </div>
          )}
        </div>

        {alternatives && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reasonable Alternatives & Consequences of Refusal
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">{alternatives}</p>
          </div>
        )}

        {/* Legal Acknowledgment */}
        <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            I acknowledge that I have received an explanation of the proposed procedure, its
            substantial risks, and alternative courses of therapy. I have been provided an
            opportunity to ask questions and have all questions answered to my satisfaction.
          </p>
        </div>

        {/* Signature Capture Block */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Patient / Authorized Surrogate Signature
            </span>
            {!isLocked && (
              <div className="flex rounded border bg-muted text-xs">
                <button
                  type="button"
                  className={cn(
                    "px-2 py-0.5 rounded-xs transition-colors text-[11px]",
                    signatureMode === "type" ? "bg-background text-foreground shadow-xs font-medium" : "text-muted-foreground"
                  )}
                  onClick={() => setSignatureMode("type")}
                >
                  Type Name
                </button>
                <button
                  type="button"
                  className={cn(
                    "px-2 py-0.5 rounded-xs transition-colors text-[11px]",
                    signatureMode === "draw" ? "bg-background text-foreground shadow-xs font-medium" : "text-muted-foreground"
                  )}
                  onClick={() => setSignatureMode("draw")}
                >
                  Draw Signature
                </button>
              </div>
            )}
          </div>

          {signatureMode === "type" ? (
            <div className="space-y-2">
              <Label htmlFor="consent-printed-name" className="text-xs font-medium text-muted-foreground">
                Patient Legal Name
              </Label>
              <Input
                id="consent-printed-name"
                disabled={isLocked}
                placeholder="Full Legal Name"
                value={printedName}
                onChange={(e) => setPrintedName(e.target.value)}
                className="h-9 text-sm"
              />
              {printedName && (
                <div className="rounded border bg-muted/30 p-2 text-center font-serif italic text-lg text-foreground tracking-wide">
                  {printedName}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded border bg-background overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={100}
                  className="w-full h-24 touch-none cursor-crosshair text-foreground"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && !isLocked && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground opacity-50">
                    Sign with mouse or stylus here
                  </div>
                )}
              </div>
              {!isLocked && hasDrawn && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[11px] text-muted-foreground"
                  onClick={clearCanvas}
                >
                  <Eraser className="mr-1 size-3" /> Clear signature
                </Button>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t">
            <div className="space-y-1">
              <Label htmlFor="consent-witness" className="text-xs text-muted-foreground">
                Witness Name (Optional)
              </Label>
              <Input
                id="consent-witness"
                disabled={isLocked}
                placeholder="Witness Full Name / Title"
                value={witness}
                onChange={(e) => setWitness(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block">Date & Time</span>
              <div className="h-8 px-3 rounded-md border bg-muted/40 flex items-center text-xs font-mono text-muted-foreground">
                {initialSignedAt ?? (isLocked ? "Signed" : "Auto-stamped on signature")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3">
        <div className="text-xs text-muted-foreground">
          {isLocked ? (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <CheckCircle2 className="size-3.5 text-clinical-normal" /> Legal consent confirmed and sealed
            </span>
          ) : (
            <span>Signing is an affirmative legal representation of consent.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLocked && onRevoke && (
            <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:bg-destructive/10" onClick={onRevoke}>
              Revoke consent
            </Button>
          )}

          {!isLocked && onSign && (
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={signatureMode === "type" ? !printedName.trim() : !hasDrawn}
              onClick={handleSign}
            >
              <PenLine className="mr-1.5 size-3.5" />
              Sign & Confirm Consent
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
