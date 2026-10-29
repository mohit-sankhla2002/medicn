"use client"

import * as React from "react"
import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

// ───────────────────────────── Types ─────────────────────────────

export interface QuestionnaireCoding {
  system: string
  code: string
  display?: string
}

export interface QuestionnaireOption {
  /** Score for scored items. For the follow-up question it is only an ordinal. */
  value: number
  label: string
  code?: QuestionnaireCoding
}

export interface QuestionnaireItemFlag {
  /** Raise the flag when the item score is at or above this value. */
  minScore: number
  /** Short label, e.g. "Self-harm". */
  label: string
  /** Default message. Override per item with the `flagMessages` prop. */
  message: string
  status?: ClinicalStatus
}

export interface QuestionnaireItem {
  id: string
  text: string
  code?: QuestionnaireCoding
  /** Raise a flag from this item regardless of the total score. */
  flag?: QuestionnaireItemFlag
}

export interface QuestionnaireBand {
  min: number
  max: number
  label: string
  status: ClinicalStatus
}

export interface QuestionnaireDefinition {
  id: string
  title: string
  /** Question stem shown above the items. */
  instructions: string
  /** Answer options shared by every scored item. */
  options: QuestionnaireOption[]
  items: QuestionnaireItem[]
  bands: QuestionnaireBand[]
  /** Optional unscored question asked after the items (e.g. functional difficulty). */
  followUp?: { id: string; text: string; options: QuestionnaireOption[]; code?: QuestionnaireCoding }
  code?: QuestionnaireCoding
  /** Code for the total score, used by `toFhirQuestionnaireResponse`. */
  totalCode?: QuestionnaireCoding
  citation?: string
  copyright?: string
}

/** Item id → selected option value. */
export type QuestionnaireAnswers = Record<string, number>

export interface QuestionnaireFlag {
  itemId: string
  /** 1-based item number. */
  itemNumber: number
  score: number
  label: string
  message: string
  status: ClinicalStatus
}

export interface QuestionnaireResponse {
  definitionId: string
  answers: QuestionnaireAnswers
  /** Sum of answered scored items. */
  total: number
  maxScore: number
  /** Severity band. `null` until every scored item is answered. */
  band: QuestionnaireBand | null
  flags: QuestionnaireFlag[]
  complete: boolean
  answeredCount: number
  itemCount: number
}

// ───────────────────────────── Scoring ─────────────────────────────

export function scoreQuestionnaire(
  definition: QuestionnaireDefinition,
  answers: QuestionnaireAnswers
): QuestionnaireResponse {
  const optionMax = Math.max(0, ...definition.options.map((option) => option.value))
  let total = 0
  let answeredCount = 0
  const flags: QuestionnaireFlag[] = []

  definition.items.forEach((item, index) => {
    const score = answers[item.id]
    if (typeof score !== "number") return
    answeredCount += 1
    total += score
    if (item.flag && score >= item.flag.minScore) {
      flags.push({
        itemId: item.id,
        itemNumber: index + 1,
        score,
        label: item.flag.label,
        message: item.flag.message,
        status: item.flag.status ?? "critical",
      })
    }
  })

  const itemCount = definition.items.length
  const complete = answeredCount === itemCount
  return {
    definitionId: definition.id,
    answers,
    total,
    maxScore: itemCount * optionMax,
    band: complete ? (definition.bands.find((band) => total >= band.min && total <= band.max) ?? null) : null,
    flags,
    complete,
    answeredCount,
    itemCount,
  }
}

/**
 * Minimal FHIR R4 QuestionnaireResponse. Items use their LOINC code as `linkId` when present.
 * Pass `authored` yourself (ISO string) so the output stays deterministic.
 */
