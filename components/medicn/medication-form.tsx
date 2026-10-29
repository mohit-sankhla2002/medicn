"use client"

import * as React from "react"
import { ChevronsUpDown, Pill, Plus, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Medication } from "@/components/medicn/medication-list"

// ───────────────────────────── Types ─────────────────────────────

/** Route of administration (FHIR Dosage.route, simplified). */
export type MedicationRoute =
  | "oral"
  | "sublingual"
  | "IV"
  | "IM"
  | "SC"
  | "topical"
  | "inhaled"
  | "rectal"
  | "ophthalmic"
  | "otic"
  | "nasal"
  | "transdermal"

/**
 * Frequency codes. All except `Q12H`, `ONCE` and `custom` come from the FHIR R4 timing-abbreviation
 * value set (GTSAbbreviation). They are stored as codes but never printed in sig text (ISMP).
 */
export type FrequencyCode =
  | "QD"
  | "BID"
  | "TID"
  | "QID"
  | "AM"
  | "PM"
  | "QOD"
  | "Q1H"
  | "Q2H"
  | "Q3H"
  | "Q4H"
  | "Q6H"
  | "Q8H"
  | "Q12H"
  | "BED"
  | "WK"
  | "MO"
  | "ONCE"
  | "custom"

export type MedicationDoseForm =
  | "tablet"
  | "capsule"
  | "solution"
  | "suspension"
  | "injection"
  | "inhaler"
  | "patch"
  | "cream"
  | "drops"
  | (string & Record<never, never>)

export type DurationUnit = "days" | "weeks" | "months"

/** Structured order modelled on FHIR R4 MedicationRequest + Dosage and NCPDP SCRIPT structured sig. */
export interface MedicationOrder {
  /** Drug name (MedicationRequest.medicationCodeableConcept.text). */
  medication: string
  /** RxNorm code. */
  code?: string
  /** e.g. "500 mg" */
  strength?: string
  form?: MedicationDoseForm
  /** Dosage.doseAndRate.doseQuantity, e.g. { value: 1, unit: "tablet" } */
  dose: { value?: number; unit: string }
  route: MedicationRoute
  frequency: FrequencyCode
  /** Free-text frequency when `frequency` is "custom". */
  customFrequency?: string
  timing?: { withFood?: boolean }
  /** Dosage.asNeededBoolean */
  asNeeded?: boolean
  /** Dosage.asNeededCodeableConcept.text, e.g. "wheezing" */
  asNeededFor?: string
  /** dispenseRequest.expectedSupplyDuration */
  duration?: { value: number; unit: DurationUnit }
  /** dispenseRequest.quantity */
  quantity?: number
  /** dispenseRequest.numberOfRepeatsAllowed */
  refills?: number
  /** MedicationRequest.substitution.allowedBoolean. Defaults to true. */
  substitutionAllowed?: boolean
  /** MedicationRequest.reasonCode text. */
  indication?: string
  /** Dosage.patientInstruction */
  instructions?: string
  /** ISMP high-alert medication. */
  highAlert?: boolean
}

export interface MedicationOption {
  name: string
  strength?: string
  form?: MedicationDoseForm
  /** RxNorm code. */
  code?: string
  highAlert?: boolean
}

export interface MedicationPreset {
  label: string
  order: Partial<MedicationOrder>
}

// ───────────────────────────── Reference lists ─────────────────────────────

export interface FrequencyOption {
  code: FrequencyCode
  /** Human label, e.g. "Twice daily". */
  label: string
  /** Prescriber shorthand shown as a hint only — never printed in the sig. */
  abbreviation?: string
  /** Phrase used in the sig, e.g. "twice daily". */
  sig: string
  timesPerDay?: number
}

