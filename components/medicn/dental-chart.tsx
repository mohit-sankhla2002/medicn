"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * Canonical tooth id: the ISO 3950 / FDI two-digit code as a string
 * ("11"–"48" permanent, "51"–"85" primary).
 */
export type ToothId = string

export type Dentition = "permanent" | "primary" | "mixed"
export type NumberingSystem = "fdi" | "universal" | "palmer"
export type ToothType = "incisor" | "canine" | "premolar" | "molar"
export type Arch = "upper" | "lower"
export type PatientSide = "right" | "left"

/** ADA surface keys. `O` is shown as `I` (incisal) and `B` as `F` (facial) on anterior teeth. */
export type Surface = "M" | "O" | "D" | "B" | "L"
export const SURFACES: readonly Surface[] = ["M", "O", "D", "B", "L"]

/** `existing` = already in the mouth / diagnosed; `planned` = on the treatment plan. */
export type FindingStatus = "existing" | "planned"

export type ToothConditionType =
  | "missing"
  | "extraction"
  | "implant"
  | "crown"
  | "root-canal"
  | "pontic"
  | "fracture"
  | "watch"

export type SurfaceConditionType = "caries" | "restoration" | "sealant"
export type RestorationMaterial = "amalgam" | "composite"

export interface ToothCondition {
  type: ToothConditionType
  /** Defaults to `"existing"`. An existing `extraction` means the tooth was extracted. */
  status?: FindingStatus
}

export interface SurfaceCondition {
  type: SurfaceConditionType
  /** Only meaningful for `restoration`. */
  material?: RestorationMaterial
  status?: FindingStatus
}

export interface ToothRecord {
  conditions: ToothCondition[]
  surfaces?: Partial<Record<Surface, SurfaceCondition>>
  note?: string
}

/** Tooth id (FDI) → findings. Teeth without findings are omitted. */
export type DentalChartValue = Record<ToothId, ToothRecord>

/** Paint tools offered by the toolbar. `select` toggles selection, `erase` clears. */
export type DentalChartTool =
  | "select"
  | "caries"
  | "amalgam"
  | "composite"
  | "sealant"
  | ToothConditionType
  | "erase"

export interface ToothInfo {
  id: ToothId
  quadrant: number
  position: number
  primary: boolean
  arch: Arch
  side: PatientSide
  type: ToothType
  /** e.g. "lower left first molar", "upper right primary canine" */
  name: string
}

/* -------------------------------------------------------------------------- */
/*                             Numbering (ISO 3950)                           */
/* -------------------------------------------------------------------------- */

const PERMANENT_NAMES = [
  "central incisor",
  "lateral incisor",
  "canine",
  "first premolar",
  "second premolar",
  "first molar",
  "second molar",
  "third molar",
]
const PRIMARY_NAMES = ["central incisor", "lateral incisor", "canine", "first molar", "second molar"]
const PRIMARY_LETTERS = "ABCDEFGHIJKLMNOPQRST"

/** Parse an FDI id. Returns `null` for anything that is not a valid ISO 3950 tooth code. */
export function getToothInfo(id: ToothId): ToothInfo | null {
  if (!/^[1-8][1-8]$/.test(id)) return null
  const quadrant = Number(id[0])
  const position = Number(id[1])
  const primary = quadrant >= 5
  if (primary && position > 5) return null
  const q = primary ? quadrant - 4 : quadrant
  const arch: Arch = q <= 2 ? "upper" : "lower"
  const side: PatientSide = q === 1 || q === 4 ? "right" : "left"
  const type: ToothType =
    position <= 2
      ? "incisor"
      : position === 3
        ? "canine"
        : primary || position >= 6
          ? "molar"
          : "premolar"
  const toothName = (primary ? PRIMARY_NAMES : PERMANENT_NAMES)[position - 1]
  return {
    id,
    quadrant,
    position,
    primary,
    arch,
    side,
    type,
    name: `${arch} ${side} ${primary ? "primary " : ""}${toothName}`,
  }
}

/**
 * Display number for a tooth (FDI id in, label out).
 *
 * - `fdi` — ISO 3950 two-digit code, e.g. `36`.
 * - `universal` — ADA Universal: permanent 1–32 starting at the upper right third
 *   molar, running to the upper left and back along the lower arch; primary A–T in
 *   the same order.
 * - `palmer` — Zsigmondy–Palmer as text: tooth 1–8 (primary A–E) with a quadrant
 *   angle, number on the outside of the angle (e.g. `6┘` upper right, `└6` upper
 *   left, `6┐` lower right, `┌6` lower left).
 */
export function toothNumber(id: ToothId, system: NumberingSystem = "fdi"): string {
  const info = getToothInfo(id)
  if (!info) return id
  const { quadrant: q, position: p, primary } = info
  if (system === "fdi") return id
  if (system === "universal") {
    if (!primary) {
      if (q === 1) return String(9 - p)
      if (q === 2) return String(8 + p)
      if (q === 3) return String(25 - p)
      return String(24 + p)
    }
    const index = q === 5 ? 5 - p : q === 6 ? 4 + p : q === 7 ? 15 - p : 14 + p
    return PRIMARY_LETTERS[index]
  }
  const glyph = primary ? "ABCDE"[p - 1] : String(p)
  const pq = primary ? q - 4 : q
  if (pq === 1) return `${glyph}┘`
  if (pq === 2) return `└${glyph}`
  if (pq === 3) return `┌${glyph}`
  return `${glyph}┐`
}

const range = (q: number, from: number, to: number) => {
  const out: ToothId[] = []
  const step = from <= to ? 1 : -1
  for (let p = from; step > 0 ? p <= to : p >= to; p += step) out.push(`${q}${p}`)
  return out
}

/**
 * Rows of teeth in chart order (viewer facing the patient: the patient's right
 * on the viewer's left). Mixed dentition returns permanent and primary rows.
 */
export function getDentitionRows(dentition: Dentition): { arch: Arch; primary: boolean; teeth: ToothId[] }[] {
  const permanentUpper = [...range(1, 8, 1), ...range(2, 1, 8)]
  const permanentLower = [...range(4, 8, 1), ...range(3, 1, 8)]
  const primaryUpper = [...range(5, 5, 1), ...range(6, 1, 5)]
  const primaryLower = [...range(8, 5, 1), ...range(7, 1, 5)]
  if (dentition === "permanent")
    return [
      { arch: "upper", primary: false, teeth: permanentUpper },
      { arch: "lower", primary: false, teeth: permanentLower },
    ]
  if (dentition === "primary")
    return [
      { arch: "upper", primary: true, teeth: primaryUpper },
      { arch: "lower", primary: true, teeth: primaryLower },
    ]
  return [
    { arch: "upper", primary: false, teeth: permanentUpper },
    { arch: "upper", primary: true, teeth: primaryUpper },
    { arch: "lower", primary: true, teeth: primaryLower },
    { arch: "lower", primary: false, teeth: permanentLower },
  ]
}

/* Universal (1–32 / A–T) order, used to sort summaries. */
function chartOrder(id: ToothId): number {
  const info = getToothInfo(id)
  if (!info) return 999
  const n = toothNumber(id, "universal")
  return info.primary ? 100 + PRIMARY_LETTERS.indexOf(n) : Number(n)
}

/* -------------------------------------------------------------------------- */
/*                                   Labels                                   */
/* -------------------------------------------------------------------------- */

const isAnterior = (type: ToothType) => type === "incisor" || type === "canine"

/** ADA surface letter for a tooth: `O`→`I` and `B`→`F` on incisors and canines. */
export function surfaceLetter(surface: Surface, toothType: ToothType = "molar"): string {
  if (isAnterior(toothType)) {
    if (surface === "O") return "I"
    if (surface === "B") return "F"
  }
  return surface
}

/** Long surface name, e.g. "occlusal", "incisal", "facial", "palatal". */
export function surfaceName(surface: Surface, info?: Pick<ToothInfo, "type" | "arch">): string {
  const anterior = info ? isAnterior(info.type) : false
  switch (surface) {
    case "M":
      return "mesial"
    case "D":
      return "distal"
    case "O":
      return anterior ? "incisal" : "occlusal"
    case "B":
      return anterior ? "facial" : "buccal"
    case "L":
      return info?.arch === "upper" ? "palatal" : "lingual"
  }
}

const TOOTH_CONDITION_LABELS: Record<ToothConditionType, string> = {
  missing: "missing",
  extraction: "extraction",
  implant: "implant",
  crown: "crown",
  "root-canal": "root canal",
  pontic: "bridge pontic",
  fracture: "fracture",
  watch: "watch",
}

/** Conditions that are diagnoses rather than treatment, so never `planned`. */
const DIAGNOSES = new Set<string>(["missing", "fracture", "watch", "caries"])

