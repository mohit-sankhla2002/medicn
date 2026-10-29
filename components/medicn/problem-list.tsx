"use client"

import * as React from "react"
import {
  CircleCheck,
  ChevronsUpDown,
  ClipboardList,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  StarOff,
  Trash2,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

// ───────────────────────────── Types (FHIR R4 Condition) ─────────────────────────────

export type ProblemClinicalStatus = "active" | "recurrence" | "relapse" | "inactive" | "remission" | "resolved"
export type ProblemVerificationStatus =
  "unconfirmed" | "provisional" | "differential" | "confirmed" | "refuted" | "entered-in-error"
export type ProblemCategory = "problem-list-item" | "encounter-diagnosis"
export type ProblemSeverity = "mild" | "moderate" | "severe"
export type ProblemCodeSystem = "ICD-10-CM" | "SNOMED CT" | (string & {})

export interface ProblemCode {
  system: ProblemCodeSystem
  code: string
}

export interface Problem {
  id: string
  /** Diagnosis display text. Maps to `code.text`. */
  display: string
  code?: ProblemCode
  clinicalStatus: ProblemClinicalStatus
  verificationStatus?: ProblemVerificationStatus
  category?: ProblemCategory
  severity?: ProblemSeverity
  /** ISO date ("2019-03-14"), year-month ("2019-03"), year ("2019") or free text. */
  onset?: string
  /** Resolution date, same formats as `onset`. */
  abatement?: string
  recordedDate?: string
  note?: string
  /** Pinned / chief problem, sorted to the top. */
  priority?: boolean
}

/** A coded diagnosis returned by `searchCodes`. */
export interface ProblemCodeResult {
  display: string
  code: ProblemCode
}

export type ProblemCodeSearch = (query: string) => Promise<ProblemCodeResult[]> | ProblemCodeResult[]

export type ProblemFilter = "active" | "resolved" | "all"

export const PROBLEM_STATUS_LABELS: Record<ProblemClinicalStatus, string> = {
  active: "Active",
  recurrence: "Recurrence",
  relapse: "Relapse",
  inactive: "Inactive",
  remission: "In remission",
  resolved: "Resolved",
}

export const PROBLEM_VERIFICATION_LABELS: Record<ProblemVerificationStatus, string> = {
  unconfirmed: "Unconfirmed",
  provisional: "Provisional",
  differential: "Differential",
  confirmed: "Confirmed",
  refuted: "Refuted",
  "entered-in-error": "Entered in error",
}

export const PROBLEM_CATEGORY_LABELS: Record<ProblemCategory, string> = {
  "problem-list-item": "Problem list item",
  "encounter-diagnosis": "Encounter diagnosis",
}

export const PROBLEM_SEVERITY_LABELS: Record<ProblemSeverity, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
}

const statusTone: Record<ProblemClinicalStatus, ClinicalStatus> = {
  active: "info",
  recurrence: "abnormal",
  relapse: "abnormal",
  inactive: "unknown",
  remission: "normal",
  resolved: "unknown",
}

const severityTone: Record<ProblemSeverity, ClinicalStatus> = {
  mild: "watch",
  moderate: "abnormal",
  severe: "critical",
}

const ACTIVE_STATUSES: ProblemClinicalStatus[] = ["active", "recurrence", "relapse"]
const RESOLVED_STATUSES: ProblemClinicalStatus[] = ["inactive", "remission", "resolved"]

// ───────────────────────────── Helpers ─────────────────────────────

function isVoided(problem: Problem) {
  return problem.verificationStatus === "refuted" || problem.verificationStatus === "entered-in-error"
}

/** Active = active / recurrence / relapse and not refuted or entered in error. */
export function isProblemActive(problem: Problem) {
  return ACTIVE_STATUSES.includes(problem.clinicalStatus) && !isVoided(problem)
}

/** Resolved = inactive / remission / resolved and not refuted or entered in error. */
export function isProblemResolved(problem: Problem) {
  return RESOLVED_STATUSES.includes(problem.clinicalStatus) && !isVoided(problem)
}