export function toFhirQuestionnaireResponse(
  definition: QuestionnaireDefinition,
  answers: QuestionnaireAnswers,
  extra: { questionnaire?: string; subject?: { reference: string }; authored?: string } = {}
) {
  const { total, complete } = scoreQuestionnaire(definition, answers)
  const questions = [
    ...definition.items.map((item) => ({ ...item, options: definition.options })),
    ...(definition.followUp ? [definition.followUp] : []),
  ]
  const item: Record<string, unknown>[] = questions
    .filter((question) => typeof answers[question.id] === "number")
    .map((question) => {
      const option = question.options.find((o) => o.value === answers[question.id])
      return {
        linkId: question.code?.code ?? question.id,
        text: question.text,
        answer: [option?.code ? { valueCoding: option.code } : { valueInteger: answers[question.id] }],
      }
    })
  if (complete) {
    item.push({ linkId: definition.totalCode?.code ?? "total", text: "Total score", answer: [{ valueInteger: total }] })
  }
  return {
    resourceType: "QuestionnaireResponse" as const,
    status: complete ? ("completed" as const) : ("in-progress" as const),
    ...extra,
    item,
  }
}

// ───────────────────────────── Definitions ─────────────────────────────

const loinc = (code: string, display?: string): QuestionnaireCoding => ({ system: "http://loinc.org", code, display })

const FREQUENCY_OPTIONS: QuestionnaireOption[] = [
  { value: 0, label: "Not at all", code: loinc("LA6568-5", "Not at all") },
  { value: 1, label: "Several days", code: loinc("LA6569-3", "Several days") },
  { value: 2, label: "More than half the days", code: loinc("LA6570-1", "More than half the days") },
  { value: 3, label: "Nearly every day", code: loinc("LA6571-9", "Nearly every day") },
]

const DIFFICULTY_OPTIONS: QuestionnaireOption[] = [
  { value: 0, label: "Not difficult at all", code: loinc("LA6572-7", "Not difficult at all") },
  { value: 1, label: "Somewhat difficult", code: loinc("LA6573-5", "Somewhat difficult") },
  { value: 2, label: "Very difficult", code: loinc("LA6575-0", "Very difficult") },
  { value: 3, label: "Extremely difficult", code: loinc("LA6574-3", "Extremely difficult") },
]

const PUBLIC_DOMAIN =
  "Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute."

/** Patient Health Questionnaire-9. Wording from the official Pfizer PHQ instructions (phqscreeners.com). */
export const PHQ9: QuestionnaireDefinition = {
  id: "phq-9",
  title: "PHQ-9",
  instructions: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
  code: loinc("44249-1", "PHQ-9 quick depression assessment panel"),
  totalCode: loinc("44261-6", "Patient health questionnaire 9 item total score"),
  options: FREQUENCY_OPTIONS,
  items: [
    { id: "phq9-1", text: "Little interest or pleasure in doing things", code: loinc("44250-9") },
    { id: "phq9-2", text: "Feeling down, depressed, or hopeless", code: loinc("44255-8") },
    { id: "phq9-3", text: "Trouble falling or staying asleep, or sleeping too much", code: loinc("44259-0") },
    { id: "phq9-4", text: "Feeling tired or having little energy", code: loinc("44254-1") },
    { id: "phq9-5", text: "Poor appetite or overeating", code: loinc("44251-7") },
    {
      id: "phq9-6",
      text: "Feeling bad about yourself—or that you are a failure or have let yourself or your family down",
      code: loinc("44258-2"),
    },
    {
      id: "phq9-7",
      text: "Trouble concentrating on things, such as reading the newspaper or watching television",
      code: loinc("44252-5"),
    },
    {
      id: "phq9-8",
      text: "Moving or speaking so slowly that other people could have noticed? Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual",
      code: loinc("44253-3"),
    },
    {
      id: "phq9-9",
      text: "Thoughts that you would be better off dead or of hurting yourself in some way",
      code: loinc("44260-8"),
      flag: {
        minScore: 1,
        label: "Self-harm",
        status: "critical",
        message:
          "Positive response to item 9 (thoughts of being better off dead or of self-harm). Assess suicide risk today and follow your local safety protocol.",
      },
    },
  ],
  bands: [
    { min: 0, max: 4, label: "Minimal", status: "normal" },
    { min: 5, max: 9, label: "Mild", status: "watch" },
    { min: 10, max: 14, label: "Moderate", status: "abnormal" },
    { min: 15, max: 19, label: "Moderately severe", status: "abnormal" },
    { min: 20, max: 27, label: "Severe", status: "critical" },
  ],
  followUp: {
    id: "phq9-difficulty",
    text: "If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
    code: loinc("69722-7"),
    options: DIFFICULTY_OPTIONS,
  },
  citation:
    "Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-613.",
  copyright: PUBLIC_DOMAIN,
}