export function getToothConditionLabel(c: ToothCondition): string {
  if (c.type === "extraction") return c.status === "planned" ? "planned extraction" : "extracted"
  const label = TOOTH_CONDITION_LABELS[c.type]
  return c.status === "planned" ? `planned ${label}` : label
}

export function getSurfaceConditionLabel(c: SurfaceCondition): string {
  const label =
    c.type === "restoration"
      ? `${c.material ? `${c.material} ` : ""}restoration`
      : c.type
  return c.status === "planned" ? `planned ${label}` : label
}

export interface DentalFinding {
  tooth: ToothId
  /** Tooth number in the requested system. */
  number: string
  /** Surface keys in ADA order (empty for whole-tooth findings). */
  surfaces: Surface[]
  /** ADA letters, e.g. "MO" or "FI". */
  surfaceCode: string
  label: string
  status: FindingStatus
  kind: "tooth" | "surface"
  /** e.g. "36 MO caries" */
  text: string
}

/** Flatten a chart value into ADA-style findings, sorted in chart (Universal) order. */
export function getDentalFindings(
  value: DentalChartValue,
  system: NumberingSystem = "fdi"
): DentalFinding[] {
  const out: DentalFinding[] = []
  const ids = Object.keys(value).sort((a, b) => chartOrder(a) - chartOrder(b))
  for (const id of ids) {
    const info = getToothInfo(id)
    const record = value[id]
    if (!info || !record) continue
    const number = toothNumber(id, system)
    for (const c of record.conditions ?? []) {
      const label = getToothConditionLabel(c)
      out.push({
        tooth: id,
        number,
        surfaces: [],
        surfaceCode: "",
        label,
        status: c.status ?? "existing",
        kind: "tooth",
        text: `${number} ${label}`,
      })
    }
    const groups = new Map<string, { cond: SurfaceCondition; surfaces: Surface[] }>()
    for (const s of SURFACES) {
      const cond = record.surfaces?.[s]
      if (!cond) continue
      const key = `${cond.type}|${cond.material ?? ""}|${cond.status ?? "existing"}`
      const group = groups.get(key)
      if (group) group.surfaces.push(s)
      else groups.set(key, { cond, surfaces: [s] })
    }
    for (const { cond, surfaces } of groups.values()) {
      const code = surfaces.map((s) => surfaceLetter(s, info.type)).join("")
      const label = getSurfaceConditionLabel(cond)
      out.push({
        tooth: id,
        number,
        surfaces,
        surfaceCode: code,
        label,
        status: cond.status ?? "existing",
        kind: "surface",
        text: `${number} ${code} ${label}`,
      })
    }
  }
  return out
}

