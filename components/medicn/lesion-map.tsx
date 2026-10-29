"use client"

import * as React from "react"
import { Trash2Icon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"
import {
  BODY_REGIONS,
  getBodyRegionLabel,
  type BodyRegionId,
  type BodyView,
} from "@/components/medicn/body-map"

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

export const LESION_TYPES = [
  { value: "macule", label: "Macule" },
  { value: "papule", label: "Papule" },
  { value: "plaque", label: "Plaque" },
  { value: "nodule", label: "Nodule" },
  { value: "vesicle", label: "Vesicle" },
  { value: "pustule", label: "Pustule" },
  { value: "ulcer", label: "Ulcer" },
  { value: "wound", label: "Wound" },
  { value: "scar", label: "Scar" },
  { value: "naevus", label: "Naevus / mole" },
  { value: "other", label: "Other" },
] as const

export type LesionType = (typeof LESION_TYPES)[number]["value"]

export type LesionStatus = "new" | "stable" | "changed" | "resolved"

export const LESION_STATUSES: readonly {
  value: LesionStatus
  label: string
  tone: ClinicalStatus
}[] = [
  { value: "new", label: "New", tone: "watch" },
  { value: "changed", label: "Changed", tone: "critical" },
  { value: "stable", label: "Stable", tone: "normal" },
  { value: "resolved", label: "Resolved", tone: "unknown" },
]

export interface Lesion {
  id: string
  view: BodyView
  /** Normalised 0–1 position within the illustration (not anatomical coordinates). */
  x: number
  y: number
  /** Body-map region id, e.g. `back-forearm-left`. Auto-detected when a pin is placed or moved. */
  region: string
  label?: string
  type: LesionType
  /** Largest diameter in millimetres. */
  sizeMm?: number
  colour?: string
  notes?: string
  status: LesionStatus
  /** Date observed, any string (ISO `yyyy-mm-dd` recommended). */
  date?: string
}

const TYPE_LABELS = Object.fromEntries(LESION_TYPES.map((t) => [t.value, t.label])) as Record<
  LesionType,
  string
>
const STATUS_BY_VALUE = Object.fromEntries(LESION_STATUSES.map((s) => [s.value, s])) as Record<
  LesionStatus,
  (typeof LESION_STATUSES)[number]
>

export function getLesionTypeLabel(type: LesionType): string {
  return TYPE_LABELS[type] ?? type
}

export function getLesionStatusLabel(status: LesionStatus): string {
  return STATUS_BY_VALUE[status]?.label ?? status
}

/** "#3 Back of forearm (left)" — `number` is the 1-based pin number. */
export function getLesionTitle(lesion: Lesion, number: number): string {
  return `#${number} ${getBodyRegionLabel(lesion.region)}`
}

/* -------------------------------------------------------------------------- */
/*                                  Geometry                                  */
/* -------------------------------------------------------------------------- */

/*
 * The silhouette and region cells below are kept in sync with body-map.tsx,
 * which does not export its geometry. Region *ids* and labels are imported, and
 * `REGION_CELLS` is typed against `BodyRegionId`, so a region added or renamed
 * there is a type error here.
 */

type Pt = readonly [number, number]
type Cubic = readonly [number, number, number, number, number, number]

const CX = 120
const VIEWBOX = "28 2 184 496"
const [VB_X, VB_Y, VB_W, VB_H] = VIEWBOX.split(" ").map(Number)

// kept in sync with body-map.tsx (HALF_START / HALF)
const HALF_START: Pt = [120, 10]
const HALF: readonly Cubic[] = [
  [107, 10, 97.5, 19.5, 97, 34],
  [96.6, 45, 97.5, 53, 100, 59.5],
  [102.5, 65.5, 105.5, 70, 110, 72.5],
  [110.6, 78, 110.6, 84, 109.4, 88.5],
  [104, 92.5, 91, 95, 80, 99],
  [70, 102.5, 63.5, 110, 63, 123],
  [62.5, 141, 58.5, 160, 57.5, 176],
  [57, 186, 55, 195, 53.5, 204],
  [51.5, 221, 48.5, 242, 46.5, 259],
  [44.5, 265, 41, 272, 40.5, 280],
  [40, 288, 41.5, 296, 42, 303],
  [43, 314, 47.5, 323, 53, 323],
  [58.5, 323, 61.5, 315, 62.3, 304],
  [63.2, 292, 64, 279, 62.5, 266],
  [62.5, 248, 66, 229, 69, 214],
  [70, 207, 71, 201.5, 72, 196],
  [74, 176, 77, 157, 80, 147],
  [81.5, 141.5, 83, 137.5, 84.5, 136],
  [86, 140, 87, 151, 87, 163],
  [87, 178, 84.5, 192, 84.5, 205],
  [84.5, 222, 77, 238, 76, 256],
  [75, 281, 76, 310, 80.5, 335],
  [83, 346, 84, 355, 83.2, 365],
  [82, 376, 79.5, 390, 81, 410],
  [83, 430, 89.5, 448, 91, 460],
  [91.5, 468, 87.5, 478, 87.5, 485],
  [87.5, 490, 92, 492, 99, 492],
  [104, 492, 108, 492, 111, 491],
  [114, 490, 114.5, 486, 113.5, 481],
  [112.5, 474, 109.5, 467, 109, 458],
  [107.5, 444, 104, 424, 104.5, 404],
  [105, 388, 107.5, 374, 107.5, 362],
  [107.5, 352, 108.5, 344, 109.5, 337],
  [112, 314, 116.5, 291, 118.5, 280],
  [119, 276, 119.5, 273, 120, 272],
]

const mirrorX = (x: number) => 2 * CX - x

const OUTLINE_PATH = (() => {
  const f = (n: number) => +n.toFixed(2)
  let d = `M${HALF_START[0]} ${HALF_START[1]}`
  for (const c of HALF) d += `C${c.map(f).join(" ")}`
  for (let i = HALF.length - 1; i >= 0; i--) {
    const c = HALF[i]
    const start = i === 0 ? HALF_START : ([HALF[i - 1][4], HALF[i - 1][5]] as Pt)
    d += `C${[mirrorX(c[2]), c[3], mirrorX(c[0]), c[1], mirrorX(start[0]), start[1]].map(f).join(" ")}`
  }
  return d + "Z"
})()

// kept in sync with body-map.tsx (DETAIL_HALF)
const DETAIL_HALF: Record<BodyView, string[]> = {
  front: [
    "M108 95.5C101 97 92 98.5 84 100.5",
    "M89 149C96 158 106 160 116.5 156",
    "M95.5 351C92.5 351 91.5 354.5 92 357.5C92.5 361 98.5 361 99 357.5C99.5 354.5 98.5 351 95.5 351",
  ],
  back: [
    "M105 112C101.5 126 101 140 106.5 152",
    "M92 117C96 116 101 116 104.5 113",
    "M86 293.5C95 299 108 298.5 117.5 293.5",
    "M88 358C93 360.5 99 360.5 104 358",
  ],
}
const mirrorPath = (d: string) =>
  d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_, x: string, y: string) => `${+mirrorX(Number(x)).toFixed(2)} ${y}`)
