"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, Building2, Check, FileCheck, Pill, Send, ShieldAlert, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"

export interface PrescriptionPatient {
  name: string
  dateOfBirth?: string
  mrn?: string
  allergies?: string[]
}

export interface PrescriberInfo {
  name: string
  title?: string
  dea?: string
  npi?: string
  clinic?: string
  phone?: string
}

export interface Pharmacy {
  id: string
  name: string
  address?: string
  phone?: string
}

export interface Prescription {
  medication: string
  dose: string
  route?: string
  frequency?: string
  duration?: string
  quantity?: string
  refills?: number
  daw?: boolean
  instructions?: string
  pharmacyId?: string
  controlledSubstance?: boolean
}

export const ROUTES: { value: string; label: string }[] = [
  { value: "oral", label: "Oral (PO)" },
  { value: "sublingual", label: "Sublingual (SL)" },
  { value: "topical", label: "Topical" },
  { value: "inhaled", label: "Inhaled (INH)" },
  { value: "subcutaneous", label: "Subcutaneous (SC)" },
  { value: "intramuscular", label: "Intramuscular (IM)" },
  { value: "ophthalmic", label: "Ophthalmic (Ophth)" },
  { value: "otic", label: "Otic" },
]

export const FREQUENCIES: { value: string; label: string; sigCode?: string }[] = [
  { value: "once daily", label: "Once daily (QD)", sigCode: "QD" },
  { value: "twice daily", label: "Twice daily (BID)", sigCode: "BID" },
  { value: "three times daily", label: "Three times daily (TID)", sigCode: "TID" },
  { value: "four times daily", label: "Four times daily (QID)", sigCode: "QID" },
  { value: "every 4 to 6 hours as needed", label: "Every 4-6 hours PRN", sigCode: "Q4-6H PRN" },
  { value: "at bedtime", label: "At bedtime (QHS)", sigCode: "QHS" },
  { value: "every morning", label: "Every morning (QAM)", sigCode: "QAM" },
]

export function buildSigLine(rx: Partial<Prescription>): string {
  const parts: string[] = []
  if (rx.dose) parts.push(rx.dose)
  if (rx.route) parts.push(rx.route)
  if (rx.frequency) parts.push(rx.frequency)
  if (rx.duration) parts.push(`x ${rx.duration}`)
  if (rx.instructions) parts.push(`(${rx.instructions})`)
  return parts.join(" ")
}

export interface PrescriptionPadProps extends Omit<React.ComponentProps<"div">, "title"> {
  patient?: PrescriptionPatient
  prescriber?: PrescriberInfo
  pharmacies?: Pharmacy[]
  defaultPrescription?: Partial<Prescription>
  onPrescribe?: (prescription: Prescription) => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function PrescriptionPad({
  patient = { name: "Patient Name" },
  prescriber = { name: "Attending Physician, MD", clinic: "Outpatient Medical Center" },
  pharmacies = [],
  defaultPrescription,
  onPrescribe,
  readOnly = false,
  title = "Electronic Prescription Pad",
  className,
  ...props
}: PrescriptionPadProps) {
  const [medication, setMedication] = React.useState(defaultPrescription?.medication ?? "")
  const [dose, setDose] = React.useState(defaultPrescription?.dose ?? "")
  const [route, setRoute] = React.useState(defaultPrescription?.route ?? "oral")
  const [frequency, setFrequency] = React.useState(defaultPrescription?.frequency ?? "twice daily")
  const [duration, setDuration] = React.useState(defaultPrescription?.duration ?? "")
  const [quantity, setQuantity] = React.useState(defaultPrescription?.quantity ?? "")
  const [refills, setRefills] = React.useState<number>(defaultPrescription?.refills ?? 0)
  const [daw, setDaw] = React.useState<boolean>(defaultPrescription?.daw ?? false)
  const [instructions, setInstructions] = React.useState(defaultPrescription?.instructions ?? "")
  const [pharmacyId, setPharmacyId] = React.useState(defaultPrescription?.pharmacyId ?? (pharmacies[0]?.id ?? ""))
  const [controlled, setControlled] = React.useState(defaultPrescription?.controlledSubstance ?? false)

  const sigPreview = buildSigLine({ dose, route, frequency, duration, instructions })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onPrescribe?.({
      medication,
      dose,
      route,
      frequency,
      duration,
      quantity,
      refills,
      daw,
      instructions,
      pharmacyId,
      controlledSubstance: controlled,
    })
  }

