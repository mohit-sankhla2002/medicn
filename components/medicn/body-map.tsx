"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/* -------------------------------------------------------------------------- */
/*                                 Region data                                */
/* -------------------------------------------------------------------------- */

export type BodyView = "front" | "back"

/**
 * Every selectable region. Sides are anatomical (the patient's side), so in
 * the front view the patient's right appears on the viewer's left.
 */
export const BODY_REGIONS = [
  // Front
  { id: "front-head", label: "Head", view: "front" },
  { id: "front-face", label: "Face", view: "front" },
  { id: "front-neck", label: "Neck", view: "front" },
  { id: "front-shoulder-right", label: "Shoulder (right)", view: "front" },
  { id: "front-shoulder-left", label: "Shoulder (left)", view: "front" },
  { id: "front-chest-right", label: "Chest (right)", view: "front" },
  { id: "front-chest-left", label: "Chest (left)", view: "front" },
  { id: "front-upper-arm-right", label: "Upper arm (right)", view: "front" },
  { id: "front-upper-arm-left", label: "Upper arm (left)", view: "front" },
  { id: "front-elbow-right", label: "Elbow (right)", view: "front" },
  { id: "front-elbow-left", label: "Elbow (left)", view: "front" },
  { id: "front-forearm-right", label: "Forearm (right)", view: "front" },
  { id: "front-forearm-left", label: "Forearm (left)", view: "front" },
  { id: "front-hand-right", label: "Hand (right)", view: "front" },
  { id: "front-hand-left", label: "Hand (left)", view: "front" },
  { id: "front-upper-abdomen", label: "Upper abdomen", view: "front" },
  { id: "front-lower-abdomen", label: "Lower abdomen", view: "front" },
  { id: "front-pelvis", label: "Pelvis / groin", view: "front" },
  { id: "front-hip-right", label: "Hip (right)", view: "front" },
  { id: "front-hip-left", label: "Hip (left)", view: "front" },
  { id: "front-thigh-right", label: "Thigh (right)", view: "front" },
  { id: "front-thigh-left", label: "Thigh (left)", view: "front" },
  { id: "front-knee-right", label: "Knee (right)", view: "front" },
  { id: "front-knee-left", label: "Knee (left)", view: "front" },
  { id: "front-shin-right", label: "Shin (right)", view: "front" },
  { id: "front-shin-left", label: "Shin (left)", view: "front" },
  { id: "front-foot-right", label: "Ankle & foot (right)", view: "front" },
  { id: "front-foot-left", label: "Ankle & foot (left)", view: "front" },
  // Back
  { id: "back-head", label: "Back of head", view: "back" },
  { id: "back-neck", label: "Back of neck", view: "back" },
  { id: "back-shoulder-left", label: "Back of shoulder (left)", view: "back" },
  { id: "back-shoulder-right", label: "Back of shoulder (right)", view: "back" },
  { id: "back-upper-back-left", label: "Upper back (left)", view: "back" },
  { id: "back-upper-back-right", label: "Upper back (right)", view: "back" },
  { id: "back-upper-arm-left", label: "Back of upper arm (left)", view: "back" },
  { id: "back-upper-arm-right", label: "Back of upper arm (right)", view: "back" },
  { id: "back-elbow-left", label: "Back of elbow (left)", view: "back" },
  { id: "back-elbow-right", label: "Back of elbow (right)", view: "back" },
  { id: "back-forearm-left", label: "Back of forearm (left)", view: "back" },
  { id: "back-forearm-right", label: "Back of forearm (right)", view: "back" },
  { id: "back-hand-left", label: "Back of hand (left)", view: "back" },
  { id: "back-hand-right", label: "Back of hand (right)", view: "back" },
  { id: "back-lower-back-left", label: "Lower back (left)", view: "back" },
  { id: "back-lower-back-right", label: "Lower back (right)", view: "back" },
  { id: "back-buttock-left", label: "Buttock (left)", view: "back" },
  { id: "back-buttock-right", label: "Buttock (right)", view: "back" },
  { id: "back-thigh-left", label: "Back of thigh (left)", view: "back" },
  { id: "back-thigh-right", label: "Back of thigh (right)", view: "back" },
  { id: "back-knee-left", label: "Back of knee (left)", view: "back" },
  { id: "back-knee-right", label: "Back of knee (right)", view: "back" },
  { id: "back-calf-left", label: "Calf (left)", view: "back" },
  { id: "back-calf-right", label: "Calf (right)", view: "back" },
  { id: "back-heel-left", label: "Heel & ankle (left)", view: "back" },
  { id: "back-heel-right", label: "Heel & ankle (right)", view: "back" },
] as const satisfies readonly { id: string; label: string; view: BodyView }[]