const DETAIL_PATHS: Record<BodyView, string> = {
  front: [...DETAIL_HALF.front, ...DETAIL_HALF.front.map(mirrorPath)].join("") + "M120 214a1.1 1.6 0 1 0 0.01 0Z",
  back: [...DETAIL_HALF.back, ...DETAIL_HALF.back.map(mirrorPath)].join(""),
}

// kept in sync with body-map.tsx (seams, CELL, REGION_CELLS). Inside the
// silhouette these convex cells tile the body exactly as body-map's regions do.
const SEAM_ARMPIT: Pt = [84.5, 136]
const SEAM_WAIST: Pt = [77.5, 205]
const SEAM_HIP: Pt = [68.5, 250]
const lerpSeam = (a: Pt, b: Pt, y: number): Pt => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]
const ARM_SEAM_188 = lerpSeam(SEAM_ARMPIT, SEAM_WAIST, 188)
const CHEST_SEAM_170 = lerpSeam(SEAM_ARMPIT, SEAM_WAIST, 170)
const ARM_SEAM_214 = lerpSeam(SEAM_WAIST, SEAM_HIP, 214)
const GROIN: Pt = [120, 292]
const INGUINAL_242 = lerpSeam(SEAM_WAIST, GROIN, 242)
const INGUINAL_268 = lerpSeam(SEAM_WAIST, GROIN, 268)
const Y_FACE = 44
const Y_NECK = 75
const Y_THIGH = 340
const Y_KNEE = 374
const Y_ANKLE = 452