export const FREQUENCIES: FrequencyOption[] = [
  { code: "QD", label: "Once daily", abbreviation: "QD", sig: "once daily", timesPerDay: 1 },
  { code: "BID", label: "Twice daily", abbreviation: "BID", sig: "twice daily", timesPerDay: 2 },
  { code: "TID", label: "Three times daily", abbreviation: "TID", sig: "three times daily", timesPerDay: 3 },
  { code: "QID", label: "Four times daily", abbreviation: "QID", sig: "four times daily", timesPerDay: 4 },
  { code: "AM", label: "Every morning", abbreviation: "AM", sig: "every morning", timesPerDay: 1 },
  { code: "PM", label: "Every evening", abbreviation: "PM", sig: "every evening", timesPerDay: 1 },
  { code: "BED", label: "At bedtime", abbreviation: "BED", sig: "at bedtime", timesPerDay: 1 },
  { code: "QOD", label: "Every other day", abbreviation: "QOD", sig: "every other day", timesPerDay: 0.5 },
  { code: "Q1H", label: "Every hour", abbreviation: "Q1H", sig: "every hour", timesPerDay: 24 },
  { code: "Q2H", label: "Every 2 hours", abbreviation: "Q2H", sig: "every 2 hours", timesPerDay: 12 },
  { code: "Q3H", label: "Every 3 hours", abbreviation: "Q3H", sig: "every 3 hours", timesPerDay: 8 },
  { code: "Q4H", label: "Every 4 hours", abbreviation: "Q4H", sig: "every 4 hours", timesPerDay: 6 },
  { code: "Q6H", label: "Every 6 hours", abbreviation: "Q6H", sig: "every 6 hours", timesPerDay: 4 },
  { code: "Q8H", label: "Every 8 hours", abbreviation: "Q8H", sig: "every 8 hours", timesPerDay: 3 },
  // Not in the FHIR R4 timing-abbreviation value set. Map to Dosage.timing.repeat
  // { frequency: 1, period: 12, periodUnit: "h" } when building a FHIR resource.
  { code: "Q12H", label: "Every 12 hours", abbreviation: "Q12H", sig: "every 12 hours", timesPerDay: 2 },
  { code: "WK", label: "Once weekly", abbreviation: "WK", sig: "once weekly" },
  { code: "MO", label: "Once monthly", abbreviation: "MO", sig: "once monthly" },
  { code: "ONCE", label: "One time only", sig: "one time only" },
  { code: "custom", label: "Custom…", sig: "" },
]

export interface RouteOption {
  code: MedicationRoute
  /** Label as shown in medication lists, e.g. "Oral". */
  label: string
  /** Verb that starts the sig, e.g. "Take". */
  verb: string
  /** Phrase after the dose, e.g. "by mouth". May be empty. */
  sig: string
}

export const ROUTES: RouteOption[] = [
  { code: "oral", label: "Oral", verb: "Take", sig: "by mouth" },
  { code: "sublingual", label: "Sublingual", verb: "Place", sig: "under the tongue" },
  { code: "IV", label: "Intravenous", verb: "Give", sig: "intravenously" },
  { code: "IM", label: "Intramuscular", verb: "Inject", sig: "into the muscle" },
  { code: "SC", label: "Subcutaneous", verb: "Inject", sig: "under the skin" },
  { code: "topical", label: "Topical", verb: "Apply", sig: "to the affected area" },
  { code: "inhaled", label: "Inhaled", verb: "Inhale", sig: "" },
  { code: "rectal", label: "Rectal", verb: "Insert", sig: "rectally" },
  { code: "ophthalmic", label: "Ophthalmic", verb: "Instill", sig: "in the affected eye" },
  { code: "otic", label: "Otic", verb: "Instill", sig: "in the affected ear" },
  { code: "nasal", label: "Nasal", verb: "Use", sig: "in each nostril" },
  { code: "transdermal", label: "Transdermal", verb: "Apply", sig: "to the skin" },
]

export const DOSE_FORMS: { value: string; label: string; unit: string; route: MedicationRoute }[] = [
  { value: "tablet", label: "Tablet", unit: "tablet", route: "oral" },
  { value: "capsule", label: "Capsule", unit: "capsule", route: "oral" },
  { value: "solution", label: "Solution", unit: "mL", route: "oral" },
  { value: "suspension", label: "Suspension", unit: "mL", route: "oral" },
  { value: "injection", label: "Injection", unit: "mL", route: "SC" },
  { value: "inhaler", label: "Inhaler", unit: "puff", route: "inhaled" },
  { value: "patch", label: "Patch", unit: "patch", route: "transdermal" },
  { value: "cream", label: "Cream", unit: "application", route: "topical" },
  { value: "drops", label: "Drops", unit: "drop", route: "ophthalmic" },
]