const joinWords = (words: string[]) =>
  words.length <= 1
    ? words.join("")
    : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`

/** Screen-reader description, e.g. "Tooth 36, lower left first molar, caries on occlusal surface". */
export function describeTooth(
  id: ToothId,
  record?: ToothRecord,
  system: NumberingSystem = "fdi"
): string {
  const info = getToothInfo(id)
  if (!info) return `Tooth ${id}`
  const parts = [`Tooth ${toothNumber(id, system)}`, info.name]
  if (record) {
    for (const c of record.conditions ?? []) parts.push(getToothConditionLabel(c))
    for (const f of getDentalFindings({ [id]: record }, system)) {
      if (f.kind !== "surface") continue
      const names = f.surfaces.map((s) => surfaceName(s, info))
      parts.push(`${f.label} on ${joinWords(names)} surface${names.length > 1 ? "s" : ""}`)
    }
    if (record.note) parts.push(`note: ${record.note}`)
  }
  return parts.join(", ")
}

/* -------------------------------------------------------------------------- */
/*                                    Tools                                   */
/* -------------------------------------------------------------------------- */

type ToolDef = { value: DentalChartTool; label: string; kind: "select" | "surface" | "tooth" | "erase" }

export const DENTAL_CHART_TOOLS: readonly ToolDef[] = [
  { value: "select", label: "Select", kind: "select" },
  { value: "caries", label: "Caries", kind: "surface" },
  { value: "amalgam", label: "Amalgam", kind: "surface" },
  { value: "composite", label: "Composite", kind: "surface" },
  { value: "sealant", label: "Sealant", kind: "surface" },
  { value: "crown", label: "Crown", kind: "tooth" },
  { value: "root-canal", label: "Root canal", kind: "tooth" },
  { value: "implant", label: "Implant", kind: "tooth" },
  { value: "pontic", label: "Pontic", kind: "tooth" },
  { value: "extraction", label: "Extraction", kind: "tooth" },
  { value: "missing", label: "Missing", kind: "tooth" },
  { value: "fracture", label: "Fracture", kind: "tooth" },
  { value: "watch", label: "Watch", kind: "tooth" },
  { value: "erase", label: "Erase", kind: "erase" },
]
const TOOL_KIND = Object.fromEntries(DENTAL_CHART_TOOLS.map((t) => [t.value, t.kind])) as Record<
  DentalChartTool,
  ToolDef["kind"]
>

function surfaceConditionForTool(tool: DentalChartTool, status: FindingStatus): SurfaceCondition {
  if (tool === "amalgam" || tool === "composite")
    return { type: "restoration", material: tool, status }
  return { type: tool as SurfaceConditionType, status: tool === "caries" ? "existing" : status }
}

const sameSurface = (a?: SurfaceCondition, b?: SurfaceCondition) =>
  !!a &&
  !!b &&
  a.type === b.type &&
  a.material === b.material &&
  (a.status ?? "existing") === (b.status ?? "existing")

/**
 * Apply a paint tool to a tooth (or one surface) and return the next value.
 * Painting the same finding again removes it. Exported for custom toolbars.
 */
export function applyDentalTool(
  value: DentalChartValue,
  tooth: ToothId,
  tool: DentalChartTool,
  status: FindingStatus = "existing",
  surface?: Surface
): DentalChartValue {
  const kind = TOOL_KIND[tool]
  if (kind === "select") return value
  const prev: ToothRecord = value[tooth] ?? { conditions: [] }
  let next: ToothRecord | undefined

  if (kind === "erase") {
    if (surface) {
      const surfaces = { ...prev.surfaces }
      delete surfaces[surface]
      next = { ...prev, surfaces }
    } else next = undefined
  } else if (kind === "surface") {
    const s = surface ?? "O"
    const cond = surfaceConditionForTool(tool, status)
    const surfaces = { ...prev.surfaces }
    if (sameSurface(surfaces[s], cond)) delete surfaces[s]
    else surfaces[s] = cond
    next = { ...prev, surfaces }
  } else {
    const type = tool as ToothConditionType
    const st: FindingStatus = DIAGNOSES.has(type) ? "existing" : status
    const existing = prev.conditions.find((c) => c.type === type)
    const others = prev.conditions.filter((c) => c.type !== type)
    next = {
      ...prev,
      conditions:
        existing && (existing.status ?? "existing") === st ? others : [...others, { type, status: st }],
    }
  }

  const result = { ...value }
  if (
    !next ||
    (next.conditions.length === 0 &&
      Object.keys(next.surfaces ?? {}).length === 0 &&
      !next.note)
  ) {
    delete result[tooth]
  } else {
    if (next.surfaces && Object.keys(next.surfaces).length === 0) delete next.surfaces
    result[tooth] = next
  }
  return result
}

/* -------------------------------------------------------------------------- */
/*                                   Styling                                  */
/* -------------------------------------------------------------------------- */

function surfaceFillClass(c: SurfaceCondition): string {
  if (c.type === "caries") return "fill-clinical-critical"
  if (c.type === "sealant") return "fill-clinical-normal"
  return c.material === "amalgam" ? "fill-clinical-info" : "fill-primary"
}
function surfaceStrokeClass(c: SurfaceCondition): string {
  if (c.type === "caries") return "stroke-clinical-critical"
  if (c.type === "sealant") return "stroke-clinical-normal"
  return c.material === "amalgam" ? "stroke-clinical-info" : "stroke-primary"
}

/* -------------------------------------------------------------------------- */
/*                                  Geometry                                  */
/* -------------------------------------------------------------------------- */

/*
 * Original, simplified tooth outlines in a 24 × 36 box, drawn root-up (upper arch
 * orientation). Lower teeth are mirrored vertically so roots point down.
 * The crown occupies roughly y 17–35, the cemento-enamel junction sits near y 17.
 */
const TOOTH_PATHS: Record<ToothType, string> = {
  incisor:
    "M10.6 2.2C11 0.9 13 0.9 13.4 2.2L15.4 16.6C17.6 17.6 18.4 20 18.4 23L18 32.4C17.9 34 16.9 34.6 15.4 34.6H8.6C7.1 34.6 6.1 34 6 32.4L5.6 23C5.6 20 6.4 17.6 8.6 16.6Z",
  canine:
    "M10.4 1.2C10.9-0.2 13.1-0.2 13.6 1.2L15.6 16C18 17.4 19.2 20 19.2 23.4C19.2 27 16.6 31 12 35C7.4 31 4.8 27 4.8 23.4C4.8 20 6 17.4 8.4 16Z",
  premolar:
    "M10 2.2C10.5 0.9 13.5 0.9 14 2.2L16 16C18.6 17 20 19.6 20 23.2L19.6 30.6C19.3 33.4 17.6 34.8 15.4 33.4L12 31.6L8.6 33.4C6.4 34.8 4.7 33.4 4.4 30.6L4 23.2C4 19.6 5.4 17 8 16Z",
  molar:
    "M4.6 17.6L3.6 4.2C3.5 2.6 6.4 2.4 7 4L10 12.8C11 11.8 13 11.8 14 12.8L17 4C17.6 2.4 20.5 2.6 20.4 4.2L19.4 17.6C21.5 18.6 22.6 20.8 22.6 24L22.1 30.6C21.9 33.6 20 34.9 17.9 33.6L15.5 32.2L12 33.8L8.5 32.2L6.1 33.6C4 34.9 2.1 33.6 1.9 30.6L1.4 24C1.4 20.8 2.5 18.6 4.6 17.6Z",
}

/* Crown bounds for the crown ring, pontic body and fracture line. */
const CROWN_BOX: Record<ToothType, { x: number; w: number }> = {
  incisor: { x: 4.8, w: 14.4 },
  canine: { x: 4, w: 16 },
  premolar: { x: 3.2, w: 17.6 },
  molar: { x: 0.8, w: 22.4 },
}

/* Canal lines (root canal treatment). */
const CANALS: Record<ToothType, string> = {
  incisor: "M12 3.5V18",
  canine: "M12 2.5V18",
  premolar: "M12 3.5V18",
  molar: "M5.6 5L7.4 18M18.4 5L16.6 18",
}

/* 5-surface diagram, 24 × 24, outer ring + centre (occlusal / incisal). */
const SURFACE_PATHS = {
  top: "M0.75 0.75H23.25L16.5 7.5H7.5Z",
  bottom: "M0.75 23.25H23.25L16.5 16.5H7.5Z",
  left: "M0.75 0.75V23.25L7.5 16.5V7.5Z",
  right: "M23.25 0.75V23.25L16.5 16.5V7.5Z",
  center: "M7.5 7.5H16.5V16.5H7.5Z",
}

/**
 * Where each surface is drawn for a tooth, viewer facing the patient: facial
 * surfaces on the outside of the chart, mesial toward the midline.
 */
function surfaceLayout(info: ToothInfo): Record<Surface, keyof typeof SURFACE_PATHS> {
  const mesialOnRight = info.side === "right" // patient's right is on the viewer's left
  return {
    M: mesialOnRight ? "right" : "left",
    D: mesialOnRight ? "left" : "right",
    O: "center",
    B: info.arch === "upper" ? "top" : "bottom",
    L: info.arch === "upper" ? "bottom" : "top",
  }
}

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "")

/* -------------------------------------------------------------------------- */
/*                                  ToothIcon                                 */
/* -------------------------------------------------------------------------- */

function hasCondition(record: ToothRecord | undefined, type: ToothConditionType) {
  return record?.conditions.find((c) => c.type === type)
}

const dashed = (c?: { status?: FindingStatus }) =>
  c?.status === "planned" ? "[stroke-dasharray:2_1.5]" : undefined

function ToothGraphic({
  info,
  record,
  selected,
}: {
  info: ToothInfo
  record?: ToothRecord
  selected?: boolean
}) {
  const clipId = `dc-${sanitizeId(React.useId())}`
  const missing = hasCondition(record, "missing")
  const extraction = hasCondition(record, "extraction")
  const extracted = extraction && extraction.status !== "planned"
  const implant = hasCondition(record, "implant")
  const crown = hasCondition(record, "crown")
  const rootCanal = hasCondition(record, "root-canal")
  const pontic = hasCondition(record, "pontic")
  const fracture = hasCondition(record, "fracture")
  const watch = hasCondition(record, "watch")
  const absent = !!(missing || extracted)
  const box = CROWN_BOX[info.type]
  const flip = info.arch === "lower" ? "translate(0 36) scale(1 -1)" : undefined
  const anyPlanned = record?.conditions.some((c) => c.status === "planned")

  return (
    <svg viewBox="0 0 24 36" aria-hidden="true" className="block h-10 w-full overflow-visible">
      <defs>
        <clipPath id={clipId}>
          <rect x="-2" y="16.4" width="28" height="22" />
        </clipPath>
      </defs>
      <g transform={flip}>
        <g className={cn(absent && "opacity-30")}>
          <path
            d={TOOTH_PATHS[info.type]}
            clipPath={pontic || implant ? `url(#${clipId})` : undefined}
            className={cn(
              "fill-[color-mix(in_oklab,var(--foreground)_6%,var(--background))] stroke-foreground/40 [stroke-linejoin:round] [stroke-width:0.9]",
              "transition-[fill] duration-150 motion-reduce:transition-none",
              selected && "fill-[color-mix(in_oklab,var(--primary)_22%,var(--background))]",
              anyPlanned && !crown && "[stroke-dasharray:2_1.5]"
            )}
          />
          {implant && (
            <g
              className={cn(
                "fill-none stroke-muted-foreground [stroke-linecap:round] [stroke-width:1.1]",
                dashed(implant)
              )}
            >
              <path d="M9.6 16.4V5.2L12 2.6L14.4 5.2V16.4Z" className="fill-muted" />
              <path d="M9.6 7.4L14.4 6.2M9.6 10.2L14.4 9M9.6 13L14.4 11.8" />
            </g>
          )}
          {rootCanal && !implant && !pontic && (
            <path
              d={CANALS[info.type]}
              className={cn(
                "fill-none stroke-clinical-info [stroke-linecap:round] [stroke-width:1.6]",
                dashed(rootCanal)
              )}
            />
          )}
          {crown && (
            <rect
              x={box.x}
              y={16.2}
              width={box.w}
              height={19.4}
              rx={4}
              className={cn("fill-none stroke-primary [stroke-width:1.6]", dashed(crown))}
            />
          )}
          {pontic && (
            <path
              d="M-1.5 17.6H25.5"
              className={cn(
                "fill-none stroke-primary [stroke-linecap:round] [stroke-width:2]",
                dashed(pontic)
              )}
            />
          )}
          {fracture && (
            <path
              d={`M${box.x + 1.5} 22.5L${box.x + box.w * 0.35} 26L${box.x + box.w * 0.6} 23L${box.x + box.w - 1.5} 27.5`}
              className="fill-none stroke-clinical-abnormal [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5]"
            />
          )}
        </g>
      </g>
      {(missing || extraction) && (
        <path
          d="M4 6L20 30M20 6L4 30"
          className={cn(
            "fill-none [stroke-linecap:round] [stroke-width:1.8]",
            missing ? "stroke-muted-foreground" : "stroke-clinical-critical",
            dashed(extraction)
          )}
        />
      )}
      {watch && (
        <circle
          cx={21}
          cy={info.arch === "upper" ? 3 : 33}
          r={2.6}
          className="fill-clinical-watch stroke-background [stroke-width:0.8]"
        />
      )}
    </svg>
  )
}

const isAbsent = (record?: ToothRecord) =>
  !!record?.conditions.some(
    (c) => c.type === "missing" || (c.type === "extraction" && c.status !== "planned")
  )

/** One surface of a 5-surface diagram, shared by the rows and arch layouts. */
function SurfacePath({
  d,
  surface,
  cond,
  selected,
  interactive,
  nonScaling,
  onClick,
}: {
  d: string
  surface: Surface
  cond?: SurfaceCondition
  selected?: boolean
  interactive: boolean
  /** Keep stroke widths in screen pixels (arch layout draws in millimetre units). */
  nonScaling?: boolean
  onClick?: (surface: Surface, event: React.MouseEvent) => void
}) {
  const planned = cond?.status === "planned"
  return (
    <path
      d={d}
      data-surface={surface}
      onClick={onClick ? (e) => onClick(surface, e) : undefined}
      className={cn(
        "stroke-foreground/35 [stroke-linejoin:round] [stroke-width:0.8]",
        "transition-[fill,opacity] duration-150 motion-reduce:transition-none",
        nonScaling && "[vector-effect:non-scaling-stroke]",
        cond ? surfaceFillClass(cond) : "fill-background",
        planned && cond && ["[stroke-dasharray:2_1.2] [stroke-width:1.2]", surfaceStrokeClass(cond)],
        interactive && "cursor-pointer",
        interactive && !cond && "hover:fill-[color-mix(in_oklab,var(--primary)_25%,var(--background))]",
        interactive && cond && "hover:opacity-80",
        selected && "stroke-ring [stroke-width:2]"
      )}
      style={planned ? { fillOpacity: 0.35 } : undefined}
    />
  )
}