const CELL = {
  head: [[20, 0], [220, 0], [220, Y_FACE], [20, Y_FACE]],
  face: [[20, Y_FACE], [220, Y_FACE], [220, Y_NECK], [20, Y_NECK]],
  headBack: [[20, 0], [220, 0], [220, Y_NECK], [20, Y_NECK]],
  neck: [[97, Y_NECK], [143, Y_NECK], [143, 92], [120, 100], [97, 92]],
  shoulder: [[0, Y_NECK], [97, Y_NECK], [97, 92], SEAM_ARMPIT, [0, 166]],
  chest: [[97, 92], [120, 100], [120, 170], CHEST_SEAM_170, SEAM_ARMPIT],
  upperBack: [[97, 92], [120, 100], [120, 205], SEAM_WAIST, SEAM_ARMPIT],
  upperArm: [[0, 166], SEAM_ARMPIT, ARM_SEAM_188, [0, 188]],
  elbow: [[0, 188], ARM_SEAM_188, SEAM_WAIST, ARM_SEAM_214, [0, 214]],
  forearm: [[0, 214], ARM_SEAM_214, SEAM_HIP, [SEAM_HIP[0], 262], [0, 262]],
  hand: [[0, 262], [SEAM_HIP[0], 262], [SEAM_HIP[0], Y_THIGH], [0, Y_THIGH]],
  upperAbdomen: [CHEST_SEAM_170, [mirrorX(CHEST_SEAM_170[0]), 170], [mirrorX(SEAM_WAIST[0]), 205], SEAM_WAIST],
  lowerAbdomen: [SEAM_WAIST, [mirrorX(SEAM_WAIST[0]), 205], [mirrorX(INGUINAL_242[0]), 242], INGUINAL_242],
  pelvis: [INGUINAL_242, [mirrorX(INGUINAL_242[0]), 242], GROIN],
  hip: [SEAM_WAIST, INGUINAL_268, [SEAM_HIP[0], 284], SEAM_HIP],
  thigh: [[SEAM_HIP[0], 284], INGUINAL_268, GROIN, [120, Y_THIGH], [SEAM_HIP[0], Y_THIGH]],
  lowerBack: [SEAM_WAIST, [120, 205], [120, 250], SEAM_HIP],
  buttock: [SEAM_HIP, [120, 250], [120, 303], [SEAM_HIP[0], 303]],
  thighBack: [[SEAM_HIP[0], 303], [120, 303], [120, Y_THIGH], [SEAM_HIP[0], Y_THIGH]],
  knee: [[0, Y_THIGH], [120, Y_THIGH], [120, Y_KNEE], [0, Y_KNEE]],
  shin: [[0, Y_KNEE], [120, Y_KNEE], [120, Y_ANKLE], [0, Y_ANKLE]],
  foot: [[0, Y_ANKLE], [120, Y_ANKLE], [120, 520], [0, 520]],
} satisfies Record<string, readonly Pt[]>

type CellName = keyof typeof CELL

const REGION_CELLS: Record<BodyRegionId, [CellName, boolean]> = {
  "front-head": ["head", false],
  "front-face": ["face", false],
  "front-neck": ["neck", false],
  "front-shoulder-right": ["shoulder", false],
  "front-shoulder-left": ["shoulder", true],
  "front-chest-right": ["chest", false],
  "front-chest-left": ["chest", true],
  "front-upper-arm-right": ["upperArm", false],
  "front-upper-arm-left": ["upperArm", true],
  "front-elbow-right": ["elbow", false],
  "front-elbow-left": ["elbow", true],
  "front-forearm-right": ["forearm", false],
  "front-forearm-left": ["forearm", true],
  "front-hand-right": ["hand", false],
  "front-hand-left": ["hand", true],
  "front-upper-abdomen": ["upperAbdomen", false],
  "front-lower-abdomen": ["lowerAbdomen", false],
  "front-pelvis": ["pelvis", false],
  "front-hip-right": ["hip", false],
  "front-hip-left": ["hip", true],
  "front-thigh-right": ["thigh", false],
  "front-thigh-left": ["thigh", true],
  "front-knee-right": ["knee", false],
  "front-knee-left": ["knee", true],
  "front-shin-right": ["shin", false],
  "front-shin-left": ["shin", true],
  "front-foot-right": ["foot", false],
  "front-foot-left": ["foot", true],
  "back-head": ["headBack", false],
  "back-neck": ["neck", false],
  "back-shoulder-left": ["shoulder", false],
  "back-shoulder-right": ["shoulder", true],
  "back-upper-back-left": ["upperBack", false],
  "back-upper-back-right": ["upperBack", true],
  "back-upper-arm-left": ["upperArm", false],
  "back-upper-arm-right": ["upperArm", true],
  "back-elbow-left": ["elbow", false],
  "back-elbow-right": ["elbow", true],
  "back-forearm-left": ["forearm", false],
  "back-forearm-right": ["forearm", true],
  "back-hand-left": ["hand", false],
  "back-hand-right": ["hand", true],
  "back-lower-back-left": ["lowerBack", false],
  "back-lower-back-right": ["lowerBack", true],
  "back-buttock-left": ["buttock", false],
  "back-buttock-right": ["buttock", true],
  "back-thigh-left": ["thighBack", false],
  "back-thigh-right": ["thighBack", true],
  "back-knee-left": ["knee", false],
  "back-knee-right": ["knee", true],
  "back-calf-left": ["shin", false],
  "back-calf-right": ["shin", true],
  "back-heel-left": ["foot", false],
  "back-heel-right": ["foot", true],
}