export const DOSE_UNITS = [
  "tablet",
  "capsule",
  "mL",
  "mg",
  "mcg",
  "g",
  "units",
  "puff",
  "drop",
  "spray",
  "patch",
  "application",
  "suppository",
]

const COUNT_UNITS = new Set(["tablet", "capsule", "puff", "drop", "spray", "patch", "application", "suppository", "unit"])

// ISMP error-prone abbreviations → plain words.
const UNIT_ALIASES: Record<string, string> = { u: "unit", iu: "unit", units: "unit", cc: "mL", "µg": "mcg", ug: "mcg" }

const frequencyByCode = new Map(FREQUENCIES.map((f) => [f.code, f]))
const routeByCode = new Map(ROUTES.map((r) => [r.code, r]))

// ───────────────────────────── Helpers ─────────────────────────────

/** ISMP-safe number: no trailing zeros ("1", not "1.0"), always a leading zero ("0.5"), thousands separators. */
export function formatDoseNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 3, minimumIntegerDigits: 1 })
}

/** Plain-word unit with plural, e.g. (2, "tablet") → "tablets", (10, "U") → "units". */
export function formatDoseUnit(value: number | undefined, unit: string) {
  const trimmed = unit.trim()
  const base = UNIT_ALIASES[trimmed.toLowerCase()] ?? trimmed
  if (!COUNT_UNITS.has(base)) return base
  return value === undefined || value === 1 ? base : base === "patch" ? "patches" : `${base}s`
}

/** Plain-language frequency phrase, e.g. "twice daily". Never returns an abbreviation. */
export function formatFrequency(order: Pick<MedicationOrder, "frequency" | "customFrequency">) {
  if (order.frequency === "custom") return order.customFrequency?.trim() ?? ""
  return frequencyByCode.get(order.frequency)?.sig ?? ""
}

/**
 * Readable sig, e.g. "Take 1 tablet by mouth twice daily with food for 10 days".
 * Uses plain words only (no Latin abbreviations) and ISMP-safe numbers. Patient instructions are appended.
 */
export function formatSig(order: Partial<MedicationOrder>) {
  const route = order.route ? routeByCode.get(order.route) : undefined
  const parts: string[] = [route?.verb ?? "Take"]
  const doseValue = order.dose?.value
  if (doseValue !== undefined && Number.isFinite(doseValue)) parts.push(formatDoseNumber(doseValue))
  if (order.dose?.unit) parts.push(formatDoseUnit(doseValue, order.dose.unit))
  if (route?.sig) parts.push(route.sig)
  const frequency = order.frequency ? formatFrequency({ frequency: order.frequency, customFrequency: order.customFrequency }) : ""
  if (frequency) parts.push(frequency)
  if (order.timing?.withFood) parts.push("with food")
  if (order.asNeeded) parts.push(order.asNeededFor?.trim() ? `as needed for ${order.asNeededFor.trim()}` : "as needed")
  if (order.duration && order.duration.value > 0) {
    const { value, unit } = order.duration
    parts.push(`for ${formatDoseNumber(value)} ${value === 1 ? unit.replace(/s$/, "") : unit}`)
  }
  let sig = parts.join(" ")
  const instructions = order.instructions?.trim()
  if (instructions) sig += `. ${instructions.replace(/\.$/, "")}`
  return `${sig}.`
}

const capitalize = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text)

/** Map a form result to a MedicationList row. */
export function toMedication(order: MedicationOrder, id?: string): Medication {
  const frequency = [formatFrequency(order), order.timing?.withFood ? "with food" : ""].filter(Boolean).join(" ")
  return {
    id: id ?? [order.code ?? order.medication, order.strength, order.frequency].filter(Boolean).join("-"),
    name: order.medication,
    strength: order.strength,
    route: routeByCode.get(order.route)?.label ?? order.route,
    frequency: capitalize(frequency) || undefined,
    prn: order.asNeeded || undefined,
    highAlert: order.highAlert || undefined,
    indication: order.indication || (order.asNeeded ? order.asNeededFor : undefined) || undefined,
    status: "active",
  }
}