function SurfaceDiagram({
  info,
  record,
  selectedSurfaces,
  interactive,
  onSurfaceClick,
}: {
  info: ToothInfo
  record?: ToothRecord
  selectedSurfaces?: ReadonlySet<Surface>
  interactive: boolean
  onSurfaceClick?: (surface: Surface, event: React.MouseEvent) => void
}) {
  const layout = surfaceLayout(info)
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("block size-7 overflow-visible", isAbsent(record) && "opacity-40")}
    >
      {SURFACES.map((s) => (
        <SurfacePath
          key={s}
          d={SURFACE_PATHS[layout[s]]}
          surface={s}
          cond={record?.surfaces?.[s]}
          selected={selectedSurfaces?.has(s)}
          interactive={interactive}
          onClick={onSurfaceClick}
        />
      ))}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Arch (occlusal) view                          */
/* -------------------------------------------------------------------------- */

export type DentalChartLayout = "rows" | "arch"

type Pt = { x: number; y: number }

/*
 * Approximate crown sizes in millimetres: [mesiodistal, buccolingual] by tooth
 * position (1 = central incisor). Lower incisors are drawn slightly wider than
 * life so they stay tappable.
 */
const CROWN_DIMS: Record<Arch, Record<"permanent" | "primary", [number, number][]>> = {
  upper: {
    permanent: [[8.6, 7.2], [6.8, 6.4], [7.6, 8], [7, 9], [6.8, 9], [10.2, 11], [9.2, 11], [8.6, 10.4]],
    primary: [[6.5, 5.4], [5.4, 5], [7, 6.2], [7.3, 8.2], [8.6, 9.2]],
  },
  lower: {
    permanent: [[5.8, 6.2], [6.2, 6.4], [7, 7.6], [7, 7.8], [7.2, 8.2], [11, 10.4], [10.4, 10], [10, 9.6]],
    primary: [[4.8, 4.4], [5, 4.6], [5.8, 5.6], [7.7, 7], [9.6, 8.6]],
  },
}
/* Lingual / buccal width ratio of the crown outline (incisors are wedge-shaped). */
const LINGUAL_RATIO: Record<ToothType, number> = { incisor: 0.58, canine: 0.66, premolar: 0.86, molar: 0.92 }
const ARCH_CATENARY = 19 // catenary parameter (mm): radius of the arch at the midline
const ARCH_GAP = 0.8 // space between neighbouring crowns
const ARCH_LABEL_GAP = 3.2 // tooth edge → number
const PRIMARY_INSET = 10.5 // mixed dentition: primary arch sits this far inside the permanent arch
const JAW_GAP = 5

interface ArchToothGeom {
  id: ToothId
  info: ToothInfo
  x: number
  y: number
  /** Degrees; rotates the local frame so local −y (buccal) points out of the arch. */
  rotate: number
  w: number
  h: number
  /** Lingual (inner) width. */
  wl: number
  /** Whether the mesial surface is on the local +x side. */
  mesialRight: boolean
  label: Pt
}

interface ArchGeometry {
  rows: { arch: Arch; primary: boolean; teeth: ArchToothGeom[]; gum: string; gumWidth: number }[]
  palate: { d: string; label: Pt }
  tongue: { d: string; label: Pt }
  viewBox: { x: number; y: number; w: number; h: number }
}

/**
 * Catenary arch form, optionally offset inward, sampled and parameterised by
 * arc length from the midline. Returns position, distal tangent and inward
 * normal for the patient's-left half in "depth space" (x across, d into the mouth).
 */
function archCurve(inset: number) {
  const a = ARCH_CATENARY
  const pts: { x: number; d: number }[] = []
  for (let s = 0; s <= 110; s += 0.25) {
    const k = s / a
    const r = Math.sqrt(1 + k * k)
    // inward normal of the base curve is (-k, 1) / r
    pts.push({ x: a * Math.asinh(k) - (k / r) * inset, d: a * (r - 1) + inset / r })
  }
  const len = [0]
  for (let i = 1; i < pts.length; i++)
    len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].d - pts[i - 1].d))
  return (u: number) => {
    let i = 1
    while (i < len.length - 1 && len[i] < u) i++
    const t = (u - len[i - 1]) / (len[i] - len[i - 1] || 1)
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const seg = Math.hypot(p1.x - p0.x, p1.d - p0.d) || 1
    const tx = (p1.x - p0.x) / seg
    const td = (p1.d - p0.d) / seg
    return { x: p0.x + (p1.x - p0.x) * t, d: p0.d + (p1.d - p0.d) * t, tx, td }
  }
}

const fmt = (n: number) => Math.round(n * 100) / 100

function buildArchGeometry(dentition: Dentition): ArchGeometry {
  const rowsIn = getDentitionRows(dentition)
  const insetFor = (primary: boolean) => (dentition === "mixed" && primary ? PRIMARY_INSET : 0)

  const buildJaw = (arch: Arch, apexY: number) => {
    const v = arch === "upper" ? 1 : -1 // depth grows downward for the upper jaw, upward for the lower
    const rows: ArchGeometry["rows"] = []
    let innerMost: { curve: ReturnType<typeof archCurve>; end: number; edge: number } | null = null
    for (const row of rowsIn.filter((r) => r.arch === arch)) {
      const curve = archCurve(insetFor(row.primary))
      const dims = CROWN_DIMS[arch][row.primary ? "primary" : "permanent"]
      const centres: number[] = []
      let u = ARCH_GAP / 2
      for (const [w] of dims) {
        centres.push(u + w / 2)
        u += w + ARCH_GAP
      }
      const end = u
      const toWorld = (sigma: number, at: { x: number; d: number }) => ({
        x: sigma * at.x,
        y: apexY + v * at.d,
      })
      const teeth = row.teeth.map((id): ArchToothGeom => {
        const info = getToothInfo(id)!
        const [w, h] = dims[info.position - 1]
        const sigma = info.side === "right" ? -1 : 1 // patient's right is on the viewer's left
        const at = curve(centres[info.position - 1])
        const p = toWorld(sigma, at)
        const out = { x: sigma * at.td, y: -v * at.tx }
        const mesial = { x: -sigma * at.tx, y: -v * at.td }
        const theta = Math.atan2(out.x, -out.y)
        const mesialRight = Math.cos(theta) * mesial.x + Math.sin(theta) * mesial.y > 0
        // Inner (primary) arch of a mixed chart: number on the lingual side so it clears the outer arch.
        const ld = (h / 2 + ARCH_LABEL_GAP) * (insetFor(row.primary) ? -1 : 1)
        return {
          id,
          info,
          x: fmt(p.x),
          y: fmt(p.y),
          rotate: fmt((theta * 180) / Math.PI),
          w,
          h,
          wl: w * LINGUAL_RATIO[info.type],
          mesialRight,
          label: { x: fmt(p.x + out.x * ld), y: fmt(p.y + out.y * ld) },
        }
      })
      const maxH = Math.max(...dims.map(([, h]) => h))
      const gumPts: Pt[] = []
      for (let s = -(end + 0.6); s <= end + 0.6; s += 1) {
        const at = curve(Math.abs(s))
        gumPts.push(toWorld(s < 0 ? -1 : 1, at))
      }
      rows.push({
        arch,
        primary: row.primary,
        teeth,
        gum: "M" + gumPts.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join("L"),
        gumWidth: maxH + 3,
      })
      const edge = maxH / 2 + 1.8
      if (!innerMost || row.primary) innerMost = { curve, end, edge }
    }
    // Palate / tongue: the area inside the innermost arch.
    const { curve, end, edge } = innerMost!
    const inner = (extra: number, stop: number) => {
      const pts: Pt[] = []
      for (let s = -stop; s <= stop; s += 1) {
        const at = curve(Math.abs(s))
        const sigma = s < 0 ? -1 : 1
        const inwardX = -sigma * at.td
        const inwardD = at.tx
        pts.push({ x: sigma * at.x + inwardX * (edge + extra), y: apexY + v * (at.d + inwardD * (edge + extra)) })
      }
      return pts
    }
    const soft = inner(0.4, end * 0.94)
    const tongue = inner(2.2, end * 0.84)
    // Close the area with a soft curve toward the back of the mouth.
    const path = (pts: Pt[]) => {
      const last = pts[pts.length - 1]
      const back = { x: 0, y: last.y + v * Math.abs(last.x) * 0.35 }
      return (
        "M" + pts.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join("L") +
        `Q${fmt(back.x)} ${fmt(back.y)} ${fmt(pts[0].x)} ${fmt(pts[0].y)}Z`
      )
    }
    const centreDepth = curve(end * 0.78).d
    return {
      rows,
      soft: { d: path(soft), label: { x: 0, y: fmt(apexY + v * centreDepth) } },
      tongue: { d: path(tongue), label: { x: 0, y: fmt(apexY + v * centreDepth) } },
    }
  }

  const boundsOf = (rows: ArchGeometry["rows"]) => {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    const add = (x: number, y: number, rx: number, ry: number) => {
      minX = Math.min(minX, x - rx)
      maxX = Math.max(maxX, x + rx)
      minY = Math.min(minY, y - ry)
      maxY = Math.max(maxY, y + ry)
    }
    for (const row of rows) {
      for (const t of row.teeth) {
        const r = Math.max(t.w, t.h) / 2 + 1.5
        add(t.x, t.y, r + 1.5, r + 1.5)
        add(t.label.x, t.label.y, 3.4, 2.2)
      }
    }
    return { minX, maxX, minY, maxY }
  }

  const upper = buildJaw("upper", 0)
  const ub = boundsOf(upper.rows)
  const probe = boundsOf(buildJaw("lower", 0).rows)
  const lowerApex = ub.maxY - probe.minY + JAW_GAP
  const lower = buildJaw("lower", lowerApex)
  const lb = boundsOf(lower.rows)
  const halfW = Math.max(-ub.minX, ub.maxX, -lb.minX, lb.maxX) + 1
  const top = ub.minY - 1
  const bottom = lb.maxY + 1
  return {
    rows: [...upper.rows, ...lower.rows],
    palate: upper.soft,
    tongue: lower.tongue,
    viewBox: { x: fmt(-halfW), y: fmt(top), w: fmt(halfW * 2), h: fmt(bottom - top) },
  }
}