export type BodyRegionId = (typeof BODY_REGIONS)[number]["id"]

const LABELS: Record<string, string> = Object.fromEntries(
  BODY_REGIONS.map((r) => [r.id, r.label])
)

/** Human readable label for a region id (falls back to the id itself). */
export function getBodyRegionLabel(id: string): string {
  return LABELS[id] ?? id
}

/* -------------------------------------------------------------------------- */
/*                                  Geometry                                  */
/* -------------------------------------------------------------------------- */

type Pt = readonly [number, number]
type Cubic = readonly [number, number, number, number, number, number]

const CX = 120
const VIEWBOX = "28 2 184 496"

/**
 * Left half (viewer's left) of the silhouette as cubic segments, starting at
 * the crown and ending at the crotch. The right half is mirrored.
 */
const HALF_START: Pt = [120, 10]
const HALF: readonly Cubic[] = [
  // head
  [107, 10, 97.5, 19.5, 97, 34],
  [96.6, 45, 97.5, 53, 100, 59.5],
  [102.5, 65.5, 105.5, 70, 110, 72.5],
  // neck
  [110.6, 78, 110.6, 84, 109.4, 88.5],
  // trapezius slope + deltoid
  [104, 92.5, 91, 95, 80, 99],
  [70, 102.5, 63.5, 110, 63, 123],
  // outer arm
  [62.5, 141, 58.5, 160, 57.5, 176],
  [57, 186, 55, 195, 53.5, 204],
  [51.5, 221, 48.5, 242, 46.5, 259],
  // hand
  [44.5, 265, 41, 272, 40.5, 280],
  [40, 288, 41.5, 296, 42, 303],
  [43, 314, 47.5, 323, 53, 323],
  [58.5, 323, 61.5, 315, 62.3, 304],
  [63.2, 292, 64, 279, 62.5, 266],
  // inner forearm, elbow, upper arm
  [62.5, 248, 66, 229, 69, 214],
  [70, 207, 71, 201.5, 72, 196],
  [74, 176, 77, 157, 80, 147],
  [81.5, 141.5, 83, 137.5, 84.5, 136],
  // torso side
  [86, 140, 87, 151, 87, 163],
  [87, 178, 84.5, 192, 84.5, 205],
  [84.5, 222, 77, 238, 76, 256],
  // outer leg
  [75, 281, 76, 310, 80.5, 335],
  [83, 346, 84, 355, 83.2, 365],
  [82, 376, 79.5, 390, 81, 410],
  [83, 430, 89.5, 448, 91, 460],
  // foot
  [91.5, 468, 87.5, 478, 87.5, 485],
  [87.5, 490, 92, 492, 99, 492],
  [104, 492, 108, 492, 111, 491],
  [114, 490, 114.5, 486, 113.5, 481],
  // inner leg
  [112.5, 474, 109.5, 467, 109, 458],
  [107.5, 444, 104, 424, 104.5, 404],
  [105, 388, 107.5, 374, 107.5, 362],
  [107.5, 352, 108.5, 344, 109.5, 337],
  [112, 314, 116.5, 291, 118.5, 280],
  [119, 276, 119.5, 273, 120, 272],
]

const mirrorX = (x: number) => 2 * CX - x

function buildOutlinePath(): string {
  const f = (n: number) => +n.toFixed(2)
  let d = `M${HALF_START[0]} ${HALF_START[1]}`
  for (const c of HALF) d += `C${c.map(f).join(" ")}`
  // mirrored half, traversed in reverse
  for (let i = HALF.length - 1; i >= 0; i--) {
    const c = HALF[i]
    const start = i === 0 ? HALF_START : ([HALF[i - 1][4], HALF[i - 1][5]] as Pt)
    d += `C${[mirrorX(c[2]), c[3], mirrorX(c[0]), c[1], mirrorX(start[0]), start[1]]
      .map(f)
      .join(" ")}`
  }
  return d + "Z"
}