// ───────────────────────────── Draft state ─────────────────────────────

interface Draft {
  medication: string
  code?: string
  strength: string
  form: string
  doseValue: string
  doseUnit: string
  route: MedicationRoute | ""
  frequency: FrequencyCode | ""
  customFrequency: string
  withFood: boolean
  asNeeded: boolean
  asNeededFor: string
  durationValue: string
  durationUnit: DurationUnit
  quantity: string
  refills: string
  substitutionAllowed: boolean
  indication: string
  instructions: string
  highAlert: boolean
}

const EMPTY_DRAFT: Draft = {
  medication: "",
  strength: "",
  form: "",
  doseValue: "",
  doseUnit: "tablet",
  route: "oral",
  frequency: "",
  customFrequency: "",
  withFood: false,
  asNeeded: false,
  asNeededFor: "",
  durationValue: "",
  durationUnit: "days",
  quantity: "",
  refills: "",
  substitutionAllowed: true,
  indication: "",
  instructions: "",
  highAlert: false,
}

const str = (n: number | undefined) => (n === undefined ? "" : String(n))

function applyOrder(base: Draft, order: Partial<MedicationOrder>): Draft {
  const next = { ...base }
  if (order.medication !== undefined) next.medication = order.medication
  if ("code" in order) next.code = order.code
  if (order.strength !== undefined) next.strength = order.strength
  if (order.form !== undefined) next.form = order.form
  if (order.dose) {
    next.doseValue = str(order.dose.value)
    next.doseUnit = order.dose.unit
  }
  if (order.route !== undefined) next.route = order.route
  if (order.frequency !== undefined) next.frequency = order.frequency
  if (order.customFrequency !== undefined) next.customFrequency = order.customFrequency
  if (order.timing?.withFood !== undefined) next.withFood = order.timing.withFood
  if (order.asNeeded !== undefined) next.asNeeded = order.asNeeded
  if (order.asNeededFor !== undefined) next.asNeededFor = order.asNeededFor
  if (order.duration) {
    next.durationValue = str(order.duration.value)
    next.durationUnit = order.duration.unit
  }
  if (order.quantity !== undefined) next.quantity = str(order.quantity)
  if (order.refills !== undefined) next.refills = str(order.refills)
  if (order.substitutionAllowed !== undefined) next.substitutionAllowed = order.substitutionAllowed
  if (order.indication !== undefined) next.indication = order.indication
  if (order.instructions !== undefined) next.instructions = order.instructions
  if (order.highAlert !== undefined) next.highAlert = order.highAlert
  return next
}

const parseNumber = (text: string) => {
  if (text.trim() === "") return undefined
  const n = Number(text)
  return Number.isFinite(n) ? n : NaN
}

const defined = (n: number | undefined) => (n === undefined || Number.isNaN(n) ? undefined : n)
const optional = (text: string) => text.trim() || undefined

function toOrder(draft: Draft): MedicationOrder {
  const durationValue = defined(parseNumber(draft.durationValue))
  return {
    medication: draft.medication.trim(),
    code: draft.code,
    strength: optional(draft.strength),
    form: optional(draft.form),
    dose: { value: defined(parseNumber(draft.doseValue)), unit: draft.doseUnit },
    route: (draft.route || "oral") as MedicationRoute,
    frequency: (draft.frequency || "custom") as FrequencyCode,
    customFrequency: draft.frequency === "custom" ? optional(draft.customFrequency) : undefined,
    timing: draft.withFood ? { withFood: true } : undefined,
    asNeeded: draft.asNeeded || undefined,
    asNeededFor: draft.asNeeded ? optional(draft.asNeededFor) : undefined,
    duration: durationValue ? { value: durationValue, unit: draft.durationUnit } : undefined,
    quantity: defined(parseNumber(draft.quantity)),
    refills: defined(parseNumber(draft.refills)),
    substitutionAllowed: draft.substitutionAllowed,
    indication: optional(draft.indication),
    instructions: optional(draft.instructions),
    highAlert: draft.highAlert || undefined,
  }
}