/** Rounded polygon path (corner radius clamped to half of each edge). */
function roundedPolygon(points: Pt[], radius: number): string {
  const n = points.length
  let d = ""
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]
    const cur = points[i]
    const next = points[(i + 1) % n]
    const toward = (p: Pt) => {
      const len = Math.hypot(p.x - cur.x, p.y - cur.y)
      const r = Math.min(radius, len / 2)
      return { x: fmt(cur.x + ((p.x - cur.x) / len) * r), y: fmt(cur.y + ((p.y - cur.y) / len) * r) }
    }
    const a = toward(prev)
    const b = toward(next)
    d += `${i === 0 ? "M" : "L"}${a.x} ${a.y}Q${fmt(cur.x)} ${fmt(cur.y)} ${b.x} ${b.y}`
  }
  return d + "Z"
}

/** Occlusal crown outline + 5 surface regions in the tooth's local frame (buccal = −y). */
function occlusalShape(t: Pick<ArchToothGeom, "w" | "h" | "wl" | "info">) {
  const { w, h, wl } = t
  const outer = { tl: { x: -w / 2, y: -h / 2 }, tr: { x: w / 2, y: -h / 2 }, br: { x: wl / 2, y: h / 2 }, bl: { x: -wl / 2, y: h / 2 } }
  const k = t.info.type === "incisor" ? 0.36 : 0.44
  const yShift = t.info.type === "incisor" || t.info.type === "canine" ? -h * 0.06 : 0
  const inner = {
    tl: { x: outer.tl.x * k, y: outer.tl.y * k + yShift },
    tr: { x: outer.tr.x * k, y: outer.tr.y * k + yShift },
    br: { x: outer.br.x * k, y: outer.br.y * k + yShift },
    bl: { x: outer.bl.x * k, y: outer.bl.y * k + yShift },
  }
  // Extend surface wedges past the outline; the rounded outline clips them.
  const grow = (p: Pt) => ({ x: p.x * 1.3, y: p.y * 1.3 })
  const o = { tl: grow(outer.tl), tr: grow(outer.tr), br: grow(outer.br), bl: grow(outer.bl) }
  const poly = (...pts: Pt[]) => "M" + pts.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join("L") + "Z"
  return {
    outline: roundedPolygon([outer.tl, outer.tr, outer.br, outer.bl], Math.min(w, h) * 0.32),
    regions: {
      top: poly(o.tl, o.tr, inner.tr, inner.tl),
      bottom: poly(o.bl, o.br, inner.br, inner.bl),
      left: poly(o.tl, inner.tl, inner.bl, o.bl),
      right: poly(o.tr, o.br, inner.br, inner.tr),
      center: poly(inner.tl, inner.tr, inner.br, inner.bl),
    } satisfies Record<keyof typeof SURFACE_PATHS, string>,
  }
}

function ArchTooth({
  geom,
  record,
  number,
  selected,
  selectedSurfaces,
  interactive,
  onSurfaceClick,
}: {
  geom: ArchToothGeom
  record?: ToothRecord
  number: string
  selected: boolean
  selectedSurfaces: ReadonlySet<Surface>
  interactive: boolean
  onSurfaceClick?: (surface: Surface, event: React.MouseEvent) => void
}) {
  const clipId = `dca-${sanitizeId(React.useId())}`
  const { w, h, info } = geom
  const shape = React.useMemo(() => occlusalShape(geom), [geom])
  const place: Record<Surface, keyof typeof SURFACE_PATHS> = {
    M: geom.mesialRight ? "right" : "left",
    D: geom.mesialRight ? "left" : "right",
    O: "center",
    B: "top",
    L: "bottom",
  }
  const missing = hasCondition(record, "missing")
  const extraction = hasCondition(record, "extraction")
  const implant = hasCondition(record, "implant")
  const crown = hasCondition(record, "crown")
  const rootCanal = hasCondition(record, "root-canal")
  const pontic = hasCondition(record, "pontic")
  const fracture = hasCondition(record, "fracture")
  const watch = hasCondition(record, "watch")
  const absent = isAbsent(record)
  const anyPlanned = record?.conditions.some((c) => c.status === "planned")
  const ns = "[vector-effect:non-scaling-stroke]"
  const m = Math.min(w, h)
  const canals =
    info.type === "molar"
      ? [{ x: -w * 0.2, y: -h * 0.16 }, { x: w * 0.2, y: -h * 0.16 }, { x: 0, y: h * 0.2 }]
      : info.type === "premolar"
        ? [{ x: 0, y: -h * 0.16 }, { x: 0, y: h * 0.16 }]
        : [{ x: 0, y: 0 }]

  return (
    <>
      <g transform={`translate(${geom.x} ${geom.y}) rotate(${geom.rotate})`}>
        <defs>
          <clipPath id={clipId}>
            <path d={shape.outline} />
          </clipPath>
        </defs>
        {/* focus + selection halo */}
        <path
          d={shape.outline}
          className={cn(
            "fill-none stroke-ring/50 opacity-0 [stroke-width:6] [vector-effect:non-scaling-stroke]",
            "group-focus-visible/tooth:opacity-100"
          )}
        />
        {selected && (
          <path d={shape.outline} className="fill-none stroke-primary/45 [stroke-width:4] [vector-effect:non-scaling-stroke]" />
        )}
        <g className={cn(absent && "opacity-30")}>
          <g clipPath={`url(#${clipId})`}>
            {SURFACES.map((s) => (
              <SurfacePath
                key={s}
                d={shape.regions[place[s]]}
                surface={s}
                cond={record?.surfaces?.[s]}
                selected={selectedSurfaces.has(s)}
                interactive={interactive}
                nonScaling
                onClick={onSurfaceClick}
              />
            ))}
          </g>
          <path
            d={shape.outline}
            className={cn(
              "pointer-events-none fill-none stroke-foreground/45 [stroke-linejoin:round] [stroke-width:1]",
              ns,
              selected && "stroke-primary [stroke-width:1.5]",
              anyPlanned && !crown && "[stroke-dasharray:3_2]"
            )}
          />
          <g className="pointer-events-none">
            {implant && (
              <g className={cn("stroke-muted-foreground [stroke-width:1.2]", ns, dashed(implant))}>
                <circle r={m * 0.24} className="fill-muted" />
                <circle r={m * 0.1} className="fill-none" />
              </g>
            )}
            {rootCanal &&
              !implant &&
              !pontic &&
              canals.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r={m * 0.085}
                  className={cn(
                    rootCanal.status === "planned"
                      ? "fill-none stroke-clinical-info [stroke-width:1.2] [stroke-dasharray:2_1.5]"
                      : "fill-clinical-info stroke-background [stroke-width:0.8]",
                    ns
                  )}
                />
              ))}
            {crown && (
              <path
                d={shape.outline}
                transform="scale(1.16)"
                className={cn("fill-none stroke-primary [stroke-width:1.8]", ns, dashed(crown))}
              />
            )}
            {pontic && (
              <path
                d={`M${fmt(-w / 2 - 1.4)} 0H${fmt(w / 2 + 1.4)}`}
                className={cn("fill-none stroke-primary [stroke-linecap:round] [stroke-width:2.2]", ns, dashed(pontic))}
              />
            )}
            {fracture && (
              <path
                d={`M${fmt(-w * 0.42)} ${fmt(-h * 0.1)}L${fmt(-w * 0.14)} ${fmt(h * 0.12)}L${fmt(w * 0.1)} ${fmt(-h * 0.14)}L${fmt(w * 0.42)} ${fmt(h * 0.1)}`}
                className={cn(
                  "fill-none stroke-clinical-abnormal [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.6]",
                  ns
                )}
              />
            )}
          </g>
        </g>
        <g className="pointer-events-none">
          {(missing || extraction) && (
            <path
              d={`M${fmt(-w * 0.42)} ${fmt(-h * 0.42)}L${fmt(w * 0.42)} ${fmt(h * 0.42)}M${fmt(w * 0.42)} ${fmt(-h * 0.42)}L${fmt(-w * 0.42)} ${fmt(h * 0.42)}`}
              className={cn(
                "fill-none [stroke-linecap:round] [stroke-width:1.8]",
                ns,
                missing ? "stroke-muted-foreground" : "stroke-clinical-critical",
                dashed(extraction)
              )}
            />
          )}
          {watch && (
            <circle
              cx={fmt(w / 2 - 0.6)}
              cy={fmt(-h / 2 + 0.6)}
              r={1.3}
              className={cn("fill-clinical-watch stroke-background [stroke-width:0.8]", ns)}
            />
          )}
          {record?.note && (
            <circle cx={fmt(-w / 2 + 0.6)} cy={fmt(-h / 2 + 0.6)} r={0.9} className="fill-clinical-info" />
          )}
        </g>
      </g>
      <g className={cn(interactive ? "cursor-pointer" : "cursor-default")}>
        <circle cx={geom.label.x} cy={geom.label.y} r={2.8} className="fill-transparent" />
        <text
          x={geom.label.x}
          y={geom.label.y}
          textAnchor="middle"
          dominantBaseline="central"
          className={cn(
            "text-[3px] font-medium tabular-nums select-none",
            selected ? "fill-primary font-semibold" : "fill-muted-foreground"
          )}
        >
          {number}
        </text>
      </g>
    </>
  )
}