export function filterProblems(problems: Problem[], filter: ProblemFilter) {
  if (filter === "active") return problems.filter(isProblemActive)
  if (filter === "resolved") return problems.filter(isProblemResolved)
  return problems
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2019-03-14" → "Mar 2019", "2019" → "2019"; other strings pass through. Timezone-safe (no Date parsing). */
export function formatProblemDate(value: string | undefined) {
  if (!value) return undefined
  const match = /^(\d{4})(?:-(\d{2}))?(?:-\d{2})?$/.exec(value)
  if (!match) return value
  const month = match[2] ? MONTHS[Number(match[2]) - 1] : undefined
  return month ? `${month} ${match[1]}` : match[1]
}

function sortProblems(problems: Problem[]) {
  return problems
    .map((p, i) => [p, i] as const)
    .sort(([a, ai], [b, bi]) => Number(!!b.priority) - Number(!!a.priority) || ai - bi)
    .map(([p]) => p)
}

function createId() {
  return `problem-${Math.random().toString(36).slice(2, 10)}`
}

// ───────────────────────────── Diagnosis combobox ─────────────────────────────

function DiagnosisCombobox({
  id,
  labelId,
  value,
  code,
  searchCodes,
  onSelect,
  invalid,
  describedBy,
}: {
  id: string
  labelId: string
  value: string
  code?: ProblemCode
  searchCodes: ProblemCodeSearch
  onSelect: (display: string, code?: ProblemCode) => void
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<ProblemCodeResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)
  const requestId = React.useRef(0)
  const trimmed = query.trim()

  React.useEffect(() => {
    if (!trimmed) return
    const current = ++requestId.current
    const timeout = setTimeout(() => {
      setLoading(true)
      setError(false)
      Promise.resolve()
        .then(() => searchCodes(trimmed))
        .then(
          (next) => {
            if (current !== requestId.current) return
            setResults(next)
            setLoading(false)
          },
          () => {
            if (current !== requestId.current) return
            setResults([])
            setError(true)
            setLoading(false)
          }
        )
    }, 200)
    return () => clearTimeout(timeout)
  }, [trimmed, searchCodes])

  const handleQueryChange = (next: string) => {
    setQuery(next)
    if (!next.trim()) {
      requestId.current++
      setResults([])
      setLoading(false)
      setError(false)
    }
  }

  const select = (display: string, nextCode?: ProblemCode) => {
    onSelect(display, nextCode)
    setOpen(false)
    handleQueryChange("")
  }

  const announcement = !trimmed
    ? ""
    : loading
      ? "Searching diagnoses…"
      : error
        ? "Search failed. You can still use free text."
        : `${results.length} ${results.length === 1 ? "diagnosis" : "diagnoses"} found`

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
          className="h-auto min-h-8 w-full justify-between py-1.5 font-normal"
        >
          <span id={`${id}-value`} className={cn("flex min-w-0 items-center gap-2", !value && "text-muted-foreground")}>
            <span className="truncate">{value || "Search diagnoses or type free text…"}</span>
            {value && code && (
              <span className="shrink-0 rounded border bg-muted px-1 font-mono text-[11px] text-muted-foreground">
                {code.code}
              </span>
            )}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by name or code…" value={query} onValueChange={handleQueryChange} />
          <CommandList>
            <span className="sr-only" aria-live="polite" role="status">
              {announcement}
            </span>
            {!trimmed && <CommandEmpty>Start typing to search.</CommandEmpty>}
            {trimmed && (
              <CommandGroup>
                <CommandItem value={`__free__ ${trimmed}`} onSelect={() => select(trimmed)}>
                  <Plus />
                  <span className="truncate">Use “{trimmed}”</span>
                  <span className="ml-auto text-xs text-muted-foreground">no code</span>
                </CommandItem>
              </CommandGroup>
            )}
            {trimmed && loading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground" aria-hidden>
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                Searching…
              </div>
            )}
            {trimmed && !loading && error && (
              <p className="px-3 py-2 text-sm text-destructive">Search failed. Use free text or try again.</p>
            )}
            {trimmed && !loading && !error && results.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No coded matches.</p>
            )}
            {!loading && results.length > 0 && (
              <CommandGroup heading="Diagnoses">
                {results.map((r) => (
                  <CommandItem
                    key={`${r.code.system}:${r.code.code}`}
                    value={`${r.code.system}:${r.code.code}`}
                    onSelect={() => select(r.display, r.code)}
                  >
                    <span className="min-w-0 flex-1 truncate">{r.display}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      <span className="sr-only">{r.code.system} </span>
                      {r.code.code}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ───────────────────────────── ProblemForm ─────────────────────────────

export interface ProblemFormProps extends Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue"> {
  /** Existing problem to edit. Its `id` is kept on submit. */
  defaultValue?: Partial<Problem>
  /** Diagnosis lookup (sync or async). Without it the diagnosis is a plain text input. */
  searchCodes?: ProblemCodeSearch
  onSubmit: (problem: Problem) => void
  onCancel?: () => void
  submitLabel?: React.ReactNode
}

const NONE = "__none__"

export function ProblemForm({
  defaultValue,
  searchCodes,
  onSubmit,
  onCancel,
  submitLabel = "Save problem",
  className,
  ...props
}: ProblemFormProps) {
  const id = React.useId()
  const [display, setDisplay] = React.useState(defaultValue?.display ?? "")
  const [codeSystem, setCodeSystem] = React.useState<string>(defaultValue?.code?.system ?? "ICD-10-CM")
  const [code, setCode] = React.useState(defaultValue?.code?.code ?? "")
  const [clinicalStatus, setClinicalStatus] = React.useState<ProblemClinicalStatus>(
    defaultValue?.clinicalStatus ?? "active"
  )
  const [verification, setVerification] = React.useState<ProblemVerificationStatus>(
    defaultValue?.verificationStatus ?? "confirmed"
  )
  const [category, setCategory] = React.useState<ProblemCategory>(defaultValue?.category ?? "problem-list-item")
  const [severity, setSeverity] = React.useState<ProblemSeverity | undefined>(defaultValue?.severity)
  const [onset, setOnset] = React.useState(defaultValue?.onset ?? "")
  const [abatement, setAbatement] = React.useState(defaultValue?.abatement ?? "")
  const [note, setNote] = React.useState(defaultValue?.note ?? "")
  const [priority, setPriority] = React.useState(!!defaultValue?.priority)
  const [submitted, setSubmitted] = React.useState(false)

  const displayError = submitted && !display.trim() ? "Enter a diagnosis or problem." : undefined
  const resolved = RESOLVED_STATUSES.includes(clinicalStatus)
  const systems = Array.from(new Set(["ICD-10-CM", "SNOMED CT", codeSystem]))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!display.trim()) {
      document.getElementById(`${id}-display`)?.focus()
      return
    }
    onSubmit({
      ...defaultValue,
      id: defaultValue?.id ?? createId(),
      display: display.trim(),
      code: code.trim() ? { system: codeSystem, code: code.trim() } : undefined,
      clinicalStatus,
      verificationStatus: verification,
      category,
      severity,
      onset: onset || undefined,
      abatement: resolved ? abatement || undefined : undefined,
      note: note.trim() || undefined,
      priority: priority || undefined,
    })
  }

  return (
    <form
      data-slot="problem-form"
      noValidate
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <Field data-invalid={!!displayError || undefined}>
          <FieldLabel id={`${id}-display-label`} htmlFor={`${id}-display`}>
            Diagnosis <span aria-hidden>*</span>
          </FieldLabel>
          {searchCodes ? (
            <DiagnosisCombobox
              id={`${id}-display`}
              labelId={`${id}-display-label`}
              value={display}
              code={code ? { system: codeSystem, code } : undefined}
              searchCodes={searchCodes}
              invalid={!!displayError}
              describedBy={displayError ? `${id}-display-error` : undefined}
              onSelect={(nextDisplay, nextCode) => {
                setDisplay(nextDisplay)
                setCode(nextCode?.code ?? "")
                if (nextCode) setCodeSystem(nextCode.system)
              }}
            />
          ) : (
            <Input
              id={`${id}-display`}
              value={display}
              onChange={(e) => setDisplay(e.target.value)}
              placeholder="e.g. Essential hypertension"
              required
              aria-invalid={!!displayError || undefined}
              aria-describedby={displayError ? `${id}-display-error` : undefined}
            />
          )}
          <div aria-live="polite">
            {displayError && <FieldError id={`${id}-display-error`}>{displayError}</FieldError>}
          </div>
        </Field>

        <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
          <Field>
            <FieldLabel htmlFor={`${id}-system`}>Code system</FieldLabel>
            <Select value={codeSystem} onValueChange={setCodeSystem}>
              <SelectTrigger id={`${id}-system`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {systems.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
              placeholder="Optional, e.g. E11.9"
              className="font-mono"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-status`}>Clinical status</FieldLabel>
            <Select value={clinicalStatus} onValueChange={(v) => setClinicalStatus(v as ProblemClinicalStatus)}>
              <SelectTrigger id={`${id}-status`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROBLEM_STATUS_LABELS) as ProblemClinicalStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROBLEM_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-verification`}>Verification</FieldLabel>
            <Select value={verification} onValueChange={(v) => setVerification(v as ProblemVerificationStatus)}>
              <SelectTrigger id={`${id}-verification`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROBLEM_VERIFICATION_LABELS) as ProblemVerificationStatus[]).map((v) => (
                  <SelectItem key={v} value={v}>
                    {PROBLEM_VERIFICATION_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-severity`}>Severity</FieldLabel>
            <Select
              value={severity ?? NONE}
              onValueChange={(v) => setSeverity(v === NONE ? undefined : (v as ProblemSeverity))}
            >
              <SelectTrigger id={`${id}-severity`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not specified</SelectItem>
                {(Object.keys(PROBLEM_SEVERITY_LABELS) as ProblemSeverity[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROBLEM_SEVERITY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-category`}>Category</FieldLabel>
            <Select value={category} onValueChange={(v) => setCategory(v as ProblemCategory)}>
              <SelectTrigger id={`${id}-category`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROBLEM_CATEGORY_LABELS) as ProblemCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {PROBLEM_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-onset`}>Onset date</FieldLabel>
            <Input id={`${id}-onset`} type="date" value={onset} onChange={(e) => setOnset(e.target.value)} />
          </Field>
          {resolved && (
            <Field>
              <FieldLabel htmlFor={`${id}-abatement`}>Resolved date</FieldLabel>
              <Input
                id={`${id}-abatement`}
                type="date"
                value={abatement}
                onChange={(e) => setAbatement(e.target.value)}
              />
            </Field>
          )}
        </div>

        <Field>
          <FieldLabel htmlFor={`${id}-note`}>Note</FieldLabel>
          <Textarea id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </Field>

        <Field orientation="horizontal">
          <Checkbox id={`${id}-priority`} checked={priority} onCheckedChange={(v) => setPriority(v === true)} />
          <FieldLabel htmlFor={`${id}-priority`} className="font-normal">
            Priority problem (pin to top)
          </FieldLabel>
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

// ───────────────────────────── ProblemList ─────────────────────────────

export interface ProblemListProps extends Omit<React.ComponentProps<"div">, "title"> {
  problems?: Problem[]
  defaultProblems?: Problem[]
  onProblemsChange?: (problems: Problem[]) => void
  /** Diagnosis lookup for the add/edit form. Sync or async; debounced 200 ms. */
  searchCodes?: ProblemCodeSearch
  /** Today's date as "YYYY-MM-DD", used as the resolved date. Without it "Mark resolved" is hidden. */
  today?: string
  readOnly?: boolean
  /** Initial filter tab. */
  defaultFilter?: ProblemFilter
  title?: React.ReactNode
}

export function ProblemList({
  problems: problemsProp,
  defaultProblems = [],
  onProblemsChange,
  searchCodes,
  today,
  readOnly = false,
  defaultFilter = "active",
  title = "Problem list",
  className,
  ...props
}: ProblemListProps) {
  const id = React.useId()
  const [internal, setInternal] = React.useState<Problem[]>(defaultProblems)
  const problems = problemsProp ?? internal
  const [filter, setFilter] = React.useState<ProblemFilter>(defaultFilter)
  const [editing, setEditing] = React.useState<Problem | "new" | null>(null)
  const [removing, setRemoving] = React.useState<Problem | null>(null)

  const setProblems = (next: Problem[]) => {
    setInternal(next)
    onProblemsChange?.(next)
  }
  const update = (problemId: string, patch: Partial<Problem>) =>
    setProblems(problems.map((p) => (p.id === problemId ? { ...p, ...patch } : p)))

  const save = (problem: Problem) => {
    const exists = problems.some((p) => p.id === problem.id)
    setProblems(exists ? problems.map((p) => (p.id === problem.id ? problem : p)) : [...problems, problem])
    setEditing(null)
  }

  const counts: Record<ProblemFilter, number> = {
    active: filterProblems(problems, "active").length,
    resolved: filterProblems(problems, "resolved").length,
    all: problems.length,
  }

  const renderRow = (problem: Problem) => {
    const active = isProblemActive(problem)
    const voided = isVoided(problem)
    const onset = formatProblemDate(problem.onset)
    const abatement = formatProblemDate(problem.abatement)
    const showVerification = problem.verificationStatus && problem.verificationStatus !== "confirmed"

    return (
      <li key={problem.id} className="flex items-start gap-3 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {problem.priority && (
              <>
                <Star aria-hidden className="size-3.5 fill-current text-clinical-watch-foreground" />
                <span className="sr-only">Priority:</span>
              </>
            )}
            <span className={cn("font-medium", !active && "text-muted-foreground", voided && "line-through")}>
              {problem.display}
            </span>
            {problem.code && (
              <span
                title={problem.code.system}
                className="rounded border bg-muted px-1 font-mono text-[11px] leading-4 text-muted-foreground"
              >
                <span className="sr-only">{problem.code.system} </span>
                {problem.code.code}
              </span>
            )}
            {showVerification && (
              <span className="rounded border border-dashed px-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {PROBLEM_VERIFICATION_LABELS[problem.verificationStatus!]}
              </span>
            )}
          </div>
          {(onset || abatement || problem.category === "encounter-diagnosis") && (
            <p className="text-sm text-muted-foreground">
              {[
                onset && `since ${onset}`,
                abatement && `resolved ${abatement}`,
                problem.category === "encounter-diagnosis" && "Encounter diagnosis",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {problem.note && <p className="text-xs text-muted-foreground italic">{problem.note}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {problem.severity && (
            <ClinicalStatusBadge status={active ? severityTone[problem.severity] : "unknown"} dot={false}>
              {PROBLEM_SEVERITY_LABELS[problem.severity]}
            </ClinicalStatusBadge>
          )}
          <ClinicalStatusBadge status={voided ? "unknown" : statusTone[problem.clinicalStatus]} dot={false}>
            {voided
              ? PROBLEM_VERIFICATION_LABELS[problem.verificationStatus!]
              : PROBLEM_STATUS_LABELS[problem.clinicalStatus]}
          </ClinicalStatusBadge>
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${problem.display}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(problem)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                {active && today && (
                  <DropdownMenuItem
                    onSelect={() => update(problem.id, { clinicalStatus: "resolved", abatement: today })}
                  >
                    <CircleCheck />
                    Mark resolved
                  </DropdownMenuItem>
                )}
                {RESOLVED_STATUSES.includes(problem.clinicalStatus) && (
                  <DropdownMenuItem
                    onSelect={() => update(problem.id, { clinicalStatus: "active", abatement: undefined })}
                  >
                    <RotateCcw />
                    Reactivate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => update(problem.id, { priority: !problem.priority || undefined })}>
                  {problem.priority ? <StarOff /> : <Star />}
                  {problem.priority ? "Unpin priority" : "Pin as priority"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(problem)}>
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

  const emptyMessages: Record<ProblemFilter, string> = {
    active: "No active problems.",
    resolved: "No resolved problems.",
    all: "No problems recorded.",
  }

  return (
    <div data-slot="problem-list" className={cn("overflow-hidden rounded-xl border bg-card", className)} {...props}>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as ProblemFilter)} className="gap-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3">
          <ClipboardList className="size-4 text-muted-foreground" />
          <h3 id={`${id}-title`} className="text-sm font-semibold">
            {title}
          </h3>
          <TabsList aria-label="Filter problems">
            {(["active", "resolved", "all"] as const).map((f) => (
              <TabsTrigger key={f} value={f} className="gap-1.5 px-2.5">
                {f === "active" ? "Active" : f === "resolved" ? "Resolved" : "All"}
                <span className="text-xs text-muted-foreground tabular-nums">{counts[f]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {!readOnly && (
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setEditing("new")}>
              <Plus />
              Add problem
            </Button>
          )}
        </div>
        {(["active", "resolved", "all"] as const).map((f) => {
          const items = sortProblems(filterProblems(problems, f))
          return (
            <TabsContent key={f} value={f}>
              {items.length > 0 ? (
                <ul role="list" aria-labelledby={`${id}-title`} className="divide-y">
                  {items.map(renderRow)}
                </ul>
              ) : (
                <p className="p-8 text-center text-sm text-muted-foreground">{emptyMessages[f]}</p>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add problem" : "Edit problem"}</DialogTitle>
            <DialogDescription>Search a coded diagnosis or enter free text.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <ProblemForm
              key={editing === "new" ? "new" : editing.id}
              defaultValue={editing === "new" ? undefined : editing}
              searchCodes={searchCodes}
              onSubmit={save}
              onCancel={() => setEditing(null)}
              submitLabel={editing === "new" ? "Add problem" : "Save changes"}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.display}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the problem from the list. To keep the history, mark it resolved or inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (removing) setProblems(problems.filter((p) => p.id !== removing.id))
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