type ErrorKey =
  | "medication"
  | "dose"
  | "route"
  | "frequency"
  | "customFrequency"
  | "asNeededFor"
  | "duration"
  | "quantity"
  | "refills"

function validate(draft: Draft) {
  const errors: Partial<Record<ErrorKey, string>> = {}
  if (!draft.medication.trim()) errors.medication = "Choose or enter a medication"
  const dose = parseNumber(draft.doseValue)
  if (dose === undefined) errors.dose = "Enter a dose"
  else if (Number.isNaN(dose) || dose <= 0) errors.dose = "Dose must be a number greater than 0"
  else if (!draft.doseUnit) errors.dose = "Choose a dose unit"
  if (!draft.route) errors.route = "Choose a route"
  if (!draft.frequency) errors.frequency = "Choose a frequency"
  else if (draft.frequency === "custom" && !draft.customFrequency.trim()) errors.customFrequency = "Describe the frequency"
  if (draft.asNeeded && !draft.asNeededFor.trim()) errors.asNeededFor = "Enter what the as-needed dose is for"
  const duration = parseNumber(draft.durationValue)
  if (duration !== undefined && (Number.isNaN(duration) || duration <= 0)) errors.duration = "Duration must be greater than 0"
  for (const key of ["quantity", "refills"] as const) {
    const n = parseNumber(draft[key])
    if (n !== undefined && (!Number.isInteger(n) || n < 0)) errors[key] = "Use a whole number of 0 or more"
  }
  return errors
}

// ───────────────────────────── Component ─────────────────────────────

export interface MedicationFormProps extends Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue"> {
  defaultValue?: Partial<MedicationOrder>
  onSubmit?: (order: MedicationOrder) => void
  onCancel?: () => void
  /** Quick-pick chips that fill part of the order, e.g. "1 tab PO BID". */
  presets?: MedicationPreset[]
  /** Drug list for the medication combobox. Free text is always allowed. */
  medicationOptions?: MedicationOption[]
  submitLabel?: string
  /** Reset to `defaultValue` after a successful submit (useful for adding several orders). */
  resetOnSubmit?: boolean
}