function OrientationRow({ jaw, className }: { jaw: "Upper" | "Lower"; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex justify-between px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase",
        className
      )}
    >
      <span>Patient right</span>
      <span>{jaw}</span>
      <span>Patient left</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const isControlled = controlled !== undefined
  const value = isControlled ? controlled : uncontrolled
  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next)
      onChange?.(next)
    },
    [isControlled, onChange]
  )
  return [value, setValue] as const
}

const SURFACE_KEYS: Record<string, Surface> = {
  m: "M",
  o: "O",
  i: "O",
  d: "D",
  b: "B",
  f: "B",
  l: "L",
  p: "L",
}

/* -------------------------------------------------------------------------- */
/*                                 DentalChart                                */
/* -------------------------------------------------------------------------- */

export interface DentalChartProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  dentition?: Dentition
  numbering?: NumberingSystem
  /** Controlled findings. */
  value?: DentalChartValue
  /** Initial findings when uncontrolled. */
  defaultValue?: DentalChartValue
  onValueChange?: (value: DentalChartValue) => void
  /** Controlled selection: tooth ids (`"36"`) and surface keys (`"36:O"`). */
  selected?: string[]
  defaultSelected?: string[]
  onSelectedChange?: (selected: string[]) => void
  /** Controlled active tool. */
  tool?: DentalChartTool
  defaultTool?: DentalChartTool
  onToolChange?: (tool: DentalChartTool) => void
  /** Status applied by treatment tools (diagnoses are always `existing`). */
  status?: FindingStatus
  defaultStatus?: FindingStatus
  onStatusChange?: (status: FindingStatus) => void
  /** Called on every tooth or surface activation, before the built-in handling. */
  onToothClick?: (tooth: ToothId, surface: Surface | undefined) => void
  /** Show the paint toolbar. Defaults to `true` unless `readOnly`. */
  showToolbar?: boolean
  /** Restrict the toolbar to these tools. */
  tools?: DentalChartTool[]
  /** Teeth are focusable and announce their findings but cannot be changed. */
  readOnly?: boolean
  /** Visible caption. Pass `null` to hide (the orientation stays in the accessible description). */
  caption?: React.ReactNode
  /**
   * Controlled layout: `"rows"` (straight rows with side-view teeth) or `"arch"`
   * (occlusal odontogram, teeth placed along the upper and lower jaw arches).
   */
  layout?: DentalChartLayout
  /** Initial layout when uncontrolled. */
  defaultLayout?: DentalChartLayout
  onLayoutChange?: (layout: DentalChartLayout) => void
  /** Show a Rows / Arch toggle in the toolbar. */
  showLayoutToggle?: boolean
}

const EMPTY_VALUE: DentalChartValue = {}
const EMPTY: string[] = []

