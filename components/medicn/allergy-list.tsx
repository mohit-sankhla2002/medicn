"use client"

import * as React from "react"
import {
  AlertTriangle,
  Apple,
  ChevronDown,
  ChevronsUpDown,
  CircleCheck,
  CircleHelp,
  Leaf,
  MoreHorizontal,
  Pencil,
  Pill,
  Plus,
  ShieldAlert,
  Syringe,
  Trash2,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

// ───────────────────────────── Types (FHIR R4 AllergyIntolerance) ─────────────────────────────

export type AllergyType = "allergy" | "intolerance"
export type AllergyCategory = "food" | "medication" | "environment" | "biologic"
export type AllergyCriticality = "low" | "high" | "unable-to-assess"
export type AllergyClinicalStatus = "active" | "inactive" | "resolved"
export type AllergyVerificationStatus = "unconfirmed" | "confirmed" | "refuted" | "entered-in-error"
export type AllergyReactionSeverity = "mild" | "moderate" | "severe"

export interface AllergyReaction {
  /** Clinical symptom/sign, e.g. "Hives". Maps to `reaction.manifestation`. */
  manifestation: string
  severity?: AllergyReactionSeverity
}

export interface Allergy {
  id: string
  /** Substance display, e.g. "Penicillin". Maps to `code.text`. */
  substance: string
  /** Optional RxNorm / SNOMED CT code for the substance. */
  code?: string
  type?: AllergyType
  category?: AllergyCategory
  criticality?: AllergyCriticality
  /** Defaults to "active". */
  clinicalStatus?: AllergyClinicalStatus
  verificationStatus?: AllergyVerificationStatus
  reactions?: AllergyReaction[]
  /** Pre-formatted onset, e.g. "2012" or "Childhood". */
  onset?: string
  /** Pre-formatted date the entry was recorded. */
  recordedDate?: string
  note?: string
}

export const ALLERGY_CATEGORY_LABELS: Record<AllergyCategory, string> = {
  food: "Food",
  medication: "Medication",
  environment: "Environment",
  biologic: "Biologic",
}

export const ALLERGY_CRITICALITY_LABELS: Record<AllergyCriticality, string> = {
  low: "Low criticality",
  high: "High criticality",
  "unable-to-assess": "Criticality unknown",
}

export const ALLERGY_CLINICAL_STATUS_LABELS: Record<AllergyClinicalStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  resolved: "Resolved",
}

export const ALLERGY_VERIFICATION_LABELS: Record<AllergyVerificationStatus, string> = {
  unconfirmed: "Unconfirmed",
  confirmed: "Confirmed",
  refuted: "Refuted",
  "entered-in-error": "Entered in error",
}

export const ALLERGY_SEVERITY_LABELS: Record<AllergyReactionSeverity, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
}

export const COMMON_MANIFESTATIONS = ["Rash", "Hives", "Anaphylaxis", "Angioedema", "Nausea", "Wheezing"]

const criticalityTone: Record<AllergyCriticality, ClinicalStatus> = {
  high: "critical",
  "unable-to-assess": "watch",
  low: "unknown",
}

const categoryIcons: Record<AllergyCategory, React.ComponentType<{ className?: string }>> = {
  food: Apple,
  medication: Pill,
  environment: Leaf,
  biologic: Syringe,
}

const criticalityRank: Record<AllergyCriticality | "none", number> = {
  high: 0,
  "unable-to-assess": 1,
  none: 2,
  low: 3,
}

const severityRank: Record<AllergyReactionSeverity, number> = { severe: 0, moderate: 1, mild: 2 }

// ───────────────────────────── Helpers ─────────────────────────────

/** Active = clinically active and not refuted / entered in error. */
export function isAllergyActive(allergy: Allergy) {
  const status = allergy.clinicalStatus ?? "active"
  return (
    status === "active" && allergy.verificationStatus !== "refuted" && allergy.verificationStatus !== "entered-in-error"
  )
}

function worstSeverity(allergy: Allergy) {
  return Math.min(3, ...(allergy.reactions ?? []).map((r) => (r.severity ? severityRank[r.severity] : 3)))
}