export function MedicationForm({
  defaultValue,
  onSubmit,
  onCancel,
  presets,
  medicationOptions,
  submitLabel = "Add medication",
  resetOnSubmit = false,
  className,
  ...props
}: MedicationFormProps) {
  const id = React.useId()
  const formRef = React.useRef<HTMLFormElement>(null)
  const initial = React.useMemo(() => applyOrder(EMPTY_DRAFT, defaultValue ?? {}), [defaultValue])
  const [draft, setDraft] = React.useState<Draft>(initial)
  const [submitted, setSubmitted] = React.useState(false)
  const [comboOpen, setComboOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [focusError, setFocusError] = React.useState(0)

  const errors = React.useMemo(() => validate(draft), [draft])
  const order = React.useMemo(() => toOrder(draft), [draft])
  const showError = (key: ErrorKey) => (submitted ? errors[key] : undefined)

  React.useEffect(() => {
    if (!focusError) return
    formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()
  }, [focusError])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((prev) => ({ ...prev, [key]: value }))
  const text = (key: keyof Draft) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(key, event.target.value as never)

  const selectOption = (option: MedicationOption) => {
    setDraft((prev) => {
      const form = DOSE_FORMS.find((f) => f.value === option.form)
      return {
        ...prev,
        medication: option.name,
        code: option.code,
        strength: option.strength ?? "",
        form: option.form ?? "",
        highAlert: Boolean(option.highAlert),
        ...(form ? { doseUnit: form.unit, route: form.route } : {}),
      }
    })
    setComboOpen(false)
    setSearch("")
  }

  const selectFreeText = (name: string) => {
    setDraft((prev) => ({ ...prev, medication: name, code: undefined, highAlert: false }))
    setComboOpen(false)
    setSearch("")
  }

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      setFocusError((n) => n + 1)
      return
    }
    onSubmit?.(order)
    if (resetOnSubmit) {
      setDraft(initial)
      setSubmitted(false)
    }
  }

  const errorProps = (key: ErrorKey) => {
    const message = showError(key)
    return {
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? `${id}-${key}-error` : undefined,
    }
  }
  const error = (key: ErrorKey) => {
    const message = showError(key)
    return message ? <FieldError id={`${id}-${key}-error`}>{message}</FieldError> : null
  }

  const unitOptions = draft.doseUnit && !DOSE_UNITS.includes(draft.doseUnit) ? [draft.doseUnit, ...DOSE_UNITS] : DOSE_UNITS
  const formOptions =
    draft.form && !DOSE_FORMS.some((f) => f.value === draft.form)
      ? [...DOSE_FORMS, { value: draft.form, label: capitalize(draft.form), unit: "", route: "oral" as const }]
      : DOSE_FORMS
  const searchTrimmed = search.trim()
  const exactMatch = medicationOptions?.some((o) => o.name.toLowerCase() === searchTrimmed.toLowerCase())

  return (
    <form
      ref={formRef}
      data-slot="medication-form"
      noValidate
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      {presets && presets.length > 0 && (
        <div className="flex flex-col gap-2">
          <span id={`${id}-presets`} className="text-xs font-medium text-muted-foreground">
            Quick picks
          </span>
          <div role="group" aria-labelledby={`${id}-presets`} className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setDraft((prev) => applyOrder(prev, preset.order))}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field className="sm:col-span-2" data-invalid={Boolean(showError("medication")) || undefined}>
          <FieldLabel htmlFor={`${id}-medication`}>Medication</FieldLabel>
          {medicationOptions ? (
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={`${id}-medication`}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className={cn(
                    "w-full justify-between font-normal",
                    !draft.medication && "text-muted-foreground",
                    showError("medication") && "border-destructive"
                  )}
                  {...errorProps("medication")}
                >
                  <span className="truncate">
                    {draft.medication || "Search medications…"}
                    {draft.medication && draft.strength && (
                      <span className="text-muted-foreground"> {draft.strength}</span>
                    )}
                  </span>
                  <ChevronsUpDown className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search or type a drug name…" value={search} onValueChange={setSearch} />
                  <CommandList>
                    <CommandEmpty>No matches.</CommandEmpty>
                    <CommandGroup>
                      {medicationOptions.map((option) => (
                        <CommandItem
                          key={`${option.name}-${option.strength ?? ""}`}
                          value={`${option.name} ${option.strength ?? ""}`}
                          onSelect={() => selectOption(option)}
                          data-checked={draft.medication === option.name && draft.strength === (option.strength ?? "")}
                        >
                          <Pill className="text-muted-foreground" />
                          <span className="truncate">{option.name}</span>
                          {option.strength && <span className="text-muted-foreground">{option.strength}</span>}
                          {option.highAlert && (
                            <span className="rounded bg-clinical-critical/10 px-1 text-[10px] font-semibold tracking-wide text-clinical-critical-foreground uppercase">
                              High alert
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {searchTrimmed && !exactMatch && (
                      <CommandGroup heading="Free text">
                        <CommandItem forceMount value={`free:${searchTrimmed}`} onSelect={() => selectFreeText(searchTrimmed)}>
                          <Plus className="text-muted-foreground" />
                          Use “{searchTrimmed}”
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <Input
              id={`${id}-medication`}
              autoComplete="off"
              placeholder="e.g. Amoxicillin"
              value={draft.medication}
              onChange={text("medication")}
              {...errorProps("medication")}
            />
          )}
          {error("medication")}
        </Field>

        <div aria-live="polite" className="empty:hidden sm:col-span-2">
          {draft.highAlert && (
            <div className="flex items-start gap-2 rounded-lg border border-clinical-critical/25 bg-clinical-critical/10 px-3 py-2.5 text-sm text-clinical-critical-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                <span className="font-semibold">High-alert medication — double-check dose.</span> Errors with this drug
                carry a higher risk of serious harm (ISMP).
              </p>
            </div>
          )}
        </div>

        <Field>
          <FieldLabel htmlFor={`${id}-strength`}>Strength</FieldLabel>
          <Input
            id={`${id}-strength`}
            autoComplete="off"
            placeholder="e.g. 500 mg"
            value={draft.strength}
            onChange={text("strength")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-form`}>Dose form</FieldLabel>
          <Select
            value={draft.form}
            onValueChange={(value) => {
              const form = DOSE_FORMS.find((f) => f.value === value)
              setDraft((prev) => ({ ...prev, form: value, ...(form ? { doseUnit: form.unit, route: form.route } : {}) }))
            }}
          >
            <SelectTrigger id={`${id}-form`} className="w-full">
              <SelectValue placeholder="Select form" />
            </SelectTrigger>
            <SelectContent>
              {formOptions.map((form) => (
                <SelectItem key={form.value} value={form.value}>
                  {form.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(showError("dose")) || undefined}>
          <FieldLabel htmlFor={`${id}-dose`}>Dose</FieldLabel>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              id={`${id}-dose`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="1"
              className="tabular-nums"
              value={draft.doseValue}
              onChange={text("doseValue")}
              {...errorProps("dose")}
            />
            <Select value={draft.doseUnit} onValueChange={(value) => set("doseUnit", value)}>
              <SelectTrigger aria-label="Dose unit" className="min-w-28">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error("dose")}
        </Field>

        <Field data-invalid={Boolean(showError("route")) || undefined}>
          <FieldLabel htmlFor={`${id}-route`}>Route</FieldLabel>
          <Select value={draft.route} onValueChange={(value) => set("route", value as MedicationRoute)}>
            <SelectTrigger id={`${id}-route`} className="w-full" {...errorProps("route")}>
              <SelectValue placeholder="Select route" />
            </SelectTrigger>
            <SelectContent>
              {ROUTES.map((route) => (
                <SelectItem key={route.code} value={route.code}>
                  {route.label}
                  {route.sig && <span className="text-muted-foreground">({route.sig})</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error("route")}
        </Field>

        <Field data-invalid={Boolean(showError("frequency")) || undefined}>
          <FieldLabel htmlFor={`${id}-frequency`}>Frequency</FieldLabel>
          <Select value={draft.frequency} onValueChange={(value) => set("frequency", value as FrequencyCode)}>
            <SelectTrigger id={`${id}-frequency`} className="w-full" {...errorProps("frequency")}>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((freq) => (
                <SelectItem key={freq.code} value={freq.code}>
                  {freq.label}
                  {freq.abbreviation && (
                    <span className="text-xs text-muted-foreground" aria-hidden>
                      {freq.abbreviation}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error("frequency")}
        </Field>

        <Field orientation="horizontal" className="self-end sm:pb-2">
          <Checkbox
            id={`${id}-withFood`}
            checked={draft.withFood}
            onCheckedChange={(checked) => set("withFood", checked === true)}
          />
          <FieldLabel htmlFor={`${id}-withFood`} className="font-normal">
            Take with food
          </FieldLabel>
        </Field>

        {draft.frequency === "custom" && (
          <Field className="sm:col-span-2" data-invalid={Boolean(showError("customFrequency")) || undefined}>
            <FieldLabel htmlFor={`${id}-customFrequency`}>Custom frequency</FieldLabel>
            <Input
              id={`${id}-customFrequency`}
              autoComplete="off"
              placeholder="e.g. every Monday, Wednesday and Friday"
              value={draft.customFrequency}
              onChange={text("customFrequency")}
              {...errorProps("customFrequency")}
            />
            <FieldDescription>Use plain words, not abbreviations.</FieldDescription>
            {error("customFrequency")}
          </Field>
        )}

        <div className="flex flex-col gap-3 rounded-lg border p-3 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-asNeeded`} className="flex flex-col items-start gap-0.5">
              <span>As needed (PRN)</span>
              <span className="text-xs font-normal text-muted-foreground">Only take when symptoms occur</span>
            </Label>
            <Switch id={`${id}-asNeeded`} checked={draft.asNeeded} onCheckedChange={(checked) => set("asNeeded", checked)} />
          </div>
          {draft.asNeeded && (
            <Field data-invalid={Boolean(showError("asNeededFor")) || undefined}>
              <FieldLabel htmlFor={`${id}-asNeededFor`}>As needed for</FieldLabel>
              <Input
                id={`${id}-asNeededFor`}
                autoComplete="off"
                placeholder="e.g. wheezing, pain, nausea"
                value={draft.asNeededFor}
                onChange={text("asNeededFor")}
                {...errorProps("asNeededFor")}
              />
              {error("asNeededFor")}
            </Field>
          )}
        </div>

        <Field data-invalid={Boolean(showError("duration")) || undefined}>
          <FieldLabel htmlFor={`${id}-duration`}>Duration</FieldLabel>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              id={`${id}-duration`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ongoing"
              className="tabular-nums"
              value={draft.durationValue}
              onChange={text("durationValue")}
              {...errorProps("duration")}
            />
            <Select value={draft.durationUnit} onValueChange={(value) => set("durationUnit", value as DurationUnit)}>
              <SelectTrigger aria-label="Duration unit" className="min-w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">days</SelectItem>
                <SelectItem value="weeks">weeks</SelectItem>
                <SelectItem value="months">months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error("duration")}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={Boolean(showError("quantity")) || undefined}>
            <FieldLabel htmlFor={`${id}-quantity`}>Quantity</FieldLabel>
            <Input
              id={`${id}-quantity`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="30"
              className="tabular-nums"
              value={draft.quantity}
              onChange={text("quantity")}
              {...errorProps("quantity")}
            />
            {error("quantity")}
          </Field>
          <Field data-invalid={Boolean(showError("refills")) || undefined}>
            <FieldLabel htmlFor={`${id}-refills`}>Refills</FieldLabel>
            <Input
              id={`${id}-refills`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              className="tabular-nums"
              value={draft.refills}
              onChange={text("refills")}
              {...errorProps("refills")}
            />
            {error("refills")}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor={`${id}-indication`}>Indication</FieldLabel>
          <Input
            id={`${id}-indication`}
            autoComplete="off"
            placeholder="e.g. hypertension"
            value={draft.indication}
            onChange={text("indication")}
          />
        </Field>
        <Field orientation="horizontal" className="self-end sm:pb-2">
          <Checkbox
            id={`${id}-substitution`}
            checked={draft.substitutionAllowed}
            onCheckedChange={(checked) => set("substitutionAllowed", checked === true)}
          />
          <FieldLabel htmlFor={`${id}-substitution`} className="font-normal">
            Allow generic substitution
          </FieldLabel>
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`${id}-instructions`}>Patient instructions</FieldLabel>
          <Textarea
            id={`${id}-instructions`}
            rows={2}
            placeholder="e.g. Do not crush or chew."
            value={draft.instructions}
            onChange={text("instructions")}
          />
        </Field>

        <Field orientation="horizontal" className="sm:col-span-2">
          <Checkbox
            id={`${id}-highAlert`}
            checked={draft.highAlert}
            onCheckedChange={(checked) => set("highAlert", checked === true)}
          />
          <FieldLabel htmlFor={`${id}-highAlert`} className="font-normal">
            Flag as high-alert medication
          </FieldLabel>
        </Field>
      </div>

      <div className="flex flex-col gap-1 rounded-lg bg-muted/60 px-4 py-3">
        <span id={`${id}-sig-label`} className="text-xs text-muted-foreground">
          Sig preview
        </span>
        <p aria-labelledby={`${id}-sig-label`} aria-live="polite" className="text-sm font-medium">
          {draft.medication ? (
            <>
              <span className="text-muted-foreground">
                {[draft.medication, draft.strength].filter(Boolean).join(" ")}:{" "}
              </span>
              {formatSig(order)}
            </>
          ) : (
            <span className="font-normal text-muted-foreground">Choose a medication to preview the directions.</span>
          )}
        </p>
        {draft.medication && (order.quantity !== undefined || order.refills !== undefined || !draft.substitutionAllowed) && (
          <p className="text-xs text-muted-foreground">
            {[
              order.quantity !== undefined && `Dispense ${formatDoseNumber(order.quantity)}`,
              order.refills !== undefined && `${order.refills} ${order.refills === 1 ? "refill" : "refills"}`,
              !draft.substitutionAllowed && "Dispense as written",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