/** Generalized Anxiety Disorder-7. Wording from the published GAD-7 form (Spitzer et al. 2006). */
export const GAD7: QuestionnaireDefinition = {
  id: "gad-7",
  title: "GAD-7",
  instructions: "Over the last 2 weeks, how often have you been bothered by the following problems?",
  code: loinc("69737-5", "Generalized anxiety disorder 7 item (GAD-7)"),
  totalCode: loinc("70274-6", "Generalized anxiety disorder 7 item total score"),
  options: FREQUENCY_OPTIONS,
  items: [
    { id: "gad7-1", text: "Feeling nervous, anxious or on edge", code: loinc("69725-0") },
    { id: "gad7-2", text: "Not being able to stop or control worrying", code: loinc("68509-9") },
    { id: "gad7-3", text: "Worrying too much about different things", code: loinc("69733-4") },
    { id: "gad7-4", text: "Trouble relaxing", code: loinc("69734-2") },
    { id: "gad7-5", text: "Being so restless that it is hard to sit still", code: loinc("69735-9") },
    { id: "gad7-6", text: "Becoming easily annoyed or irritable", code: loinc("69689-8") },
    { id: "gad7-7", text: "Feeling afraid as if something awful might happen", code: loinc("69736-7") },
  ],
  bands: [
    { min: 0, max: 4, label: "Minimal", status: "normal" },
    { min: 5, max: 9, label: "Mild", status: "watch" },
    { min: 10, max: 14, label: "Moderate", status: "abnormal" },
    { min: 15, max: 21, label: "Severe", status: "critical" },
  ],
  followUp: {
    id: "gad7-difficulty",
    text: "If you checked off any problems, how difficult have these made it for you to do your work, take care of things at home, or get along with other people?",
    options: DIFFICULTY_OPTIONS,
  },
  citation:
    "Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092-1097.",
  copyright: PUBLIC_DOMAIN,
}

// ───────────────────────────── Flags & score ─────────────────────────────

const flagToneClasses: Record<ClinicalStatus, string> = {
  normal: "border-clinical-normal/40 bg-clinical-normal/10 text-clinical-normal-foreground",
  watch: "border-clinical-watch/40 bg-clinical-watch/10 text-clinical-watch-foreground",
  abnormal: "border-clinical-abnormal/40 bg-clinical-abnormal/10 text-clinical-abnormal-foreground",
  critical: "border-clinical-critical/50 bg-clinical-critical/10 text-clinical-critical-foreground",
  info: "border-clinical-info/40 bg-clinical-info/10 text-clinical-info-foreground",
  unknown: "border-border bg-muted text-muted-foreground",
}

/** Item id → custom message for that item's flag. */
export type QuestionnaireFlagMessages = Partial<Record<string, React.ReactNode>>