function sampleOutline(steps = 14): Pt[] {
  const pts: Pt[] = []
  const segs: [Pt, Pt, Pt, Pt][] = []
  let p0 = HALF_START
  for (const c of HALF) {
    const seg: [Pt, Pt, Pt, Pt] = [p0, [c[0], c[1]], [c[2], c[3]], [c[4], c[5]]]
    segs.push(seg)
    p0 = seg[3]
  }
  const mirrored = segs
    .slice()
    .reverse()
    .map(
      ([a, b, c, d]) =>
        [
          [mirrorX(d[0]), d[1]],
          [mirrorX(c[0]), c[1]],
          [mirrorX(b[0]), b[1]],
          [mirrorX(a[0]), a[1]],
        ] as [Pt, Pt, Pt, Pt]
    )
  for (const [a, b, c, d] of [...segs, ...mirrored]) {
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      const u = 1 - t
      const w0 = u * u * u
      const w1 = 3 * u * u * t
      const w2 = 3 * u * t * t
      const w3 = t * t * t
      pts.push([
        w0 * a[0] + w1 * b[0] + w2 * c[0] + w3 * d[0],
        w0 * a[1] + w1 * b[1] + w2 * c[1] + w3 * d[1],
      ])
    }
  }
  return pts
}

const signedArea = (poly: readonly Pt[]) => {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

/** Sutherland–Hodgman: clip a (possibly concave) subject by a convex cell. */
function clipPolygon(subject: readonly Pt[], cell: readonly Pt[]): Pt[] {
  const dir = signedArea(cell) > 0 ? 1 : -1
  let output: Pt[] = subject.slice()
  for (let i = 0; i < cell.length && output.length; i++) {
    const a = cell[i]
    const b = cell[(i + 1) % cell.length]
    const side = (p: Pt) =>
      dir * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]))
    const input = output
    output = []
    for (let j = 0; j < input.length; j++) {
      const cur = input[j]
      const prev = input[(j + input.length - 1) % input.length]
      const sc = side(cur)
      const sp = side(prev)
      if (sc >= 0) {
        if (sp < 0) output.push(intersect(prev, cur, sp, sc))
        output.push(cur)
      } else if (sp >= 0) {
        output.push(intersect(prev, cur, sp, sc))
      }
    }
  }
  return output
}

/**
 * Sutherland–Hodgman leaves zero-area "flaps" running along the cell edges
 * where the subject leaves and re-enters the cell. Collapse every collinear
 * vertex (which removes those back-and-forth runs) and duplicate points.
 */
function removeDegenerate(poly: Pt[]): Pt[] {
  const pts = poly.slice()
  let changed = true
  while (changed && pts.length > 3) {
    changed = false
    for (let i = 0; i < pts.length && pts.length > 3; i++) {
      const a = pts[(i + pts.length - 1) % pts.length]
      const b = pts[i]
      const c = pts[(i + 1) % pts.length]
      const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
      const dup = Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6
      if (dup || Math.abs(cross) < 1e-6) {
        pts.splice(i, 1)
        i--
        changed = true
      }
    }
  }
  return pts
}

function intersect(p: Pt, q: Pt, sp: number, sq: number): Pt {
  const t = sp / (sp - sq)
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
}

/* Convex cells drawn for the viewer's-left half; mirrored for the other. */
const SEAM_ARMPIT: Pt = [84.5, 136]
const SEAM_WAIST: Pt = [77.5, 205]
const SEAM_HIP: Pt = [68.5, 250]
const lerpSeam = (a: Pt, b: Pt, y: number): Pt => [
  a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]),
  y,
]
const ARM_SEAM_188 = lerpSeam(SEAM_ARMPIT, SEAM_WAIST, 188)
const CHEST_SEAM_170 = lerpSeam(SEAM_ARMPIT, SEAM_WAIST, 170)
const ARM_SEAM_214 = lerpSeam(SEAM_WAIST, SEAM_HIP, 214)
// line from the waist seam to the groin apex: lower abdomen / pelvis / hip
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
const mirrorCell = (cell: readonly Pt[]): Pt[] =>
  cell.map(([x, y]) => [mirrorX(x), y] as Pt).reverse()