  return (
    <div
      data-slot="prescription-pad"
      className={cn(
        "overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {/* Rx Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold italic text-primary leading-none">℞</span>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-[11px] text-muted-foreground">{prescriber.clinic}</p>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="font-medium text-foreground">{prescriber.name}</span>
          <div className="text-[10px] text-muted-foreground font-mono">
            {prescriber.npi && <span>NPI: {prescriber.npi} </span>}
            {prescriber.dea && <span>DEA: {prescriber.dea}</span>}
          </div>
        </div>
      </div>

      {/* Patient Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-5 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-foreground">{patient.name}</span>
          {patient.dateOfBirth && (
            <span className="text-muted-foreground">DOB: {patient.dateOfBirth}</span>
          )}
          {patient.mrn && (
            <span className="text-muted-foreground font-mono">MRN: {patient.mrn}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-[11px]">Allergies:</span>
          {patient.allergies && patient.allergies.length > 0 ? (
            <span className="font-medium text-clinical-critical">
              {patient.allergies.join(", ")}
            </span>
          ) : (
            <span className="text-clinical-normal">NKDA</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {controlled && (
          <div className="flex items-center gap-2 rounded-lg border border-clinical-critical/30 bg-clinical-critical/10 p-3 text-xs text-clinical-critical-foreground">
            <ShieldAlert className="size-4 shrink-0" />
            <div>
              <span className="font-semibold">Schedule II Controlled Substance</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Federal law prohibits the transfer of this drug to any person other than the patient for whom it was prescribed. Requires DEA digital signature.
              </p>
            </div>
          </div>
        )}

        {/* Drug Search / Name */}
        <div className="space-y-1.5">
          <Label htmlFor="rx-medication" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Medication & Strength <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rx-medication"
            disabled={readOnly}
            placeholder="e.g. Amoxicillin 500 mg Capsule"
            value={medication}
            onChange={(e) => setMedication(e.target.value)}
            required
            className="text-sm font-medium"
          />
        </div>

        {/* Sig Builder Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="rx-dose" className="text-xs text-muted-foreground">
              Dose <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rx-dose"
              disabled={readOnly}
              placeholder="e.g. 1 capsule"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="rx-route" className="text-xs text-muted-foreground">
              Route
            </Label>
            <select
              id="rx-route"
              disabled={readOnly}
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              {ROUTES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="rx-frequency" className="text-xs text-muted-foreground">
              Frequency
            </Label>
            <select
              id="rx-frequency"
              disabled={readOnly}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="rx-duration" className="text-xs text-muted-foreground">
              Duration
            </Label>
            <Input
              id="rx-duration"
              disabled={readOnly}
              placeholder="e.g. 10 days"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Dispense details: Quantity, Refills, DAW */}
        <div className="grid gap-3 sm:grid-cols-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="rx-quantity" className="text-xs text-muted-foreground">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rx-quantity"
              disabled={readOnly}
              placeholder="#30"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="rx-refills" className="text-xs text-muted-foreground">
              Refills
            </Label>
            <Input
              id="rx-refills"
              type="number"
              min="0"
              max="5"
              disabled={readOnly}
              value={refills}
              onChange={(e) => setRefills(parseInt(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-2 h-8">
            <Label htmlFor="rx-daw" className="text-xs text-muted-foreground cursor-pointer">
              DAW (Dispense as written)
            </Label>
            <Switch
              id="rx-daw"
              disabled={readOnly}
              checked={daw}
              onCheckedChange={setDaw}
            />
          </div>
        </div>

        {/* Formatted Sig Preview */}
        {sigPreview && (
          <div className="rounded-lg border bg-muted/30 p-2.5 text-xs space-y-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Sig / Directions Preview:
            </span>
            <p className="font-mono text-foreground font-medium">{sigPreview}</p>
          </div>
        )}

        {/* Pharmacy routing */}
        {pharmacies.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor="rx-pharmacy" className="text-xs text-muted-foreground">
              Target Dispensing Pharmacy
            </Label>
            <select
              id="rx-pharmacy"
              disabled={readOnly}
              value={pharmacyId}
              onChange={(e) => setPharmacyId(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              {pharmacies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.address ? `(${p.address})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            <span>NCPDP e-prescribing compliant network transmission.</span>
          </div>

          {!readOnly && (
            <Button type="submit" size="sm" className="h-8 text-xs">
              <Send className="mr-1.5 size-3.5" />
              Transmit E-Prescription
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