function QuestionnaireFlags({ flags, messages }: { flags: QuestionnaireFlag[]; messages?: QuestionnaireFlagMessages }) {
  if (flags.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {flags.map((flag) => (
        <div
          key={flag.itemId}
          role="alert"
          data-slot="questionnaire-flag"
          data-status={flag.status}
          className={cn("flex gap-3 rounded-lg border-2 px-3 py-2.5 text-sm", flagToneClasses[flag.status])}
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">
              {flag.label} flag · item {flag.itemNumber} answered {flag.score}
            </span>
            <span className="text-foreground">{messages?.[flag.itemId] ?? flag.message}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface QuestionnaireScoreProps extends React.ComponentProps<"div"> {
  response: QuestionnaireResponse
  /** Shown before the score, e.g. "PHQ-9". */
  title?: string
  flagMessages?: QuestionnaireFlagMessages
  /** Hide total and band but keep safety flags. */
  hideScore?: boolean
}

export function QuestionnaireScore({
  response,
  title,
  flagMessages,
  hideScore = false,
  className,
  ...props
}: QuestionnaireScoreProps) {
  const { total, maxScore, band, complete, answeredCount, itemCount, flags } = response
  return (
    <div data-slot="questionnaire-score" className={cn("flex flex-col gap-3", className)} {...props}>
      {!hideScore && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2.5">
          {title && <span className="text-sm font-medium">{title}</span>}
          <span className="text-sm">
            <span className="text-2xl font-semibold tabular-nums">{total}</span>
            <span className="text-muted-foreground tabular-nums"> / {maxScore}</span>
            {!complete && <span className="sr-only"> (partial)</span>}
          </span>
          {band ? (
            <ClinicalStatusBadge status={band.status}>{band.label}</ClinicalStatusBadge>
          ) : (
            <ClinicalStatusBadge status="unknown">
              Incomplete · {answeredCount} of {itemCount}
            </ClinicalStatusBadge>
          )}
        </div>
      )}
      <QuestionnaireFlags flags={flags} messages={flagMessages} />
    </div>
  )
}

// ───────────────────────────── Questionnaire ─────────────────────────────

type Layout = "auto" | "table" | "stacked"

// One DOM, three layouts: "auto" is stacked below `sm` and a table above it.
const layoutClasses: Record<Layout, Record<"header" | "row" | "group" | "option" | "optionText", string>> = {
  auto: {
    header: "hidden sm:grid",
    row: "flex flex-col gap-3 py-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:py-1.5",
    group: "grid gap-1.5 sm:grid-cols-(--q-cols) sm:gap-0",
    option:
      "rounded-md border px-3 py-2.5 has-data-checked:border-primary has-data-checked:bg-primary/5 sm:justify-center sm:border-transparent sm:px-1 sm:py-2.5 sm:has-data-checked:border-transparent",
    optionText: "sm:sr-only",
  },
  table: {
    header: "grid",
    row: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-1.5",
    group: "grid grid-cols-(--q-cols) gap-0",
    option: "justify-center rounded-md px-1 py-2.5",
    optionText: "sr-only",
  },
  stacked: {
    header: "hidden",
    row: "flex flex-col gap-3 py-4",
    group: "grid gap-1.5",
    option: "rounded-md border px-3 py-2.5 has-data-checked:border-primary has-data-checked:bg-primary/5",
    optionText: "",
  },
}

export interface QuestionnaireProps extends Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue"> {
  definition: QuestionnaireDefinition
  value?: QuestionnaireAnswers
  defaultValue?: QuestionnaireAnswers
  onValueChange?: (answers: QuestionnaireAnswers) => void
  onSubmit?: (response: QuestionnaireResponse) => void
  readOnly?: boolean
  /** Hide the running total and band (flags still show). */
  hideScore?: boolean
  /** `table` = answer columns, `stacked` = one block per question. Default: stacked below `sm`, table above. */
  layout?: "table" | "stacked"
  /** Allow submitting before every scored item is answered. */
  allowPartial?: boolean
  /** Custom messages for item flags, keyed by item id (e.g. `{ "phq9-9": "…" }`). */
  flagMessages?: QuestionnaireFlagMessages
  submitLabel?: string
  /** Hide the citation and copyright footer. */
  hideCitation?: boolean
}

export function Questionnaire({
  definition,
  value: valueProp,
  defaultValue,
  onValueChange,
  onSubmit,
  readOnly = false,
  hideScore = false,
  layout,
  allowPartial = false,
  flagMessages,
  submitLabel = "Submit",
  hideCitation = false,
  className,
  style,
  ...props
}: QuestionnaireProps) {
  const id = React.useId()
  const [uncontrolled, setUncontrolled] = React.useState<QuestionnaireAnswers>(defaultValue ?? {})
  const answers = valueProp ?? uncontrolled
  const response = React.useMemo(() => scoreQuestionnaire(definition, answers), [definition, answers])
  const classes = layoutClasses[layout ?? "auto"]
  const flagged = new Set(response.flags.map((flag) => flag.itemId))

  const setAnswer = (itemId: string, next: number) => {
    if (readOnly) return
    const updated = { ...answers, [itemId]: next }
    if (valueProp === undefined) setUncontrolled(updated)
    onValueChange?.(updated)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (readOnly || (!response.complete && !allowPartial)) return
    onSubmit?.(response)
  }

  const renderGroup = (
    questionId: string,
    labelledBy: string,
    options: QuestionnaireOption[],
    optionClasses: { group: string; option: string; optionText: string },
    showScores: boolean
  ) => (
    <RadioGroup
      aria-labelledby={labelledBy}
      aria-readonly={readOnly || undefined}
      value={answers[questionId] != null ? String(answers[questionId]) : ""}
      onValueChange={(next) => setAnswer(questionId, Number(next))}
      className={optionClasses.group}
    >
      {options.map((option) => {
        const optionId = `${id}-${questionId}-${option.value}`
        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              "flex items-center gap-3 text-sm transition-colors",
              readOnly ? "cursor-default" : "cursor-pointer hover:bg-muted",
              optionClasses.option
            )}
          >
            <RadioGroupItem id={optionId} value={String(option.value)} />
            <span className={cn("flex flex-1 items-center justify-between gap-2", optionClasses.optionText)}>
              {option.label}
              {showScores && <span className="text-xs text-muted-foreground tabular-nums">{option.value}</span>}
            </span>
          </label>
        )
      })}
    </RadioGroup>
  )

  const followUp = definition.followUp

  return (
    <form
      data-slot="questionnaire"
      aria-labelledby={`${id}-title`}
      onSubmit={handleSubmit}
      style={{ "--q-cols": `repeat(${definition.options.length}, 6.5rem)`, ...style } as React.CSSProperties}
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 id={`${id}-title`} className="font-semibold">
            {definition.title}
          </h3>
          <p id={`${id}-stem`} className="text-sm text-muted-foreground">
            {definition.instructions}
          </p>
        </div>
        <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
          {response.answeredCount} of {response.itemCount} answered
        </p>
      </div>

      <div className={cn(layout === "table" && "overflow-x-auto")}>
        <div
          aria-hidden
          className={cn(
            "grid-cols-[minmax(0,1fr)_auto] gap-4 border-b pb-2 text-xs font-medium text-muted-foreground",
            classes.header
          )}
        >
          <span />
          <div className="grid grid-cols-(--q-cols)">
            {definition.options.map((option) => (
              <span key={option.value} className="px-1 text-center leading-tight">
                {option.label}
                {!hideScore && <span className="block font-normal tabular-nums">({option.value})</span>}
              </span>
            ))}
          </div>
        </div>
        <ol className="divide-y">
          {definition.items.map((item, index) => {
            const labelId = `${id}-${item.id}-label`
            const isFlagged = flagged.has(item.id)
            return (
              <li
                key={item.id}
                data-flagged={isFlagged || undefined}
                className={cn(
                  classes.row,
                  isFlagged && "-mx-2 rounded-md bg-clinical-critical/5 px-2 shadow-[inset_3px_0_0_var(--clinical-critical)]"
                )}
              >
                <div id={labelId} className="flex gap-2 text-sm">
                  <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{index + 1}.</span>
                  <span>
                    {item.text}
                    {isFlagged && (
                      <span className="ml-2 inline-flex items-center gap-1 align-middle text-xs font-semibold text-clinical-critical-foreground">
                        <TriangleAlert aria-hidden className="size-3" />
                        Flagged
                      </span>
                    )}
                  </span>
                </div>
                {renderGroup(item.id, labelId, definition.options, classes, !hideScore)}
              </li>
            )
          })}
        </ol>
      </div>

      {followUp && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
          <p id={`${id}-followup`} className="text-sm">
            {followUp.text} <span className="text-xs text-muted-foreground">(optional, not scored)</span>
          </p>
          {renderGroup(
            followUp.id,
            `${id}-followup`,
            followUp.options,
            {
              group: "grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4",
              option: "rounded-md border px-3 py-2 has-data-checked:border-primary has-data-checked:bg-primary/5",
              optionText: "",
            },
            false
          )}
        </div>
      )}

      <QuestionnaireScore response={response} hideScore={hideScore} flagMessages={flagMessages} />

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {!response.complete && !allowPartial && (
            <p id={`${id}-submit-hint`} className="text-xs text-muted-foreground">
              Answer every question to submit.
            </p>
          )}
          <Button
            type="submit"
            disabled={!response.complete && !allowPartial}
            aria-describedby={!response.complete && !allowPartial ? `${id}-submit-hint` : undefined}
          >
            {submitLabel}
          </Button>
        </div>
      )}

      {!hideCitation && (definition.citation || definition.copyright) && (
        <footer className="flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
          {definition.citation && <p>{definition.citation}</p>}
          {definition.copyright && <p>{definition.copyright}</p>}
        </footer>
      )}
    </form>
  )
}