/** Which cell each region uses, and whether it is mirrored to the viewer's right. */
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

type RegionShape = {
  id: BodyRegionId
  label: string
  view: BodyView
  d: string
  /** label anchor (top-centre of the region) in viewBox units */
  anchor: Pt
}

const OUTLINE_PATH = buildOutlinePath()

/** Faint, non-interactive anatomical contour hints (viewer's-left half). */
const DETAIL_HALF: Record<BodyView, string[]> = {
  front: [
    "M108 95.5C101 97 92 98.5 84 100.5", // clavicle
    "M89 149C96 158 106 160 116.5 156", // pectoral
    "M95.5 351C92.5 351 91.5 354.5 92 357.5C92.5 361 98.5 361 99 357.5C99.5 354.5 98.5 351 95.5 351", // patella
  ],
  back: [
    "M105 112C101.5 126 101 140 106.5 152", // scapula (medial border)
    "M92 117C96 116 101 116 104.5 113", // scapular spine
    "M86 293.5C95 299 108 298.5 117.5 293.5", // gluteal fold
    "M88 358C93 360.5 99 360.5 104 358", // popliteal crease
  ],
}
const mirrorPath = (d: string) =>
  d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_, x: string, y: string) =>
    `${+mirrorX(Number(x)).toFixed(2)} ${y}`
  )
const DETAIL_PATHS: Record<BodyView, string> = {
  front: [...DETAIL_HALF.front, ...DETAIL_HALF.front.map(mirrorPath)].join("") +
    "M120 214a1.1 1.6 0 1 0 0.01 0Z", // navel
  back: [...DETAIL_HALF.back, ...DETAIL_HALF.back.map(mirrorPath)].join(""),
}

const REGION_SHAPES: Record<BodyView, RegionShape[]> = (() => {
  const outline = sampleOutline()
  const result: Record<BodyView, RegionShape[]> = { front: [], back: [] }
  for (const region of BODY_REGIONS) {
    const [cellName, mirrored] = REGION_CELLS[region.id]
    const cell = mirrored ? mirrorCell(CELL[cellName]) : CELL[cellName]
    const pts = removeDegenerate(clipPolygon(outline, cell))
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    for (const [x, y] of pts) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
    }
    result[region.view].push({
      ...region,
      d: `M${pts.map(([x, y]) => `${+x.toFixed(1)} ${+y.toFixed(1)}`).join("L")}Z`,
      anchor: [(minX + maxX) / 2, minY],
    })
  }
  return result
})()

const [VB_X, VB_Y, VB_W, VB_H] = VIEWBOX.split(" ").map(Number)

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

// watch -> abnormal -> critical, with fallbacks when the clinical tokens are absent
const HEAT_STOPS = [
  "var(--clinical-watch, oklch(0.83 0.16 84))",
  "var(--clinical-abnormal, oklch(0.72 0.19 50))",
  "var(--clinical-critical, oklch(0.6 0.22 27))",
]

/** CSS colour for an intensity in the 0–10 range (blended with `--muted`). */
export function getBodyMapHeatColor(intensity: number): string {
  const t = Math.min(Math.max(intensity, 0), 10) / 10
  const hue =
    t <= 0.5
      ? `color-mix(in oklch, ${HEAT_STOPS[1]} ${Math.round(t * 200)}%, ${HEAT_STOPS[0]})`
      : `color-mix(in oklch, ${HEAT_STOPS[2]} ${Math.round((t - 0.5) * 200)}%, ${HEAT_STOPS[1]})`
  return `color-mix(in oklab, ${hue} ${Math.round(50 + t * 50)}%, var(--body-fill, var(--muted)))`
}

/* -------------------------------------------------------------------------- */
/*                                   BodyMap                                  */
/* -------------------------------------------------------------------------- */

export interface BodyMapProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  /** Controlled view. */
  view?: BodyView
  /** Initial view when uncontrolled. */
  defaultView?: BodyView
  onViewChange?: (view: BodyView) => void
  /** Controlled selected region ids. */
  value?: string[]
  /** Initial selected region ids when uncontrolled. */
  defaultValue?: string[]
  onValueChange?: (ids: string[]) => void
  /** Allow selecting more than one region. */
  multiple?: boolean
  /** Region id -> intensity (0–10). Renders the regions as a heat map. */
  intensity?: Record<string, number>
  /** Show the Front / Back toggle. */
  showViewToggle?: boolean
  /** Show a floating label with the region name on hover / focus. */
  showLabels?: boolean
  /** Regions can be inspected but not toggled. */
  readOnly?: boolean
  /** Region ids that cannot be selected. */
  disabledRegions?: string[]
}