/** Sort high-criticality first, then by worst reaction severity, then alphabetically. */
export function sortAllergies(allergies: Allergy[]) {
  return [...allergies].sort(
    (a, b) =>
      criticalityRank[a.criticality ?? "none"] - criticalityRank[b.criticality ?? "none"] ||
      worstSeverity(a) - worstSeverity(b) ||
      a.substance.localeCompare(b.substance)
  )
}

/** Human-readable reaction summary, e.g. "Anaphylaxis (severe), Hives (mild)". */
export function formatReactions(reactions: AllergyReaction[] | undefined) {
  return (reactions ?? [])
    .filter((r) => r.manifestation.trim())
    .map((r) => (r.severity ? `${r.manifestation} (${r.severity})` : r.manifestation))
    .join(", ")
}

/**
 * Map to the `PatientHeader` allergy shape. Returns `[]` for "no known allergies" and `undefined`
 * when allergy status has not been recorded, matching PatientHeader's NKDA / "Not recorded" states.
 */
export function toPatientAllergies(allergies: Allergy[] | undefined, noKnownAllergies?: boolean) {
  const active = sortAllergies((allergies ?? []).filter(isAllergyActive))
  if (active.length === 0) return noKnownAllergies ? [] : undefined
  return active.map((a) => {
    const worst = worstSeverity(a)
    const severity = (["severe", "moderate", "mild"] as const)[worst]
    return { substance: a.substance, reaction: formatReactions(a.reactions) || undefined, severity }
  })
}

function createId() {
  return `allergy-${Math.random().toString(36).slice(2, 10)}`
}

// ───────────────────────────── Substance combobox ─────────────────────────────