const REGION_POLYGONS: Record<BodyView, { id: BodyRegionId; poly: readonly Pt[]; centre: Pt }[]> = (() => {
  const out: Record<BodyView, { id: BodyRegionId; poly: readonly Pt[]; centre: Pt }[]> = { front: [], back: [] }
  for (const region of BODY_REGIONS) {
    const [name, mirrored] = REGION_CELLS[region.id]
    const poly = mirrored ? CELL[name].map(([x, y]) => [mirrorX(x), y] as Pt) : CELL[name]
    const centre: Pt = [
      poly.reduce((s, p) => s + p[0], 0) / poly.length,
      poly.reduce((s, p) => s + p[1], 0) / poly.length,
    ]
    out[region.view].push({ id: region.id, poly, centre })
  }
  return out
})()

function pointInPolygon([px, py]: Pt, poly: readonly Pt[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const toViewBox = (x: number, y: number): Pt => [VB_X + x * VB_W, VB_Y + y * VB_H]
const fromViewBox = ([vx, vy]: Pt): Pt => [
  +((vx - VB_X) / VB_W).toFixed(4),
  +((vy - VB_Y) / VB_H).toFixed(4),
]

/**
 * Body-map region for a normalised point on the given view: point-in-region,
 * falling back to the nearest region centre. Pure, so it also runs on the server.
 */
export function detectBodyRegion(view: BodyView, x: number, y: number): BodyRegionId {
  const p = toViewBox(x, y)
  const regions = REGION_POLYGONS[view]
  const hit = regions.find((r) => pointInPolygon(p, r.poly))
  if (hit) return hit.id
  let best = regions[0]
  let bestDist = Infinity
  for (const r of regions) {
    const d = (r.centre[0] - p[0]) ** 2 + (r.centre[1] - p[1]) ** 2
    if (d < bestDist) {
      bestDist = d
      best = r
    }
  }
  return best.id
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function useControllableState<T>(controlled: T | undefined, defaultValue: T, onChange?: (value: T) => void) {
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

function nextLesionId(prefix: string, lesions: Lesion[]) {
  const ids = new Set(lesions.map((l) => l.id))
  let n = lesions.length + 1
  while (ids.has(`${prefix}-${n}`)) n++
  return `${prefix}-${n}`
}

const PIN_TONE: Record<LesionStatus, string> = {
  changed: "stroke-clinical-critical",
  new: "stroke-clinical-watch",
  stable: "stroke-clinical-normal",
  resolved: "stroke-muted-foreground [stroke-dasharray:2.5_1.5]",
}

const SWATCH_TONE: Record<LesionStatus, string> = {
  changed: "border-clinical-critical",
  new: "border-clinical-watch",
  stable: "border-clinical-normal",
  resolved: "border-dashed border-muted-foreground",
}

/* -------------------------------------------------------------------------- */
/*                                  LesionPin                                 */
/* -------------------------------------------------------------------------- */

export interface LesionPinRenderProps {
  lesion: Lesion
  /** 1-based pin number (position in `value`). */
  number: number
  selected: boolean
  /** Accessible title, e.g. "#3 Back of forearm (left)". */
  title: string
}

function DefaultPin({ lesion, number, selected }: LesionPinRenderProps) {
  const resolved = lesion.status === "resolved"
  return (
    <>
      {selected && <circle r={10} className="fill-primary/15 stroke-primary [stroke-width:1.5]" />}
      <circle
        r={6.5}
        className={cn("fill-background [stroke-width:2.25]", PIN_TONE[lesion.status], resolved && "fill-muted")}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className={cn(
          "text-[7px] font-semibold tabular-nums",
          resolved ? "fill-muted-foreground" : "fill-foreground"
        )}
      >
        {number}
      </text>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 LesionFigure                               */
/* -------------------------------------------------------------------------- */

interface FigureProps {
  view: BodyView
  lesions: { lesion: Lesion; number: number }[]
  selectedId: string | null
  readOnly: boolean
  pinDomId: (id: string) => string
  describedBy?: string
  renderPin: (props: LesionPinRenderProps) => React.ReactNode
  onAdd: (view: BodyView, x: number, y: number) => void
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  onRemove: (id: string) => void
}

const NUDGE = 1
const NUDGE_LARGE = 5

function LesionFigure({
  view,
  lesions,
  selectedId,
  readOnly,
  pinDomId,
  describedBy,
  renderPin,
  onAdd,
  onSelect,
  onMove,
  onRemove,
}: FigureProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const outlineRef = React.useRef<SVGPathElement>(null)
  const drag = React.useRef<{ id: string; pointerId: number; sx: number; sy: number; moved: boolean } | null>(null)
  const titleId = React.useId()

  const clientToViewBox = (clientX: number, clientY: number): Pt | null => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    return [p.x, p.y]
  }

  const insideSilhouette = ([x, y]: Pt) => {
    const path = outlineRef.current
    if (!path || typeof path.isPointInFill !== "function") return true
    return path.isPointInFill(new DOMPoint(x, y))
  }

  const sideLabels: [string, string] = view === "front" ? ["R", "L"] : ["L", "R"]

  return (
    <svg
      ref={svgRef}
      viewBox={VIEWBOX}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      tabIndex={-1}
      data-view={view}
      className="block h-auto w-full overflow-visible outline-none select-none"
      style={{ "--body-fill": "color-mix(in oklab, var(--foreground) 7%, var(--muted))" } as React.CSSProperties}
    >
      <title id={titleId}>{`Lesion map, ${view} view, ${lesions.length} ${lesions.length === 1 ? "lesion" : "lesions"}`}</title>

      <g aria-hidden="true" className="fill-muted-foreground/70 text-[9px] font-medium tracking-wide">
        <text x={VB_X + 6} y={VB_Y + 14}>
          {sideLabels[0]}
        </text>
        <text x={VB_X + VB_W - 6} y={VB_Y + 14} textAnchor="end">
          {sideLabels[1]}
        </text>
      </g>

      {/* silhouette: the only hit target for placing pins */}
      <path
        ref={outlineRef}
        aria-hidden="true"
        d={OUTLINE_PATH}
        className={cn(
          "fill-(--body-fill) stroke-foreground/25 [stroke-linejoin:round] [stroke-width:1.25] dark:stroke-foreground/30",
          !readOnly && "cursor-crosshair"
        )}
        onClick={(e) => {
          if (readOnly) {
            onSelect(null)
            return
          }
          const p = clientToViewBox(e.clientX, e.clientY)
          if (!p) return
          const [x, y] = fromViewBox(p)
          onAdd(view, x, y)
        }}
      />
      <path
        aria-hidden="true"
        d={DETAIL_PATHS[view]}
        className="pointer-events-none fill-none stroke-foreground/15 [stroke-linecap:round] [stroke-width:0.9]"
      />

      <g>
        {lesions.map(({ lesion, number }) => {
          const [vx, vy] = toViewBox(lesion.x, lesion.y)
          const selected = lesion.id === selectedId
          const title = getLesionTitle(lesion, number)
          const description = [
            title,
            `${view} view`,
            lesion.label,
            getLesionTypeLabel(lesion.type),
            lesion.sizeMm !== undefined ? `${lesion.sizeMm} mm` : undefined,
            `status ${getLesionStatusLabel(lesion.status)}`,
          ]
            .filter(Boolean)
            .join(", ")
          return (
            <g
              key={lesion.id}
              id={pinDomId(lesion.id)}
              transform={`translate(${vx} ${vy})`}
              role="button"
              tabIndex={0}
              aria-label={description}
              aria-pressed={selected}
              data-lesion={lesion.id}
              data-status={lesion.status}
              data-selected={selected || undefined}
              className={cn(
                "group/pin touch-none outline-none",
                readOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
              )}
              onPointerDown={(e) => {
                e.stopPropagation()
                onSelect(lesion.id)
                if (readOnly || e.button !== 0) return
                e.currentTarget.setPointerCapture(e.pointerId)
                drag.current = { id: lesion.id, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false }
              }}
              onPointerMove={(e) => {
                const d = drag.current
                if (!d || d.pointerId !== e.pointerId) return
                if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 3) return
                d.moved = true
                const p = clientToViewBox(e.clientX, e.clientY)
                if (!p || !insideSilhouette(p)) return
                const [x, y] = fromViewBox(p)
                onMove(lesion.id, x, y)
              }}
              onPointerUp={(e) => {
                if (drag.current?.pointerId === e.pointerId) drag.current = null
              }}
              onPointerCancel={() => {
                drag.current = null
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect(selected ? null : lesion.id)
                  return
                }
                if (e.key === "Escape") {
                  if (selected) {
                    e.preventDefault()
                    onSelect(null)
                  }
                  return
                }
                if (readOnly) return
                if (e.key === "Delete" || e.key === "Backspace") {
                  e.preventDefault()
                  onRemove(lesion.id)
                  svgRef.current?.focus()
                  return
                }
                const step = e.shiftKey ? NUDGE_LARGE : NUDGE
                const delta: Record<string, Pt> = {
                  ArrowUp: [0, -step],
                  ArrowDown: [0, step],
                  ArrowLeft: [-step, 0],
                  ArrowRight: [step, 0],
                }
                const dv = delta[e.key]
                if (!dv) return
                e.preventDefault()
                if (!selected) onSelect(lesion.id)
                const next: Pt = [vx + dv[0], vy + dv[1]]
                if (!insideSilhouette(next)) return
                const [x, y] = fromViewBox(next)
                onMove(lesion.id, x, y)
              }}
            >
              <title>{title}</title>
              <circle
                aria-hidden="true"
                r={12}
                className="fill-none stroke-ring opacity-0 [stroke-width:2] group-focus-visible/pin:opacity-100"
              />
              {renderPin({ lesion, number, selected, title })}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  LesionMap                                 */
/* -------------------------------------------------------------------------- */

export interface LesionMapProps extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  /** Controlled lesions. */
  value?: Lesion[]
  /** Initial lesions when uncontrolled. */
  defaultValue?: Lesion[]
  onValueChange?: (lesions: Lesion[]) => void
  /** Controlled view (with `layout="toggle"`, the visible view). */
  view?: BodyView
  defaultView?: BodyView
  onViewChange?: (view: BodyView) => void
  /** Controlled selected lesion id (`null` = none). */
  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelectedIdChange?: (id: string | null) => void
  /** Prefix for ids of newly placed lesions (`${idPrefix}-${n}`). */
  idPrefix?: string
  /** `toggle` shows one view with a Front/Back switch; `side-by-side` shows both. */
  layout?: "toggle" | "side-by-side"
  /** Pins can be selected but not added, moved, edited or removed. */
  readOnly?: boolean
  /** Show the `LesionEditor` side panel for the selected lesion (ignored when read-only). */
  showEditor?: boolean
  /** Show the status legend under the map. */
  showLegend?: boolean
  /** Field values for newly placed lesions. */
  newLesionDefaults?: Partial<Pick<Lesion, "type" | "status" | "date">>
  /** Custom SVG pin content, drawn centred on (0, 0) in viewBox units (~6.5 radius). */
  renderPin?: (props: LesionPinRenderProps) => React.ReactNode
}

const EMPTY_LESIONS: Lesion[] = []
const renderDefaultPin = (props: LesionPinRenderProps) => <DefaultPin {...props} />

export function LesionMap({
  value: valueProp,
  defaultValue = EMPTY_LESIONS,
  onValueChange,
  view: viewProp,
  defaultView = "front",
  onViewChange,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelectedIdChange,
  idPrefix = "lesion",
  layout = "toggle",
  readOnly = false,
  showEditor = true,
  showLegend = true,
  newLesionDefaults,
  renderPin = renderDefaultPin,
  className,
  ...props
}: LesionMapProps) {
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange)
  const [view, setView] = useControllableState(viewProp, defaultView, onViewChange)
  const [selectedId, setSelectedId] = useControllableState<string | null>(
    selectedProp,
    defaultSelectedId,
    onSelectedIdChange
  )
  const uid = React.useId()
  const hintId = `${uid}-hint`
  const pinDomId = React.useCallback((id: string) => `${uid}-pin-${id}`, [uid])

  const numbered = React.useMemo(() => value.map((lesion, i) => ({ lesion, number: i + 1 })), [value])
  const byView = React.useMemo(
    () => ({
      front: numbered.filter((n) => n.lesion.view === "front"),
      back: numbered.filter((n) => n.lesion.view === "back"),
    }),
    [numbered]
  )
  const selected = numbered.find((n) => n.lesion.id === selectedId)

  // When the selection changes from outside (e.g. LesionList), reveal and focus the pin.
  const lastSelected = React.useRef(selectedId)
  React.useEffect(() => {
    if (lastSelected.current === selectedId) return
    if (!selectedId) {
      lastSelected.current = selectedId
      return
    }
    const lesion = value.find((l) => l.id === selectedId)
    if (!lesion) return
    if (layout === "toggle" && lesion.view !== view) {
      setView(lesion.view)
      return
    }
    lastSelected.current = selectedId
    const el = document.getElementById(pinDomId(selectedId))
    if (el && el !== document.activeElement && !el.closest("[data-slot=lesion-map]")?.contains(document.activeElement)) {
      el.focus({ preventScroll: true })
    }
  }, [selectedId, value, view, layout, setView, pinDomId])

  const update = (id: string, patch: Partial<Lesion>) =>
    setValue(value.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  const handleAdd = (v: BodyView, x: number, y: number) => {
    const lesion: Lesion = {
      id: nextLesionId(idPrefix, value),
      view: v,
      x,
      y,
      region: detectBodyRegion(v, x, y),
      type: newLesionDefaults?.type ?? "other",
      status: newLesionDefaults?.status ?? "new",
      ...(newLesionDefaults?.date ? { date: newLesionDefaults.date } : {}),
    }
    setValue([...value, lesion])
    setSelectedId(lesion.id)
    if (v !== view) setView(v)
  }

  const handleMove = (id: string, x: number, y: number) => {
    const lesion = value.find((l) => l.id === id)
    if (!lesion) return
    update(id, { x, y, region: detectBodyRegion(lesion.view, x, y) })
  }

  const handleRemove = (id: string) => {
    setValue(value.filter((l) => l.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleSelect = (id: string | null) => {
    lastSelected.current = id
    if (id !== selectedId) setSelectedId(id)
    const lesion = id ? value.find((l) => l.id === id) : undefined
    if (lesion && lesion.view !== view) setView(lesion.view)
  }

  const figure = (v: BodyView) => (
    <LesionFigure
      view={v}
      lesions={byView[v]}
      selectedId={selectedId}
      readOnly={readOnly}
      pinDomId={pinDomId}
      describedBy={hintId}
      renderPin={renderPin}
      onAdd={handleAdd}
      onSelect={handleSelect}
      onMove={handleMove}
      onRemove={handleRemove}
    />
  )

  const editorOpen = showEditor && !readOnly && selected

  return (
    <div
      data-slot="lesion-map"
      data-view={view}
      className={cn("flex w-full flex-col gap-4 md:flex-row md:items-start", className)}
      {...props}
    >
      <div
        className={cn(
          "flex w-full flex-col items-center gap-3",
          layout === "side-by-side" ? "max-w-[460px]" : "max-w-[280px]"
        )}
      >
        {layout === "toggle" ? (
          <>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={view}
              onValueChange={(v) => v && setView(v as BodyView)}
              aria-label="Body view"
            >
              <ToggleGroupItem value="front" className="px-3">
                Front <span className="text-muted-foreground tabular-nums">{byView.front.length}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="back" className="px-3">
                Back <span className="text-muted-foreground tabular-nums">{byView.back.length}</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="w-full">{figure(view)}</div>
          </>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3">
            {(["front", "back"] as const).map((v) => (
              <figure key={v} className="flex flex-col items-center gap-1.5">
                <figcaption className="text-xs font-medium text-muted-foreground">
                  {v === "front" ? "Front" : "Back"}
                </figcaption>
                {figure(v)}
              </figure>
            ))}
          </div>
        )}

        <p id={hintId} className="text-center text-xs text-muted-foreground">
          {readOnly
            ? "Select a pin to see its details."
            : "Click the body to place a lesion. Drag or use arrow keys to move it; Delete removes it."}
        </p>

        {showLegend && (
          <ul aria-label="Lesion status" className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
            {LESION_STATUSES.map((s) => (
              <li key={s.value} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={cn("size-3 rounded-full border-2 bg-background", SWATCH_TONE[s.value])} />
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editorOpen && (
        <LesionEditor
          className="w-full md:max-w-xs"
          lesion={selected.lesion}
          number={selected.number}
          onChange={(next) => setValue(value.map((l) => (l.id === next.id ? next : l)))}
          onRemove={() => handleRemove(selected.lesion.id)}
          onClose={() => handleSelect(null)}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 LesionEditor                               */
/* -------------------------------------------------------------------------- */

export interface LesionEditorProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  lesion: Lesion
  /** 1-based pin number shown in the heading. */
  number?: number
  onChange: (lesion: Lesion) => void
  /** Shows a remove button. */
  onRemove?: () => void
  /** Shows a close button. */
  onClose?: () => void
}

export function LesionEditor({ lesion, number, onChange, onRemove, onClose, className, ...props }: LesionEditorProps) {
  const id = React.useId()
  const set = <K extends keyof Lesion>(key: K, v: Lesion[K]) => {
    const next = { ...lesion, [key]: v }
    if (v === undefined || v === "") delete next[key]
    onChange(next)
  }
  const regions = BODY_REGIONS.filter((r) => r.view === lesion.view)
  const status = STATUS_BY_VALUE[lesion.status]
  const headingId = `${id}-heading`

  return (
    <div
      data-slot="lesion-editor"
      role="group"
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 id={headingId} className="truncate text-sm font-semibold">
            {number !== undefined ? getLesionTitle(lesion, number) : getBodyRegionLabel(lesion.region)}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClinicalStatusBadge status={status?.tone ?? "unknown"}>{status?.label ?? lesion.status}</ClinicalStatusBadge>
            <span className="capitalize">{lesion.view} view</span>
          </div>
        </div>
        {onClose && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close lesion editor" onClick={onClose}>
            <XIcon />
          </Button>
        )}
      </div>

      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor={`${id}-label`}>Label</FieldLabel>
          <Input
            id={`${id}-label`}
            value={lesion.label ?? ""}
            placeholder="e.g. Irregular naevus"
            onChange={(e) => set("label", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor={`${id}-type`}>Type</FieldLabel>
            <Select value={lesion.type} onValueChange={(v) => set("type", v as LesionType)}>
              <SelectTrigger id={`${id}-type`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LESION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-status`}>Status</FieldLabel>
            <Select value={lesion.status} onValueChange={(v) => set("status", v as LesionStatus)}>
              <SelectTrigger id={`${id}-status`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LESION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor={`${id}-region`}>Region</FieldLabel>
          <Select value={lesion.region} onValueChange={(v) => set("region", v)}>
            <SelectTrigger id={`${id}-region`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor={`${id}-size`}>Size (mm)</FieldLabel>
            <Input
              id={`${id}-size`}
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={lesion.sizeMm ?? ""}
              onChange={(e) => {
                const n = e.target.valueAsNumber
                set("sizeMm", Number.isFinite(n) ? n : undefined)
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-date`}>Date</FieldLabel>
            <Input id={`${id}-date`} type="date" value={lesion.date ?? ""} onChange={(e) => set("date", e.target.value)} />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor={`${id}-colour`}>Colour</FieldLabel>
          <Input
            id={`${id}-colour`}
            value={lesion.colour ?? ""}
            placeholder="e.g. Dark brown, variegated"
            onChange={(e) => set("colour", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-notes`}>Notes</FieldLabel>
          <Textarea
            id={`${id}-notes`}
            rows={3}
            value={lesion.notes ?? ""}
            placeholder="Morphology, borders, dermoscopy findings…"
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </FieldGroup>

      {onRemove && (
        <Button type="button" variant="destructive" size="sm" className="self-start" onClick={onRemove}>
          <Trash2Icon />
          Remove lesion
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  LesionList                                */
/* -------------------------------------------------------------------------- */

export interface LesionListProps extends Omit<React.ComponentProps<"div">, "children"> {
  value: Lesion[]
  selectedId?: string | null
  /** Called when a row is clicked (pass to `LesionMap` to focus the pin). */
  onSelectedIdChange?: (id: string | null) => void
  emptyText?: React.ReactNode
}

export function LesionList({
  value,
  selectedId,
  onSelectedIdChange,
  emptyText = "No lesions recorded",
  className,
  ...props
}: LesionListProps) {
  return (
    <div data-slot="lesion-list" className={cn("flex w-full flex-col", className)} {...props}>
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul aria-label="Lesions" className="flex flex-col divide-y rounded-xl border">
          {value.map((lesion, i) => {
            const status = STATUS_BY_VALUE[lesion.status]
            const selected = lesion.id === selectedId
            const meta = [
              getLesionTypeLabel(lesion.type),
              lesion.sizeMm !== undefined ? `${lesion.sizeMm} mm` : undefined,
              lesion.date,
            ]
              .filter(Boolean)
              .join(" · ")
            return (
              <li key={lesion.id}>
                <button
                  type="button"
                  aria-current={selected || undefined}
                  disabled={!onSelectedIdChange}
                  onClick={() => onSelectedIdChange?.(selected ? null : lesion.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm outline-none first:rounded-t-xl last:rounded-b-xl",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 enabled:hover:bg-muted/60 disabled:cursor-default",
                    selected && "bg-primary/5 enabled:hover:bg-primary/10"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-background text-xs font-semibold tabular-nums",
                      SWATCH_TONE[lesion.status],
                      selected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {getLesionTitle(lesion, i + 1)}
                        <span className="sr-only">, {lesion.view} view</span>
                      </span>
                      <ClinicalStatusBadge status={status?.tone ?? "unknown"}>
                        {status?.label ?? lesion.status}
                      </ClinicalStatusBadge>
                    </span>
                    {lesion.label && <span className="truncate">{lesion.label}</span>}
                    <span className="truncate text-xs text-muted-foreground">
                      <span className="capitalize">{lesion.view}</span>
                      {meta && ` · ${meta}`}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