export function DentalChart({
  dentition = "permanent",
  numbering = "fdi",
  value: valueProp,
  defaultValue = EMPTY_VALUE,
  onValueChange,
  selected: selectedProp,
  defaultSelected = EMPTY,
  onSelectedChange,
  tool: toolProp,
  defaultTool = "select",
  onToolChange,
  status: statusProp,
  defaultStatus = "existing",
  onStatusChange,
  onToothClick,
  showToolbar,
  tools,
  readOnly = false,
  caption,
  layout: layoutProp,
  defaultLayout = "rows",
  onLayoutChange,
  showLayoutToggle = false,
  className,
  ...props
}: DentalChartProps) {
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange)
  const [selected, setSelected] = useControllableState(selectedProp, defaultSelected, onSelectedChange)
  const [tool, setTool] = useControllableState(toolProp, defaultTool, onToolChange)
  const [status, setStatus] = useControllableState(statusProp, defaultStatus, onStatusChange)
  const [layout, setLayout] = useControllableState(layoutProp, defaultLayout, onLayoutChange)
  const [focusId, setFocusId] = React.useState<ToothId | null>(null)
  const buttons = React.useRef(new Map<ToothId, HTMLElement | SVGElement>())
  const descId = React.useId()

  const rows = React.useMemo(() => getDentitionRows(dentition), [dentition])
  const arch = React.useMemo(
    () => (layout === "arch" ? buildArchGeometry(dentition) : null),
    [layout, dentition]
  )
  const selectedSet = React.useMemo(() => new Set(selected), [selected])
  const tabStop = focusId && rows.some((r) => r.teeth.includes(focusId)) ? focusId : rows[0].teeth[0]
  const toolbar = showToolbar ?? !readOnly
  const paintToolbar = toolbar && !readOnly
  const toolDefs = tools ? DENTAL_CHART_TOOLS.filter((t) => tools.includes(t.value)) : DENTAL_CHART_TOOLS

  const activate = (tooth: ToothId, surface?: Surface) => {
    onToothClick?.(tooth, surface)
    if (readOnly) return
    if (tool === "select") {
      const key = surface ? `${tooth}:${surface}` : tooth
      setSelected(selectedSet.has(key) ? selected.filter((k) => k !== key) : [...selected, key])
      return
    }
    setValue(applyDentalTool(value, tooth, tool, status, surface))
  }

  /* Rows and arch share the same tooth order (patient right → left), so arrow keys follow the arch. */
  const move = (from: ToothId, key: string) => {
    const r = rows.findIndex((row) => row.teeth.includes(from))
    if (r < 0) return false
    const row = rows[r].teeth
    const i = row.indexOf(from)
    let target: ToothId | undefined
    if (key === "ArrowRight") target = row[Math.min(i + 1, row.length - 1)]
    else if (key === "ArrowLeft") target = row[Math.max(i - 1, 0)]
    else if (key === "Home") target = row[0]
    else if (key === "End") target = row[row.length - 1]
    else if (key === "ArrowUp" || key === "ArrowDown") {
      const nr = rows[r + (key === "ArrowUp" ? -1 : 1)]
      if (nr) {
        const j = Math.round(((i + 0.5) / row.length) * nr.teeth.length - 0.5)
        target = nr.teeth[Math.min(Math.max(j, 0), nr.teeth.length - 1)]
      } else target = from
    } else return false
    if (target) {
      setFocusId(target)
      buttons.current.get(target)?.focus()
    }
    return true
  }

  const toothRef = (id: ToothId) => (el: HTMLElement | SVGElement | null) => {
    if (el) buttons.current.set(id, el)
    else buttons.current.delete(id)
  }

  /** `native` = a real <button>, which already turns Enter/Space into a click. */
  const onToothKeyDown = (id: ToothId, e: React.KeyboardEvent, native: boolean) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    if (move(id, e.key)) {
      e.preventDefault()
      return
    }
    if (!native && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      activate(id)
      return
    }
    const s = SURFACE_KEYS[e.key.toLowerCase()]
    if (s && !readOnly) {
      e.preventDefault()
      activate(id, s)
    }
  }

  const surfaceClick = (id: ToothId) =>
    readOnly
      ? undefined
      : (s: Surface, e: React.MouseEvent) => {
          e.stopPropagation()
          buttons.current.get(id)?.focus()
          activate(id, s)
        }

  const toothA11y = (id: ToothId) => {
    const toothSelected = selectedSet.has(id)
    return {
      "data-tooth": id,
      "data-selected": toothSelected || undefined,
      "aria-label": describeTooth(id, value[id], numbering),
      "aria-pressed": tool === "select" && !readOnly ? toothSelected : undefined,
      tabIndex: id === tabStop ? 0 : -1,
      onFocus: () => setFocusId(id),
      onClick: () => activate(id),
    }
  }

  const toolKind = TOOL_KIND[tool]
  const statusApplies = toolKind === "surface" || toolKind === "tooth"
  const numberingName =
    numbering === "fdi" ? "FDI (ISO 3950)" : numbering === "universal" ? "ADA Universal" : "Palmer"

  return (
    <div
      data-slot="dental-chart"
      data-dentition={dentition}
      data-layout={layout}
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
      {...props}
    >
      {(paintToolbar || showLayoutToggle) && (
        <div className="flex flex-wrap items-center gap-2">
          {paintToolbar && (
            <>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                value={tool}
                onValueChange={(v) => v && setTool(v as DentalChartTool)}
                aria-label="Charting tool"
                className="flex-wrap"
              >
                {toolDefs.map((t) => (
                  <ToggleGroupItem key={t.value} value={t.value} className="gap-1.5 px-2.5 text-xs">
                    <ToolGlyph tool={t.value} />
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                value={status}
                onValueChange={(v) => v && setStatus(v as FindingStatus)}
                aria-label="Finding status"
                disabled={!statusApplies}
              >
                <ToggleGroupItem value="existing" className="px-2.5 text-xs">
                  Existing
                </ToggleGroupItem>
                <ToggleGroupItem value="planned" className="px-2.5 text-xs">
                  Planned
                </ToggleGroupItem>
              </ToggleGroup>
            </>
          )}
          {showLayoutToggle && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={layout}
              onValueChange={(v) => v && setLayout(v as DentalChartLayout)}
              aria-label="Chart layout"
              className={cn(paintToolbar && "ml-auto")}
            >
              <ToggleGroupItem value="rows" className="px-2.5 text-xs">
                Rows
              </ToggleGroupItem>
              <ToggleGroupItem value="arch" className="px-2.5 text-xs">
                Arch
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      )}

      {arch ? (
        <div
          role="group"
          aria-label="Dental chart"
          aria-describedby={descId}
          className="relative mx-auto flex w-full max-w-[30rem] flex-col"
        >
          <p id={descId} className="sr-only">
            {`Occlusal view of both jaws, facing the patient: upper jaw on top, lower jaw below, the patient's right on the viewer's left. Arrow keys move along the arch, Up and Down switch jaws; Enter or Space ${
              readOnly ? "reads" : tool === "select" ? "selects" : "applies the active tool to"
            } a tooth${readOnly ? "" : "; M, O, D, B or L apply it to a surface"}.`}
          </p>
          <OrientationRow jaw="Upper" className="pb-1" />
          <svg
            role="presentation"
            viewBox={`${arch.viewBox.x} ${arch.viewBox.y} ${arch.viewBox.w} ${arch.viewBox.h}`}
            className="block h-auto w-full overflow-visible"
          >
            <g aria-hidden="true" className="pointer-events-none">
              {/* palate and tongue */}
              <path
                d={arch.palate.d}
                className="fill-[color-mix(in_oklab,var(--clinical-critical)_5%,var(--background))]"
              />
              <path
                d={arch.tongue.d}
                className="fill-[color-mix(in_oklab,var(--clinical-critical)_7%,var(--background))]"
              />
              {[arch.palate, arch.tongue].map((area, i) => (
                <text
                  key={i}
                  x={area.label.x}
                  y={area.label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-muted-foreground/60 text-[2.6px] tracking-wider uppercase select-none"
                >
                  {i === 0 ? "Palate" : "Tongue"}
                </text>
              ))}
              {/* gums */}
              {arch.rows.map((row) => (
                <path
                  key={`gum-edge-${row.arch}-${row.primary}`}
                  d={row.gum}
                  strokeWidth={row.gumWidth + 0.7}
                  className="fill-none stroke-[color-mix(in_oklab,var(--clinical-critical)_16%,var(--muted))] [stroke-linecap:round] [stroke-linejoin:round]"
                />
              ))}
              {arch.rows.map((row) => (
                <path
                  key={`gum-${row.arch}-${row.primary}`}
                  d={row.gum}
                  strokeWidth={row.gumWidth}
                  className="fill-none stroke-[color-mix(in_oklab,var(--clinical-critical)_8%,var(--muted))] [stroke-linecap:round] [stroke-linejoin:round]"
                />
              ))}
              {/* midline */}
              <line
                x1={0}
                x2={0}
                y1={arch.viewBox.y}
                y2={arch.viewBox.y + arch.viewBox.h}
                className="stroke-border [stroke-dasharray:4_3] [stroke-width:1] [vector-effect:non-scaling-stroke]"
              />
            </g>
            {arch.rows.map((row) =>
              row.teeth.map((g) => (
                <g
                  key={g.id}
                  ref={toothRef(g.id)}
                  role="button"
                  {...toothA11y(g.id)}
                  onKeyDown={(e) => onToothKeyDown(g.id, e, false)}
                  className={cn("group/tooth outline-none", readOnly ? "cursor-default" : "cursor-pointer")}
                >
                  {value[g.id]?.note && <title>{value[g.id]?.note}</title>}
                  <ArchTooth
                    geom={g}
                    record={value[g.id]}
                    number={toothNumber(g.id, numbering)}
                    selected={selectedSet.has(g.id)}
                    selectedSurfaces={new Set(SURFACES.filter((s) => selectedSet.has(`${g.id}:${s}`)))}
                    interactive={!readOnly}
                    onSurfaceClick={surfaceClick(g.id)}
                  />
                </g>
              ))
            )}
          </svg>
          <OrientationRow jaw="Lower" className="pt-1" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div
            role="group"
            aria-label="Dental chart"
            aria-describedby={descId}
            className="relative mx-auto flex w-max flex-col"
          >
            <p id={descId} className="sr-only">
              {`Viewed facing the patient: the patient's right is on the viewer's left. Arrow keys move between teeth; Enter or Space ${
                readOnly ? "reads" : tool === "select" ? "selects" : "applies the active tool to"
              } a tooth${readOnly ? "" : "; M, O, D, B or L apply it to a surface"}.`}
            </p>
            <OrientationRow jaw="Upper" className="pb-1" />
            {rows.map((row, r) => {
              const prevArch = r > 0 ? rows[r - 1].arch : row.arch
              const half = row.teeth.length / 2
              return (
                <React.Fragment key={`${row.arch}-${row.primary}`}>
                  {prevArch !== row.arch && (
                    <div aria-hidden="true" className="my-1.5 border-t border-dashed border-border" />
                  )}
                  <div
                    className={cn(
                      "flex justify-center",
                      row.primary && dentition === "mixed" && (row.arch === "upper" ? "mt-1" : "mb-1")
                    )}
                  >
                    {row.teeth.map((id, i) => {
                      const info = getToothInfo(id)!
                      const record = value[id]
                      const toothSelected = selectedSet.has(id)
                      const selectedSurfaces = new Set(
                        SURFACES.filter((s) => selectedSet.has(`${id}:${s}`))
                      )
                      const upper = info.arch === "upper"
                      const label = (
                        <span
                          className={cn(
                            "text-[11px] leading-none font-medium tabular-nums",
                            toothSelected ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {toothNumber(id, numbering)}
                        </span>
                      )
                      const graphic = <ToothGraphic info={info} record={record} selected={toothSelected} />
                      const diagram = (
                        <SurfaceDiagram
                          info={info}
                          record={record}
                          selectedSurfaces={selectedSurfaces}
                          interactive={!readOnly}
                          onSurfaceClick={surfaceClick(id)}
                        />
                      )
                      return (
                        <button
                          key={id}
                          ref={toothRef(id)}
                          type="button"
                          {...toothA11y(id)}
                          title={record?.note}
                          onKeyDown={(e) => onToothKeyDown(id, e, true)}
                          className={cn(
                            "group/tooth relative flex w-10 shrink-0 flex-col items-center gap-1 rounded-md px-0.5 py-1 outline-none",
                            "transition-colors duration-150 motion-reduce:transition-none",
                            "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            !readOnly && "hover:bg-accent/60",
                            toothSelected && "bg-primary/10 ring-1 ring-primary/40",
                            i === half - 1 && "mr-1",
                            i === half && "ml-1",
                            readOnly ? "cursor-default" : "cursor-pointer",
                            row.primary && dentition === "mixed" && "w-9"
                          )}
                        >
                          {upper && label}
                          {upper ? graphic : diagram}
                          {upper ? diagram : graphic}
                          {!upper && label}
                          {record?.note && (
                            <span
                              aria-hidden="true"
                              className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-clinical-info"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </React.Fragment>
              )
            })}
            {/* midline */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-5 bottom-5 left-1/2 border-l border-dashed border-border"
            />
            <OrientationRow jaw="Lower" className="pt-1" />
          </div>
        </div>
      )}

      {caption !== null && (
        <p className="text-center text-xs text-muted-foreground">
          {caption ??
            (arch
              ? `${numberingName} numbering. Occlusal view facing the patient: the patient's right is on the viewer's left; buccal surfaces face out of the arch, mesial surfaces face the midline.`
              : `${numberingName} numbering. Chart viewed facing the patient: the patient's right is on the viewer's left.`)}
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Glyphs                                   */
/* -------------------------------------------------------------------------- */

/** Small 16px glyph for a tool / legend entry. */
function ToolGlyph({ tool, planned = false }: { tool: DentalChartTool | "planned"; planned?: boolean }) {
  const dash = planned ? "[stroke-dasharray:2_1.5]" : undefined
  const surfaceSquare = (fill: string, stroke?: string) => (
    <>
      <path d={SURFACE_PATHS.top} className="fill-background stroke-foreground/35 [stroke-width:1]" />
      <path d={SURFACE_PATHS.bottom} className="fill-background stroke-foreground/35 [stroke-width:1]" />
      <path d={SURFACE_PATHS.left} className="fill-background stroke-foreground/35 [stroke-width:1]" />
      <path d={SURFACE_PATHS.right} className="fill-background stroke-foreground/35 [stroke-width:1]" />
      <path
        d={SURFACE_PATHS.center}
        className={cn(fill, stroke ?? "stroke-foreground/35", "[stroke-width:1]", dash)}
        style={planned ? { fillOpacity: 0.35 } : undefined}
      />
    </>
  )
  let content: React.ReactNode
  switch (tool) {
    case "select":
      content = <path d="M6 3L18 13L12.5 13.8L15.5 20.5L13 21.5L10 15L6 18.5Z" className="fill-foreground/80" />
      break
    case "caries":
      content = surfaceSquare("fill-clinical-critical")
      break
    case "amalgam":
      content = surfaceSquare("fill-clinical-info", planned ? "stroke-clinical-info" : undefined)
      break
    case "composite":
      content = surfaceSquare("fill-primary", planned ? "stroke-primary" : undefined)
      break
    case "sealant":
      content = surfaceSquare("fill-clinical-normal", planned ? "stroke-clinical-normal" : undefined)
      break
    case "crown":
      content = (
        <rect x="3" y="5" width="18" height="15" rx="4" className={cn("fill-none stroke-primary [stroke-width:2.2]", dash)} />
      )
      break
    case "root-canal":
      content = (
        <>
          <path d={TOOTH_PATHS.premolar} transform="translate(2 0) scale(0.84 0.68)" className="fill-none stroke-foreground/40 [stroke-width:1.2]" />
          <path d="M12 2.5V13" className={cn("stroke-clinical-info [stroke-linecap:round] [stroke-width:2.4]", dash)} />
        </>
      )
      break
    case "implant":
      content = (
        <g className={cn("fill-none stroke-muted-foreground [stroke-linecap:round] [stroke-width:1.6]", dash)}>
          <path d="M9 21V6L12 2.5L15 6V21Z" className="fill-muted" />
          <path d="M9 9L15 7.5M9 13L15 11.5M9 17L15 15.5" />
        </g>
      )
      break
    case "pontic":
      content = (
        <>
          <rect x="6" y="9" width="12" height="12" rx="3" className="fill-none stroke-foreground/40 [stroke-width:1.2]" />
          <path d="M1 9H23" className={cn("stroke-primary [stroke-linecap:round] [stroke-width:2.4]", dash)} />
        </>
      )
      break
    case "extraction":
      content = (
        <path d="M5 5L19 19M19 5L5 19" className={cn("stroke-clinical-critical [stroke-linecap:round] [stroke-width:2.4]", dash)} />
      )
      break
    case "missing":
      content = (
        <>
          <rect x="5" y="4" width="14" height="16" rx="4" className="fill-none stroke-foreground/25 [stroke-width:1.2]" />
          <path d="M5 5L19 19M19 5L5 19" className="stroke-muted-foreground [stroke-linecap:round] [stroke-width:2.2]" />
        </>
      )
      break
    case "fracture":
      content = (
        <path d="M3 9L9 15L14 9L21 16" className="fill-none stroke-clinical-abnormal [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]" />
      )
      break
    case "watch":
      content = <circle cx="12" cy="12" r="6" className="fill-clinical-watch" />
      break
    case "erase":
      content = (
        <>
          <path d="M4 15L13 6L19 12L12 19H7Z" className="fill-none stroke-foreground/70 [stroke-linejoin:round] [stroke-width:1.8]" />
          <path d="M9 10L15 16M12 19H20" className="stroke-foreground/70 [stroke-linecap:round] [stroke-width:1.8]" />
        </>
      )
      break
    case "planned":
      content = (
        <rect x="3" y="5" width="18" height="15" rx="4" className="fill-none stroke-foreground/70 [stroke-dasharray:2.5_2] [stroke-width:1.8]" />
      )
      break
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 overflow-visible">
      {content}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                              DentalChartLegend                             */
/* -------------------------------------------------------------------------- */

const LEGEND_ITEMS: { tool: DentalChartTool | "planned"; label: string }[] = [
  { tool: "caries", label: "Caries" },
  { tool: "amalgam", label: "Amalgam restoration" },
  { tool: "composite", label: "Composite restoration" },
  { tool: "sealant", label: "Sealant" },
  { tool: "crown", label: "Crown" },
  { tool: "root-canal", label: "Root canal" },
  { tool: "implant", label: "Implant" },
  { tool: "pontic", label: "Bridge pontic" },
  { tool: "missing", label: "Missing / extracted" },
  { tool: "extraction", label: "Extraction" },
  { tool: "fracture", label: "Fracture" },
  { tool: "watch", label: "Watch" },
  { tool: "planned", label: "Planned (dashed)" },
]

export interface DentalChartLegendProps extends Omit<React.ComponentProps<"ul">, "children"> {
  /** Restrict to these entries. */
  items?: (DentalChartTool | "planned")[]
}

export function DentalChartLegend({ items, className, ...props }: DentalChartLegendProps) {
  const list = items ? LEGEND_ITEMS.filter((i) => items.includes(i.tool)) : LEGEND_ITEMS
  return (
    <ul
      data-slot="dental-chart-legend"
      aria-label="Dental chart legend"
      className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}
      {...props}
    >
      {list.map((item) => (
        <li key={item.tool} className="flex items-center gap-1.5">
          <ToolGlyph tool={item.tool} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/*                             DentalChartSummary                             */
/* -------------------------------------------------------------------------- */

export interface DentalChartSummaryProps extends Omit<React.ComponentProps<"div">, "children"> {
  value: DentalChartValue
  numbering?: NumberingSystem
  /** Only show findings with this status. */
  status?: FindingStatus
  emptyText?: React.ReactNode
}

export function DentalChartSummary({
  value,
  numbering = "fdi",
  status,
  emptyText = "No findings charted",
  className,
  ...props
}: DentalChartSummaryProps) {
  const findings = getDentalFindings(value, numbering).filter((f) => !status || f.status === status)
  const byTooth = new Map<ToothId, DentalFinding[]>()
  for (const f of findings) byTooth.set(f.tooth, [...(byTooth.get(f.tooth) ?? []), f])

  return (
    <div data-slot="dental-chart-summary" className={cn("text-sm", className)} {...props}>
      {byTooth.size === 0 ? (
        <p className="text-muted-foreground">{emptyText}</p>
      ) : (
        <ul aria-label="Dental findings" className="divide-y divide-border">
          {[...byTooth.entries()].map(([tooth, list]) => {
            const info = getToothInfo(tooth)
            const note = value[tooth]?.note
            return (
              <li key={tooth} className="flex gap-3 py-2 first:pt-0 last:pb-0">
                <span className="w-8 shrink-0 font-semibold tabular-nums">{toothNumber(tooth, numbering)}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs text-muted-foreground first-letter:uppercase">{info?.name}</span>
                  <ul className="flex flex-col gap-0.5">
                    {list.map((f, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-1.5">
                        <span>
                          <span className="sr-only">{f.number} </span>
                          {f.surfaceCode && (
                            <span className="mr-1 font-mono text-xs font-semibold">{f.surfaceCode}</span>
                          )}
                          {f.label.replace(/^planned /, "")}
                        </span>
                        {f.status === "planned" && (
                          <Badge variant="outline" className="h-4 border-dashed px-1.5 text-[10px]">
                            Planned
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                  {note && <p className="text-xs text-muted-foreground">{note}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