const EMPTY: string[] = []

export function BodyMap({
  view: viewProp,
  defaultView = "front",
  onViewChange,
  value: valueProp,
  defaultValue = EMPTY,
  onValueChange,
  multiple = true,
  intensity,
  showViewToggle = true,
  showLabels = true,
  readOnly = false,
  disabledRegions = EMPTY,
  className,
  ...props
}: BodyMapProps) {
  const [view, setView] = useControllableState(viewProp, defaultView, onViewChange)
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange)
  const [active, setActive] = React.useState<{ id: string; focus: boolean } | null>(null)
  const titleId = React.useId()

  const selected = React.useMemo(() => new Set(value), [value])
  const disabled = React.useMemo(() => new Set(disabledRegions), [disabledRegions])
  const shapes = REGION_SHAPES[view]
  const heat = intensity !== undefined

  const toggle = (id: string) => {
    if (readOnly || disabled.has(id)) return
    if (selected.has(id)) setValue(value.filter((v) => v !== id))
    else setValue(multiple ? [...value, id] : [id])
  }

  const activeShape = active ? shapes.find((s) => s.id === active.id) : undefined
  const sideLabels: [string, string] = view === "front" ? ["R", "L"] : ["L", "R"]

  return (
    <div
      data-slot="body-map"
      data-view={view}
      className={cn("flex w-full max-w-[280px] flex-col items-center gap-3", className)}
      {...props}
    >
      {showViewToggle && (
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
            Front
          </ToggleGroupItem>
          <ToggleGroupItem value="back" className="px-3">
            Back
          </ToggleGroupItem>
        </ToggleGroup>
      )}

      <div className="relative w-full">
        <svg
          viewBox={VIEWBOX}
          role="group"
          aria-labelledby={titleId}
          className="block h-auto w-full overflow-visible select-none"
          style={
            {
              "--body-fill":
                "color-mix(in oklab, var(--foreground) 7%, var(--muted))",
            } as React.CSSProperties
          }
          onPointerLeave={() => setActive((a) => (a?.focus ? a : null))}
        >
          <title id={titleId}>{`Body map, ${view} view`}</title>

          {/* side markers */}
          <g
            aria-hidden="true"
            className="fill-muted-foreground/70 text-[9px] font-medium tracking-wide"
          >
            <text x={VB_X + 6} y={VB_Y + 14}>
              {sideLabels[0]}
            </text>
            <text x={VB_X + VB_W - 6} y={VB_Y + 14} textAnchor="end">
              {sideLabels[1]}
            </text>
          </g>

          {/* soft ground shadow */}
          <ellipse
            aria-hidden="true"
            cx={CX}
            cy={493}
            rx={34}
            ry={3}
            className="fill-foreground/[0.06]"
          />

          <g>
            {shapes.map((shape) => {
              const isSelected = selected.has(shape.id)
              const isDisabled = disabled.has(shape.id)
              const level = intensity?.[shape.id]
              const hasHeat = heat && level !== undefined && level > 0
              const interactive = !readOnly && !isDisabled
              return (
                <path
                  key={shape.id}
                  d={shape.d}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={
                    hasHeat ? `${shape.label}, intensity ${level} of 10` : shape.label
                  }
                  aria-disabled={isDisabled || undefined}
                  aria-readonly={readOnly || undefined}
                  tabIndex={isDisabled ? -1 : 0}
                  data-region={shape.id}
                  data-selected={isSelected || undefined}
                  data-disabled={isDisabled || undefined}
                  style={hasHeat ? { fill: getBodyMapHeatColor(level) } : undefined}
                  className={cn(
                    "fill-(--body-fill) stroke-background outline-none [stroke-linejoin:round] [stroke-width:1.1]",
                    "transition-[fill,opacity] duration-150 ease-out motion-reduce:transition-none",
                    interactive && "cursor-pointer",
                    interactive &&
                      !isSelected &&
                      !hasHeat &&
                      "hover:fill-[color-mix(in_oklab,var(--primary)_25%,var(--body-fill))]",
                    interactive && hasHeat && "hover:opacity-85",
                    isSelected && !heat && "fill-primary hover:fill-primary/90",
                    isDisabled &&
                      "cursor-not-allowed fill-[color-mix(in_oklab,var(--muted)_45%,var(--background))]"
                  )}
                  onClick={() => toggle(shape.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggle(shape.id)
                    }
                  }}
                  onPointerEnter={() => setActive({ id: shape.id, focus: false })}
                  onFocus={(e) =>
                    setActive({
                      id: shape.id,
                      focus: e.currentTarget.matches(":focus-visible"),
                    })
                  }
                  onBlur={() => setActive(null)}
                />
              )
            })}
          </g>

          {/* anatomical hints */}
          <path
            aria-hidden="true"
            d={DETAIL_PATHS[view]}
            className="pointer-events-none fill-none stroke-foreground/15 [stroke-linecap:round] [stroke-width:0.9]"
          />

          {/* silhouette outline */}
          <path
            aria-hidden="true"
            d={OUTLINE_PATH}
            className="pointer-events-none fill-none stroke-foreground/25 [stroke-linejoin:round] [stroke-width:1.25] dark:stroke-foreground/30"
          />

          {/* selection outlines (heat map mode) */}
          {heat && (
            <g aria-hidden="true" className="pointer-events-none">
              {shapes
                .filter((s) => selected.has(s.id))
                .map((s) => (
                  <path
                    key={s.id}
                    d={s.d}
                    className="fill-none stroke-foreground [stroke-dasharray:3_2] [stroke-linejoin:round] [stroke-width:1.6]"
                  />
                ))}
            </g>
          )}

          {/* hover / focus highlight */}
          {activeShape && (
            <path
              aria-hidden="true"
              d={activeShape.d}
              className={cn(
                "pointer-events-none fill-none [stroke-linejoin:round]",
                active?.focus
                  ? "stroke-ring [stroke-width:2.5]"
                  : "stroke-primary/60 [stroke-width:1.25]"
              )}
            />
          )}
        </svg>

        {showLabels && activeShape && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground shadow-sm motion-safe:animate-in motion-safe:fade-in-0"
            style={{
              left: `${((activeShape.anchor[0] - VB_X) / VB_W) * 100}%`,
              top: `calc(${((activeShape.anchor[1] - VB_Y) / VB_H) * 100}% - 4px)`,
            }}
          >
            {activeShape.label}
            {intensity?.[activeShape.id] !== undefined && (
              <span className="ml-1.5 text-muted-foreground tabular-nums">
                {intensity[activeShape.id]}/10
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            BodyMapSelectionList                            */
/* -------------------------------------------------------------------------- */

export interface BodyMapSelectionListProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  /** Selected region ids. */
  value: string[]
  /** Called with the id of the chip whose remove button was pressed. Omit to hide remove buttons. */
  onRemove?: (id: string) => void
  /** Optional intensities shown next to each label. */
  intensity?: Record<string, number>
  /** Text shown when nothing is selected. */
  emptyText?: React.ReactNode
}

export function BodyMapSelectionList({
  value,
  onRemove,
  intensity,
  emptyText = "No areas selected",
  className,
  ...props
}: BodyMapSelectionListProps) {
  return (
    <div
      data-slot="body-map-selection-list"
      role="list"
      aria-label="Selected body areas"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    >
      {value.length === 0 ? (
        <span className="text-sm text-muted-foreground">{emptyText}</span>
      ) : (
        value.map((id) => {
          const label = getBodyRegionLabel(id)
          return (
            <Badge
              key={id}
              role="listitem"
              variant="secondary"
              className={cn("h-6 gap-1 pl-2.5 text-xs", onRemove ? "pr-0.5" : "pr-2.5")}
            >
              {label}
              {intensity?.[id] !== undefined && (
                <span className="text-muted-foreground tabular-nums">{intensity[id]}/10</span>
              )}
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 rounded-full hover:bg-foreground/10"
                  aria-label={`Remove ${label}`}
                  onClick={() => onRemove(id)}
                >
                  <XIcon />
                </Button>
              )}
            </Badge>
          )
        })
      )}
    </div>
  )
}