function SubstanceCombobox({
  id,
  labelId,
  value,
  onValueChange,
  suggestions,
  invalid,
  describedBy,
}: {
  id: string
  labelId: string
  value: string
  onValueChange: (value: string) => void
  suggestions: string[]
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const trimmed = query.trim()
  const exact = suggestions.some((s) => s.toLowerCase() === trimmed.toLowerCase())

  const select = (next: string) => {
    onValueChange(next)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-labelledby={`${labelId} ${id}-value`}
          aria-describedby={describedBy}
          className="w-full justify-between font-normal"
        >
          <span id={`${id}-value`} className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Search or type a substance…"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search substances…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Type to add a substance.</CommandEmpty>
            {trimmed && !exact && (
              <CommandGroup>
                <CommandItem value={`__free__ ${trimmed}`} onSelect={() => select(trimmed)}>
                  <Plus />
                  Use “{trimmed}”
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Suggestions">
              {suggestions.map((s) => (
                <CommandItem key={s} value={s} data-checked={s === value} onSelect={() => select(s)}>
                  {s}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ───────────────────────────── AllergyForm ─────────────────────────────

export interface AllergyFormProps extends Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue"> {
  /** Existing allergy to edit. Its `id` is kept on submit. */
  defaultValue?: Partial<Allergy>
  /** Substance suggestions for the combobox. Free text is always allowed. */
  suggestions?: string[]
  onSubmit: (allergy: Allergy) => void
  onCancel?: () => void
  submitLabel?: React.ReactNode
}

type ReactionDraft = { key: string; manifestation: string; severity?: AllergyReactionSeverity }

const NONE = "__none__"

export function AllergyForm({
  defaultValue,
  suggestions,
  onSubmit,
  onCancel,
  submitLabel = "Save allergy",
  className,
  ...props
}: AllergyFormProps) {
  const id = React.useId()
  const keyCounter = React.useRef(0)
  const nextKey = () => `r${keyCounter.current++}`

  const [substance, setSubstance] = React.useState(defaultValue?.substance ?? "")
  const [code, setCode] = React.useState(defaultValue?.code ?? "")
  const [type, setType] = React.useState<AllergyType>(defaultValue?.type ?? "allergy")
  const [category, setCategory] = React.useState<AllergyCategory | undefined>(defaultValue?.category)
  const [criticality, setCriticality] = React.useState<AllergyCriticality | undefined>(defaultValue?.criticality)
  const [clinicalStatus, setClinicalStatus] = React.useState<AllergyClinicalStatus>(
    defaultValue?.clinicalStatus ?? "active"
  )
  const [verification, setVerification] = React.useState<AllergyVerificationStatus>(
    defaultValue?.verificationStatus ?? "confirmed"
  )
  const [reactions, setReactions] = React.useState<ReactionDraft[]>(() =>
    (defaultValue?.reactions ?? []).map((r, i) => ({ key: `init${i}`, ...r }))
  )
  const [onset, setOnset] = React.useState(defaultValue?.onset ?? "")
  const [note, setNote] = React.useState(defaultValue?.note ?? "")
  const [submitted, setSubmitted] = React.useState(false)

  const substanceError = submitted && !substance.trim() ? "Enter the substance." : undefined
  const filledReactions = reactions.filter((r) => r.manifestation.trim())

  const updateReaction = (key: string, patch: Partial<ReactionDraft>) =>
    setReactions((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const toggleManifestation = (label: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.manifestation.trim().toLowerCase() === label.toLowerCase())
      if (existing) return prev.filter((r) => r !== existing)
      const empty = prev.find((r) => !r.manifestation.trim())
      if (empty) return prev.map((r) => (r === empty ? { ...r, manifestation: label } : r))
      return [...prev, { key: nextKey(), manifestation: label }]
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!substance.trim()) {
      document.getElementById(`${id}-substance`)?.focus()
      return
    }
    onSubmit({
      ...defaultValue,
      id: defaultValue?.id ?? createId(),
      substance: substance.trim(),
      code: code.trim() || undefined,
      type,
      category,
      criticality,
      clinicalStatus,
      verificationStatus: verification,
      reactions: filledReactions.map(({ manifestation, severity }) => ({
        manifestation: manifestation.trim(),
        severity,
      })),
      onset: onset.trim() || undefined,
      note: note.trim() || undefined,
    })
  }

  return (
    <form
      data-slot="allergy-form"
      noValidate
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <Field data-invalid={!!substanceError || undefined}>
          <FieldLabel id={`${id}-substance-label`} htmlFor={`${id}-substance`}>
            Substance <span aria-hidden>*</span>
          </FieldLabel>
          {suggestions && suggestions.length > 0 ? (
            <SubstanceCombobox
              id={`${id}-substance`}
              labelId={`${id}-substance-label`}
              value={substance}
              onValueChange={setSubstance}
              suggestions={suggestions}
              invalid={!!substanceError}
              describedBy={substanceError ? `${id}-substance-error` : undefined}
            />
          ) : (
            <Input
              id={`${id}-substance`}
              value={substance}
              onChange={(e) => setSubstance(e.target.value)}
              placeholder="e.g. Penicillin"
              required
              aria-invalid={!!substanceError || undefined}
              aria-describedby={substanceError ? `${id}-substance-error` : undefined}
            />
          )}
          <div aria-live="polite">
            {substanceError && <FieldError id={`${id}-substance-error`}>{substanceError}</FieldError>}
          </div>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-category`}>Category</FieldLabel>
            <Select
              value={category ?? NONE}
              onValueChange={(v) => setCategory(v === NONE ? undefined : (v as AllergyCategory))}
            >
              <SelectTrigger id={`${id}-category`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not specified</SelectItem>
                {(Object.keys(ALLERGY_CATEGORY_LABELS) as AllergyCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {ALLERGY_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-code`}>Code</FieldLabel>
            <Input
              id={`${id}-code`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="RxNorm / SNOMED CT"
              className="font-mono"
            />
          </Field>
        </div>

        <FieldSet>
          <FieldLegend variant="label">Type</FieldLegend>
          <RadioGroup value={type} onValueChange={(v) => setType(v as AllergyType)} className="flex flex-wrap gap-4">
            {(["allergy", "intolerance"] as const).map((t) => (
              <Field key={t} orientation="horizontal" className="w-auto">
                <RadioGroupItem value={t} id={`${id}-type-${t}`} />
                <FieldLabel htmlFor={`${id}-type-${t}`} className="font-normal">
                  {t === "allergy" ? "Allergy" : "Intolerance"}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
          <FieldDescription>Intolerance: non-immune adverse reaction (e.g. GI upset).</FieldDescription>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Criticality</FieldLegend>
          <RadioGroup
            value={criticality ?? ""}
            onValueChange={(v) => setCriticality(v as AllergyCriticality)}
            className="flex flex-wrap gap-4"
          >
            {(["low", "high", "unable-to-assess"] as const).map((c) => (
              <Field key={c} orientation="horizontal" className="w-auto">
                <RadioGroupItem value={c} id={`${id}-crit-${c}`} />
                <FieldLabel htmlFor={`${id}-crit-${c}`} className="font-normal">
                  {c === "low" ? "Low" : c === "high" ? "High" : "Unable to assess"}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
          <FieldDescription>Potential for a future life-threatening reaction.</FieldDescription>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Reactions</FieldLegend>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common reactions">
            {COMMON_MANIFESTATIONS.map((m) => {
              const pressed = reactions.some((r) => r.manifestation.trim().toLowerCase() === m.toLowerCase())
              return (
                <Button
                  key={m}
                  type="button"
                  size="xs"
                  variant={pressed ? "secondary" : "outline"}
                  aria-pressed={pressed}
                  onClick={() => toggleManifestation(m)}
                  className="rounded-full"
                >
                  {pressed ? <X /> : <Plus />}
                  {m}
                </Button>
              )
            })}
          </div>
          {reactions.length > 0 && (
            <ul className="flex flex-col gap-2">
              {reactions.map((r, index) => (
                <li key={r.key} className="flex items-center gap-2">
                  <Label htmlFor={`${id}-${r.key}-m`} className="sr-only">
                    Reaction {index + 1} manifestation
                  </Label>
                  <Input
                    id={`${id}-${r.key}-m`}
                    value={r.manifestation}
                    onChange={(e) => updateReaction(r.key, { manifestation: e.target.value })}
                    placeholder="Manifestation"
                    className="min-w-0 flex-1"
                  />
                  <Select
                    value={r.severity ?? NONE}
                    onValueChange={(v) =>
                      updateReaction(r.key, { severity: v === NONE ? undefined : (v as AllergyReactionSeverity) })
                    }
                  >
                    <SelectTrigger className="w-32" aria-label={`Reaction ${index + 1} severity`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Severity…</SelectItem>
                      {(["mild", "moderate", "severe"] as const).map((s) => (
                        <SelectItem key={s} value={s}>
                          {ALLERGY_SEVERITY_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove reaction ${index + 1}`}
                    onClick={() => setReactions((prev) => prev.filter((x) => x.key !== r.key))}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setReactions((prev) => [...prev, { key: nextKey(), manifestation: "" }])}
          >
            <Plus />
            Add reaction
          </Button>
          <div aria-live="polite">
            {filledReactions.length === 0 && (substance.trim() || submitted) && (
              <p className="flex items-start gap-1.5 rounded-md border border-clinical-watch/25 bg-clinical-watch/10 px-2.5 py-1.5 text-xs text-clinical-watch-foreground">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                Warning: no reaction recorded. Documenting the reaction is recommended.
              </p>
            )}
          </div>
        </FieldSet>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-onset`}>Onset</FieldLabel>
            <Input
              id={`${id}-onset`}
              value={onset}
              onChange={(e) => setOnset(e.target.value)}
              placeholder="e.g. 2012 or Childhood"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-verification`}>Verification</FieldLabel>
            <Select value={verification} onValueChange={(v) => setVerification(v as AllergyVerificationStatus)}>
              <SelectTrigger id={`${id}-verification`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ALLERGY_VERIFICATION_LABELS) as AllergyVerificationStatus[]).map((v) => (
                  <SelectItem key={v} value={v}>
                    {ALLERGY_VERIFICATION_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-status`}>Clinical status</FieldLabel>
            <Select value={clinicalStatus} onValueChange={(v) => setClinicalStatus(v as AllergyClinicalStatus)}>
              <SelectTrigger id={`${id}-status`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ALLERGY_CLINICAL_STATUS_LABELS) as AllergyClinicalStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {ALLERGY_CLINICAL_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor={`${id}-note`}>Note</FieldLabel>
          <Textarea id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </Field>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

// ───────────────────────────── AllergyList ─────────────────────────────

export interface AllergyListProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Controlled allergies. `undefined` (with no default) means allergy status is not recorded. */
  allergies?: Allergy[]
  defaultAllergies?: Allergy[]
  onAllergiesChange?: (allergies: Allergy[]) => void
  /** Patient has no known allergies (NKA). Cleared automatically when an allergy is added. */
  noKnownAllergies?: boolean
  defaultNoKnownAllergies?: boolean
  onNoKnownAllergiesChange?: (noKnownAllergies: boolean) => void
  /** Hide add / edit / remove controls and the NKA toggle. */
  readOnly?: boolean
  /** Substance suggestions for the add/edit form combobox. */
  suggestions?: string[]
  title?: React.ReactNode
}

export function AllergyList({
  allergies: allergiesProp,
  defaultAllergies,
  onAllergiesChange,
  noKnownAllergies: nkaProp,
  defaultNoKnownAllergies = false,
  onNoKnownAllergiesChange,
  readOnly = false,
  suggestions,
  title = "Allergies & intolerances",
  className,
  ...props
}: AllergyListProps) {
  const id = React.useId()
  const [internalAllergies, setInternalAllergies] = React.useState<Allergy[] | undefined>(defaultAllergies)
  const [internalNka, setInternalNka] = React.useState(defaultNoKnownAllergies)
  const allergies = allergiesProp !== undefined ? allergiesProp : internalAllergies
  const nka = nkaProp !== undefined ? nkaProp : internalNka

  const [editing, setEditing] = React.useState<Allergy | "new" | null>(null)
  const [removing, setRemoving] = React.useState<Allergy | null>(null)
  const [inactiveOpen, setInactiveOpen] = React.useState(false)

  const setAllergies = (next: Allergy[]) => {
    setInternalAllergies(next)
    onAllergiesChange?.(next)
  }
  const setNka = (next: boolean) => {
    setInternalNka(next)
    onNoKnownAllergiesChange?.(next)
  }

  const active = sortAllergies((allergies ?? []).filter(isAllergyActive))
  const inactive = sortAllergies((allergies ?? []).filter((a) => !isAllergyActive(a)))

  const save = (allergy: Allergy) => {
    const list = allergies ?? []
    const exists = list.some((a) => a.id === allergy.id)
    setAllergies(exists ? list.map((a) => (a.id === allergy.id ? allergy : a)) : [...list, allergy])
    if (isAllergyActive(allergy) && nka) setNka(false)
    setEditing(null)
  }

  const renderRow = (allergy: Allergy) => {
    const isActive = isAllergyActive(allergy)
    const Icon = allergy.category ? categoryIcons[allergy.category] : ShieldAlert
    const high = isActive && allergy.criticality === "high"
    const reactions = (allergy.reactions ?? []).filter((r) => r.manifestation.trim())
    const status = allergy.clinicalStatus ?? "active"
    const struck = allergy.verificationStatus === "entered-in-error" || allergy.verificationStatus === "refuted"

    return (
      <li key={allergy.id} data-criticality={allergy.criticality} className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
            high ? "bg-clinical-critical/10 text-clinical-critical-foreground" : "bg-primary/10 text-primary",
            !isActive && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" />
          <span className="sr-only">
            {allergy.category ? ALLERGY_CATEGORY_LABELS[allergy.category] : "Uncategorised"}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn("font-medium", !isActive && "text-muted-foreground", struck && "line-through")}>
              {allergy.substance}
            </span>
            {allergy.type === "intolerance" && (
              <span className="rounded border px-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Intolerance
              </span>
            )}
            {allergy.verificationStatus && allergy.verificationStatus !== "confirmed" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded border border-dashed px-1 text-[10px] font-semibold tracking-wide uppercase",
                  allergy.verificationStatus === "unconfirmed"
                    ? "border-clinical-watch/40 text-clinical-watch-foreground"
                    : "text-muted-foreground"
                )}
              >
                {allergy.verificationStatus === "unconfirmed" && <CircleHelp className="size-3" />}
                {ALLERGY_VERIFICATION_LABELS[allergy.verificationStatus]}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {reactions.length > 0 ? (
              reactions.map((r, i) => (
                <React.Fragment key={i}>
                  {i > 0 && ", "}
                  <span
                    className={cn(
                      isActive && r.severity === "severe" && "font-medium text-clinical-critical-foreground"
                    )}
                  >
                    {r.manifestation}
                  </span>
                  {r.severity && <span> ({r.severity})</span>}
                </React.Fragment>
              ))
            ) : (
              <span className="italic">Reaction not recorded</span>
            )}
          </p>
          {(allergy.category || allergy.onset || allergy.recordedDate || status !== "active" || allergy.code) && (
            <p className="text-xs text-muted-foreground">
              {[
                allergy.category && ALLERGY_CATEGORY_LABELS[allergy.category],
                allergy.onset && `onset ${allergy.onset}`,
                status !== "active" && ALLERGY_CLINICAL_STATUS_LABELS[status],
                allergy.recordedDate && `recorded ${allergy.recordedDate}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              {allergy.code && <span className="ml-1 font-mono">· {allergy.code}</span>}
            </p>
          )}
          {allergy.note && <p className="text-xs text-muted-foreground italic">{allergy.note}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {allergy.criticality && (
            <ClinicalStatusBadge
              status={isActive ? criticalityTone[allergy.criticality] : "unknown"}
              dot={allergy.criticality === "high"}
            >
              {allergy.criticality === "high" ? "High" : allergy.criticality === "low" ? "Low" : "Unknown"}
              <span className="sr-only"> criticality</span>
            </ClinicalStatusBadge>
          )}
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${allergy.substance}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(allergy)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(allergy)}>
                  <Trash2 />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </li>
    )
  }

  const highCount = active.filter((a) => a.criticality === "high").length

  return (
    <div data-slot="allergy-list" className={cn("overflow-hidden rounded-xl border bg-card", className)} {...props}>
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <ShieldAlert className="size-4 text-muted-foreground" />
        <h3 id={`${id}-title`} className="text-sm font-semibold">
          {title}
        </h3>
        {active.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {active.length} active{highCount > 0 && ` · ${highCount} high criticality`}
          </span>
        )}
        {!readOnly && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setEditing("new")}>
            <Plus />
            Add allergy
          </Button>
        )}
      </div>

      {active.length > 0 ? (
        <ul role="list" aria-labelledby={`${id}-title`} className="divide-y">
          {active.map(renderRow)}
        </ul>
      ) : nka ? (
        <div className="flex flex-wrap items-center gap-3 p-4">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-clinical-normal/25 bg-clinical-normal/10 px-2.5 text-sm font-medium text-clinical-normal-foreground">
            <CircleCheck className="size-3.5" />
            No known allergies
          </span>
          <span className="text-xs text-muted-foreground">
            NKA confirmed — no drug, food or environmental allergies.
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-clinical-watch-foreground" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">Allergies not recorded</span>
            <span className="text-xs text-muted-foreground">
              {inactive.length > 0 ? "No active allergies. " : ""}
              {readOnly
                ? "Allergy status has not been verified for this patient."
                : "Add an allergy or confirm the patient has no known allergies."}
            </span>
          </div>
        </div>
      )}

      {!readOnly && active.length === 0 && (
        <div className="flex items-center gap-2 border-t px-4 py-3">
          <Switch id={`${id}-nka`} checked={nka} onCheckedChange={setNka} />
          <Label htmlFor={`${id}-nka`} className="font-normal">
            No known allergies (NKA)
          </Label>
        </div>
      )}

      {inactive.length > 0 && (
        <Collapsible open={inactiveOpen} onOpenChange={setInactiveOpen} className="border-t">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform motion-reduce:transition-none",
                  !inactiveOpen && "-rotate-90"
                )}
              />
              Inactive ({inactive.length})
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul role="list" aria-label="Inactive allergies" className="divide-y border-t bg-muted/20">
              {inactive.map(renderRow)}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add allergy" : "Edit allergy"}</DialogTitle>
            <DialogDescription>Record the substance, reactions and how certain the allergy is.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <AllergyForm
              key={editing === "new" ? "new" : editing.id}
              defaultValue={editing === "new" ? undefined : editing}
              suggestions={suggestions}
              onSubmit={save}
              onCancel={() => setEditing(null)}
              submitLabel={editing === "new" ? "Add allergy" : "Save changes"}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.substance}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the entry from the allergy list. If the allergy no longer applies, consider editing its
              clinical status to inactive or resolved instead so the history is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (removing) setAllergies((allergies ?? []).filter((a) => a.id !== removing.id))
                setRemoving(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
