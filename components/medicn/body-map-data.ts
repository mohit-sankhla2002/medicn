/**
 * Geometry, region definitions and helpers shared by `BodyMap` and `LesionMap`.
 *
 * Everything here is pure data + math (no DOM), so scenes can be built on the
 * server. Regions are convex "cells" clipped to a silhouette; finer "feature"
 * regions (eyes, nose, ears…) sit on a higher layer and are cut out of the
 * regions below them, so every scene tiles its silhouette without gaps or
 * overlaps.
 *
 * Sides are anatomical (the patient's side). In front-facing scenes the
 * patient's right is on the viewer's left.
 */

export type BodyFigureView = "front" | "back"
/** `"head"` is the zoomed face close-up (detailed mode only). */
export type BodyView = BodyFigureView | "head"
export type BodySex = "male" | "female"
export type BodyMapDetail = "simple" | "detailed"
export type BodyFocusPart = "head" | "hand-left" | "hand-right" | "foot-left" | "foot-right"
export type BodyMapSceneId =
  | BodyFigureView
  | "head"
  | "hand-left-palm"
  | "hand-left-back"
  | "hand-right-palm"
  | "hand-right-back"
  | "foot-left"
  | "foot-right"

export type Pt = readonly [number, number]
type Cubic = readonly [number, number, number, number, number, number]
type Side = "left" | "right"

/** Every scene is drawn in the same viewBox, so switching scenes never changes the layout. */
export const BODY_VIEWBOX = [28, 2, 184, 496] as const
const CX = 120
const mx = (x: number) => 2 * CX - x

/* -------------------------------------------------------------------------- */
/*                               Simple regions                               */
/* -------------------------------------------------------------------------- */

/** The original 54 regions (`detail="simple"`). Ids are stable. */
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
] as const satisfies readonly { id: string; label: string; view: BodyFigureView }[]

export type BodyRegionId = (typeof BODY_REGIONS)[number]["id"]

/* -------------------------------------------------------------------------- */
/*                              Detailed regions                              */
/* -------------------------------------------------------------------------- */

export interface BodyRegionInfo {
  id: string
  label: string
  /** Label used when `sex="female"` (e.g. "Left breast"). */
  femaleLabel?: string
  /** Next region up: close-up part → detailed region → simple region. */
  parent?: string
  /** Where the region is drawn. `"closeup"` regions only appear in zoomed scenes. */
  level: "simple" | "detailed" | "closeup"
}

const INFO = new Map<string, BodyRegionInfo>()
/** Midline / shared regions that straddle more than one simple region. */
const SIMPLE_OVERRIDES: Record<string, string[]> = {}

for (const r of BODY_REGIONS) INFO.set(r.id, { id: r.id, label: r.label, level: "simple" })

const fill = (tpl: string, s: Side) =>
  tpl.replaceAll("{S}", s === "left" ? "Left" : "Right").replaceAll("{s}", s)

function def(level: "detailed" | "closeup", id: string, label: string, parent?: string, femaleLabel?: string) {
  INFO.set(id, { id, label, parent, femaleLabel, level })
}
function defPair(
  level: "detailed" | "closeup",
  id: string,
  label: string,
  parent?: string,
  femaleLabel?: string
) {
  for (const s of ["right", "left"] as const) {
    def(level, fill(id, s), fill(label, s), parent && fill(parent, s), femaleLabel && fill(femaleLabel, s))
  }
}

// Head & neck
def("detailed", "scalp", "Scalp / crown", "front-head")
def("detailed", "forehead", "Forehead", "front-head")
defPair("detailed", "temple-{s}", "{S} temple", "front-head")
defPair("detailed", "eye-{s}", "{S} eye", "front-face")
defPair("detailed", "ear-{s}", "{S} ear", "front-face")
def("detailed", "nose", "Nose", "front-face")
defPair("detailed", "cheek-{s}", "{S} cheek", "front-face")
def("detailed", "mouth", "Mouth / lips", "front-face")
def("detailed", "jaw", "Jaw", "front-face")
def("detailed", "throat", "Throat (front of neck)", "front-neck")
def("detailed", "back-of-head", "Back of head", "back-head")
def("detailed", "nape", "Back of neck", "back-neck")
// Front torso: abdomen uses the nine-region scheme (two midclavicular lines,
// subcostal and intertubercular planes).
defPair("detailed", "chest-{s}", "{S} chest", "front-chest-{s}", "{S} breast")
def("detailed", "sternum", "Breastbone (sternum)", "front-chest-right")
def("detailed", "epigastrium", "Upper abdomen (epigastric)", "front-upper-abdomen")
defPair("detailed", "hypochondrium-{s}", "{S} upper abdomen (hypochondriac)", "front-upper-abdomen")
def("detailed", "umbilical", "Around the navel (umbilical)", "front-lower-abdomen")
defPair("detailed", "flank-{s}", "{S} flank (lumbar)", "front-lower-abdomen")
defPair("detailed", "iliac-{s}", "{S} lower abdomen (iliac)", "front-lower-abdomen")
def("detailed", "suprapubic", "Lower abdomen (suprapubic)", "front-lower-abdomen")
defPair("detailed", "groin-{s}", "{S} groin", "front-pelvis")
def("detailed", "genitals", "Genital / pelvic area", "front-pelvis")
// Back torso
defPair("detailed", "upper-back-{s}", "{S} upper back", "back-upper-back-{s}")
def("detailed", "mid-back", "Mid back", "back-upper-back-left")
defPair("detailed", "lower-back-{s}", "{S} lower back", "back-lower-back-{s}")
defPair("detailed", "buttock-{s}", "{S} buttock", "back-buttock-{s}")
// Arms
defPair("detailed", "shoulder-{s}", "{S} shoulder", "front-shoulder-{s}")
defPair("detailed", "upper-arm-{s}", "{S} upper arm", "front-upper-arm-{s}")
defPair("detailed", "elbow-{s}", "{S} elbow", "front-elbow-{s}")
defPair("detailed", "forearm-{s}", "{S} forearm", "front-forearm-{s}")
defPair("detailed", "wrist-{s}", "{S} wrist", "front-hand-{s}")
defPair("detailed", "palm-{s}", "{S} palm", "front-hand-{s}")
defPair("detailed", "fingers-{s}", "{S} fingers", "front-hand-{s}")
defPair("detailed", "back-of-shoulder-{s}", "Back of {s} shoulder", "back-shoulder-{s}")
defPair("detailed", "back-of-upper-arm-{s}", "Back of {s} upper arm", "back-upper-arm-{s}")
defPair("detailed", "back-of-elbow-{s}", "Back of {s} elbow", "back-elbow-{s}")
defPair("detailed", "back-of-forearm-{s}", "Back of {s} forearm", "back-forearm-{s}")
defPair("detailed", "back-of-wrist-{s}", "Back of {s} wrist", "back-hand-{s}")
defPair("detailed", "back-of-hand-{s}", "Back of {s} hand", "back-hand-{s}")
// Legs
defPair("detailed", "hip-{s}", "{S} hip", "front-hip-{s}")
defPair("detailed", "thigh-{s}", "{S} thigh", "front-thigh-{s}")
defPair("detailed", "knee-{s}", "{S} knee", "front-knee-{s}")
defPair("detailed", "shin-{s}", "{S} shin", "front-shin-{s}")
defPair("detailed", "ankle-{s}", "{S} ankle", "front-foot-{s}")
defPair("detailed", "foot-{s}", "Top of {s} foot", "front-foot-{s}")
defPair("detailed", "toes-{s}", "{S} toes", "front-foot-{s}")
defPair("detailed", "back-of-thigh-{s}", "Back of {s} thigh", "back-thigh-{s}")
defPair("detailed", "back-of-knee-{s}", "Back of {s} knee", "back-knee-{s}")
defPair("detailed", "calf-{s}", "{S} calf", "back-calf-{s}")
defPair("detailed", "back-of-ankle-{s}", "Back of {s} ankle (Achilles)", "back-heel-{s}")
defPair("detailed", "heel-{s}", "{S} heel", "back-heel-{s}")
defPair("detailed", "sole-{s}", "Sole of {s} foot", "back-heel-{s}")
// Close-up only parts
defPair("closeup", "eyebrow-{s}", "{S} eyebrow", "forehead")
defPair("closeup", "eyelid-{s}", "{S} upper eyelid", "eye-{s}")
defPair("closeup", "earlobe-{s}", "{S} earlobe", "ear-{s}")
defPair("closeup", "nostril-{s}", "{S} nostril", "nose")
def("closeup", "lip-upper", "Upper lip", "mouth")
def("closeup", "lip-lower", "Lower lip", "mouth")
def("closeup", "chin", "Chin", "jaw")
defPair("closeup", "thumb-{s}", "{S} thumb", "fingers-{s}")
defPair("closeup", "index-finger-{s}", "{S} index finger", "fingers-{s}")
defPair("closeup", "middle-finger-{s}", "{S} middle finger", "fingers-{s}")
defPair("closeup", "ring-finger-{s}", "{S} ring finger", "fingers-{s}")
defPair("closeup", "little-finger-{s}", "{S} little finger", "fingers-{s}")

SIMPLE_OVERRIDES.scalp = ["front-head", "back-head"]
SIMPLE_OVERRIDES.sternum = ["front-chest-right", "front-chest-left"]
SIMPLE_OVERRIDES["mid-back"] = ["back-upper-back-left", "back-upper-back-right"]
for (const s of ["left", "right"] as const) {
  SIMPLE_OVERRIDES[`ear-${s}`] = ["front-face", "back-head"]
  SIMPLE_OVERRIDES[`fingers-${s}`] = [`front-hand-${s}`, `back-hand-${s}`]
}

/** Every detailed and close-up region (excludes the simple `BODY_REGIONS`). */
export const DETAILED_BODY_REGIONS: readonly BodyRegionInfo[] = [...INFO.values()].filter(
  (r) => r.level !== "simple"
)

/** Human readable label for any region id (falls back to the id itself). */
export function getBodyRegionLabel(id: string, options?: { sex?: BodySex }): string {
  const info = INFO.get(id)
  if (!info) return id
  return options?.sex === "female" && info.femaleLabel ? info.femaleLabel : info.label
}

/**
 * The next region up: a close-up part rolls up to its detailed region, which
 * rolls up to a simple region (`"eyelid-left"` → `"eye-left"` → `"front-face"`).
 * Simple ids return `undefined`. Midline regions that straddle two simple
 * regions (sternum, mid back) return the first; see `getSimpleRegions`.
 */
export function getParentRegion(id: string): string | undefined {
  return INFO.get(id)?.parent
}

/** All simple region ids a region rolls up to (usually one). */
export function getSimpleRegions(id: string): string[] {
  const info = INFO.get(id)
  if (!info) return []
  if (info.level === "simple") return [id]
  if (SIMPLE_OVERRIDES[id]) return SIMPLE_OVERRIDES[id]
  return info.parent ? getSimpleRegions(info.parent) : []
}

/** True when `ancestor` is a (transitive) parent of `id`. */
export function isRegionAncestor(ancestor: string, id: string): boolean {
  let cur = INFO.get(id)?.parent
  for (let i = 0; cur && i < 6; i++) {
    if (cur === ancestor) return true
    cur = INFO.get(cur)?.parent
  }
  return false
}

/* -------------------------------------------------------------------------- */
/*                                Polygon math                                */
/* -------------------------------------------------------------------------- */

type Contour = { start: Pt; segs: readonly Cubic[] }

const r2 = (n: number) => +n.toFixed(2)

function contourPath({ start, segs }: Contour): string {
  let d = `M${r2(start[0])} ${r2(start[1])}`
  for (const c of segs) d += `C${c.map(r2).join(" ")}`
  return d + "Z"
}

function sampleContour({ start, segs }: Contour, steps = 14): Pt[] {
  const pts: Pt[] = []
  let a = start
  for (const c of segs) {
    const b: Pt = [c[0], c[1]]
    const cc: Pt = [c[2], c[3]]
    const d: Pt = [c[4], c[5]]
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      const u = 1 - t
      const w0 = u * u * u
      const w1 = 3 * u * u * t
      const w2 = 3 * u * t * t
      const w3 = t * t * t
      pts.push([w0 * a[0] + w1 * b[0] + w2 * cc[0] + w3 * d[0], w0 * a[1] + w1 * b[1] + w2 * cc[1] + w3 * d[1]])
    }
    a = d
  }
  return pts
}

/** Closed contour from the viewer's-left half (crown → crotch), mirrored. */
function symmetricContour(start: Pt, half: readonly Cubic[]): Contour {
  const segs: Cubic[] = [...half]
  for (let i = half.length - 1; i >= 0; i--) {
    const c = half[i]
    const s = i === 0 ? start : ([half[i - 1][4], half[i - 1][5]] as Pt)
    segs.push([mx(c[2]), c[3], mx(c[0]), c[1], mx(s[0]), s[1]])
  }
  return { start, segs }
}

function mapContour({ start, segs }: Contour, f: (p: Pt) => Pt): Contour {
  return {
    start: f(start),
    segs: segs.map((c) => {
      const a = f([c[0], c[1]])
      const b = f([c[2], c[3]])
      const d = f([c[4], c[5]])
      return [a[0], a[1], b[0], b[1], d[0], d[1]] as Cubic
    }),
  }
}

/** Re-maps every coordinate pair of an absolute path (M/C/L/Z only). */
function mapPath(d: string, f: (p: Pt) => Pt): string {
  return d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_, x: string, y: string) => {
    const [nx, ny] = f([Number(x), Number(y)])
    return `${r2(nx)} ${r2(ny)}`
  })
}

const mirrorPt = ([x, y]: Pt): Pt => [mx(x), y]
const mirrorPath = (d: string) => mapPath(d, mirrorPt)
const mirrorCell = (cell: readonly Pt[]): Pt[] => cell.map(mirrorPt).reverse()

function signedArea(poly: readonly Pt[]) {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

function intersect(p: Pt, q: Pt, sp: number, sq: number): Pt {
  const t = sp / (sp - sq)
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
}

/** Sutherland–Hodgman: clip a (possibly concave) subject by a convex cell. */
function clipPolygon(subject: readonly Pt[], cell: readonly Pt[]): Pt[] {
  const dir = signedArea(cell) > 0 ? 1 : -1
  let output: Pt[] = subject.slice()
  for (let i = 0; i < cell.length && output.length; i++) {
    const a = cell[i]
    const b = cell[(i + 1) % cell.length]
    const side = (p: Pt) => dir * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]))
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

/** Drop the zero-area "flaps" Sutherland–Hodgman leaves along cell edges. */
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

export function pointInPolygon([px, py]: Pt, poly: readonly Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const BIG: Pt[] = [
  [-400, -400],
  [640, -400],
  [640, 900],
  [-400, 900],
]
/** Keep the side of line a→b that contains `ref`. */
function keep(poly: readonly Pt[], a: Pt, b: Pt, ref: Pt): Pt[] {
  const s = (p: Pt) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
  const far: Pt[] = s(ref) >= 0 ? [a, b] : [b, a]
  // half-plane as a big convex quad on the kept side
  const dx = far[1][0] - far[0][0]
  const dy = far[1][1] - far[0][1]
  const len = Math.hypot(dx, dy)
  const ux = (dx / len) * 5000
  const uy = (dy / len) * 5000
  const nx = -uy
  const ny = ux
  const quad: Pt[] = [
    [far[0][0] - ux, far[0][1] - uy],
    [far[0][0] + ux, far[0][1] + uy],
    [far[0][0] + ux + nx, far[0][1] + uy + ny],
    [far[0][0] - ux + nx, far[0][1] - uy + ny],
  ]
  return clipPolygon(poly, quad)
}
/** Intersection of half-planes [a, b, ref] (always convex). */
const cellOf = (...planes: [Pt, Pt, Pt][]) => planes.reduce<Pt[]>((poly, [a, b, r]) => keep(poly, a, b, r), BIG)
const above = (y: number): [Pt, Pt, Pt] => [[0, y], [1, y], [0, y - 1]]
const below = (y: number): [Pt, Pt, Pt] => [[0, y], [1, y], [0, y + 1]]
const leftOf = (x: number): [Pt, Pt, Pt] => [[x, 0], [x, 1], [x - 1, 0]]
const rightOf = (x: number): [Pt, Pt, Pt] => [[x, 0], [x, 1], [x + 1, 0]]
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]

/* -------------------------------------------------------------------------- */
/*                                 Silhouettes                                */
/* -------------------------------------------------------------------------- */

const HALF_START: Pt = [120, 10]

/** Original head (simple mode keeps today's exact outline). */
const HEAD_SIMPLE: Cubic[] = [
  [107, 10, 97.5, 19.5, 97, 34],
  [96.6, 45, 97.5, 53, 100, 59.5],
  [102.5, 65.5, 105.5, 70, 110, 72.5],
]
/** Detailed head with ears and a defined jaw angle. */
const HEAD_DETAILED: Cubic[] = [
  [108.6, 10, 99.6, 17.5, 98.2, 31],
  [97.6, 36, 97.4, 39.8, 97.4, 42.5],
  // ear
  [95.2, 40.6, 92.5, 41.4, 92.2, 45.2],
  [91.9, 49.5, 93.4, 55.6, 96, 58.8],
  [96.9, 60, 97.9, 60.6, 98.8, 60.2],
  // jaw
  [100.2, 64.6, 104.3, 69.6, 110, 72.5],
]

/** Male body from the neck down (also the original neutral figure). */
const BODY_MALE: Cubic[] = [
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

/** Female body: narrower shoulders and waist, wider hips, fuller thighs. */
const BODY_FEMALE: Cubic[] = [
  // neck
  [110.8, 78, 110.9, 84, 110.1, 88.5],
  // trapezius + deltoid
  [105.5, 91.8, 94, 94.2, 84.6, 97.6],
  [74.6, 101.2, 67.6, 108.6, 66.8, 122.5],
  // outer arm
  [66.3, 140, 63, 160, 61.6, 176],
  [61, 186, 59, 195, 57.5, 204],
  [55.5, 221, 52.5, 242, 50.7, 258],
  // hand
  [48.8, 264, 45.6, 271, 45.2, 279],
  [44.8, 287, 46, 295, 46.5, 302],
  [47.3, 312, 51.3, 320, 56, 320],
  [60.8, 320, 63.6, 313, 64.4, 303],
  [65.2, 292, 66, 279, 64.8, 266],
  // inner forearm, elbow, upper arm
  [64.8, 248, 68.2, 229, 71, 214],
  [72, 207, 73, 201.5, 74, 196],
  [76, 177, 79, 158, 82, 148],
  [83.5, 142.5, 85, 138.5, 86.5, 137],
  // torso side: bust, waist, hip flare
  [88.4, 141, 89.6, 150, 89.4, 160],
  [89.2, 175, 88, 187, 88.6, 200],
  [89.2, 214, 84, 236, 77.5, 252],
  [74.5, 260, 72.6, 268, 72.5, 280],
  // outer leg
  [72.5, 300, 75, 320, 79.5, 337],
  [82, 347, 83.2, 356, 82.8, 366],
  [81.8, 377, 79.8, 391, 81.2, 410],
  [83, 430, 89.5, 448, 91, 460],
  // foot
  [91.4, 467, 88.5, 476, 88.3, 483],
  [88.2, 488.5, 92, 491, 98.5, 491],
  [103, 491, 107.5, 491, 110.5, 490],
  [113.5, 489, 114, 485, 113.2, 480],
  // inner leg
  [112.3, 473, 109.6, 466, 109.2, 458],
  [107.8, 444, 104.2, 424, 104.6, 404],
  [105, 388, 107.5, 374, 107.6, 362],
  [107.7, 352, 108.7, 344, 110, 337],
  [112.6, 316, 117, 295, 118.8, 283],
  [119.2, 278.5, 119.6, 275.5, 120, 274.5],
]

interface Landmarks {
  /** Seam points in the gap between arm and torso (viewer's left). */
  armpit: Pt
  waist: Pt
  hip: Pt
  chestBottom: number
  /** Anterior superior iliac spine: start of the inguinal line. */
  asis: Pt
  hipSplitX: number
  thighTopY: number
  wristY: number
  palmY: number
}

const LANDMARKS: Record<BodySex, Landmarks> = {
  male: {
    armpit: [84.5, 136],
    waist: [77.5, 205],
    hip: [68.5, 250],
    chestBottom: 160,
    asis: [82, 238],
    hipSplitX: 89,
    thighTopY: 290,
    wristY: 266,
    palmY: 296,
  },
  female: {
    armpit: [86.5, 137],
    waist: [81, 205],
    hip: [69.5, 252],
    chestBottom: 164,
    asis: [84, 240],
    hipSplitX: 90,
    thighTopY: 292,
    wristY: 265,
    palmY: 294,
  },
}

function bodyContour(sex: BodySex, detail: BodyMapDetail): Contour {
  const head = detail === "simple" ? HEAD_SIMPLE : HEAD_DETAILED
  return symmetricContour(HALF_START, [...head, ...(sex === "female" ? BODY_FEMALE : BODY_MALE)])
}

/* -------------------------------------------------------------------------- */
/*                                 Region cells                               */
/* -------------------------------------------------------------------------- */

interface RegionDef {
  id: string
  cell: Pt[]
  /** Higher layers are drawn on top and cut out of the layer directly below. */
  layer?: number
}

const lerpSeam = (a: Pt, b: Pt, y: number): Pt => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]

function seamX(L: Landmarks, y: number): number {
  if (y <= L.waist[1]) return lerpSeam(L.armpit, L.waist, y)[0]
  if (y <= L.hip[1]) return lerpSeam(L.waist, L.hip, y)[0]
  return L.hip[0]
}

/** Arm band left of the (convex) arm/torso seam polyline. */
function armCell(L: Landmarks, y0: number, y1: number): Pt[] {
  const pts: Pt[] = [
    [0, y0],
    [seamX(L, y0), y0],
  ]
  for (const v of [L.waist, L.hip]) if (v[1] > y0 && v[1] < y1) pts.push(v)
  pts.push([seamX(L, y1), y1], [0, y1])
  return pts
}

/** Torso band right of the seam, using the chord (any sliver lies in the arm gap). */
const torsoCell = (L: Landmarks, y0: number, y1: number, xIn: number): Pt[] => [
  [seamX(L, y0), y0],
  [xIn, y0],
  [xIn, y1],
  [seamX(L, y1), y1],
]

function simpleDefs(view: BodyFigureView, L: Landmarks): RegionDef[] {
  const ARMPIT = L.armpit
  const WAIST = L.waist
  const HIP = L.hip
  const ARM_188 = lerpSeam(ARMPIT, WAIST, 188)
  const CHEST_170 = lerpSeam(ARMPIT, WAIST, 170)
  const ARM_214 = lerpSeam(WAIST, HIP, 214)
  const GROIN: Pt = [120, 292]
  const ING_242 = lerpSeam(WAIST, GROIN, 242)
  const ING_268 = lerpSeam(WAIST, GROIN, 268)
  const Y_FACE = 44
  const Y_NECK = 75
  const Y_THIGH = 340
  const Y_KNEE = 374
  const Y_ANKLE = 452
  const CELL: Record<string, Pt[]> = {
    head: rect(20, 0, 220, Y_FACE),
    face: rect(20, Y_FACE, 220, Y_NECK),
    headBack: rect(20, 0, 220, Y_NECK),
    neck: [[97, Y_NECK], [143, Y_NECK], [143, 92], [120, 100], [97, 92]],
    shoulder: [[0, Y_NECK], [97, Y_NECK], [97, 92], ARMPIT, [0, 166]],
    chest: [[97, 92], [120, 100], [120, 170], CHEST_170, ARMPIT],
    upperBack: [[97, 92], [120, 100], [120, 205], WAIST, ARMPIT],
    upperArm: [[0, 166], ARMPIT, ARM_188, [0, 188]],
    elbow: [[0, 188], ARM_188, WAIST, ARM_214, [0, 214]],
    // chord past the hip vertex keeps the cell convex (the sliver is in the arm gap)
    forearm: [[0, 214], ARM_214, [HIP[0], 262], [0, 262]],
    hand: rect(0, 262, HIP[0], Y_THIGH),
    upperAbdomen: [CHEST_170, [mx(CHEST_170[0]), 170], [mx(WAIST[0]), 205], WAIST],
    lowerAbdomen: [WAIST, [mx(WAIST[0]), 205], [mx(ING_242[0]), 242], ING_242],
    pelvis: [ING_242, [mx(ING_242[0]), 242], GROIN],
    hip: [WAIST, ING_268, [HIP[0], 284], HIP],
    thigh: [[HIP[0], 284], ING_268, GROIN, [120, Y_THIGH], [HIP[0], Y_THIGH]],
    lowerBack: [WAIST, [120, 205], [120, 250], HIP],
    buttock: [HIP, [120, 250], [120, 303], [HIP[0], 303]],
    thighBack: [[HIP[0], 303], [120, 303], [120, Y_THIGH], [HIP[0], Y_THIGH]],
    knee: rect(0, Y_THIGH, 120, Y_KNEE),
    shin: rect(0, Y_KNEE, 120, Y_ANKLE),
    foot: rect(0, Y_ANKLE, 120, 520),
  }
  const CELLS: Record<BodyRegionId, [string, boolean]> = {
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
  return BODY_REGIONS.filter((r) => r.view === view).map((r) => {
    const [name, mirrored] = CELLS[r.id]
    return { id: r.id, cell: mirrored ? mirrorCell(CELL[name]) : CELL[name] }
  })
}

// Facial features, drawn for the viewer's-left side (body coordinates).
const EYE: Pt[] = [[103.6, 43.8], [106, 40.6], [113, 40.5], [115.6, 43.8], [113, 46.6], [106, 46.6]]
const NOSE: Pt[] = [[117.4, 42.5], [122.6, 42.5], [125.9, 55.2], [124, 58], [116, 58], [114.1, 55.2]]
const MOUTH: Pt[] = [[111.8, 62.2], [115.5, 59.9], [124.5, 59.9], [128.2, 62.2], [124.5, 65], [115.5, 65]]
const JAW: Pt[] = [[101.2, 65.6], [138.8, 65.6], [132, 72.5], [120, 77.5], [108, 72.5]]
const EAR: Pt[] = [[89, 40], [97.2, 40], [98.94, 62], [89, 62]]
// close-up refinements
const EYEBROW: Pt[] = [[103.6, 39.6], [105.2, 37.6], [110, 37], [114.6, 38], [115.4, 39.8]]
const NOSTRIL: Pt[] = [[115.6, 56.4], [117.2, 55.4], [119, 56.4], [118.8, 57.5], [116.3, 57.6]]
const CHIN: Pt[] = [[114, 71], [126, 71], [124.5, 75.2], [120, 77], [115.5, 75.2]]
const LID_Y = 42.6
const LIP_Y = 62.45
const LOBE_Y = 55.5

function detailedDefs(view: BodyFigureView, L: Landmarks): RegionDef[] {
  // The patient's side drawn on the viewer's left.
  const vl: Side = view === "front" ? "right" : "left"
  const vr: Side = vl === "right" ? "left" : "right"
  const out: RegionDef[] = []
  const add = (id: string, cell: Pt[], layer = 0) => out.push({ id, cell, layer })
  const pair = (id: string, cell: Pt[], layer = 0) => {
    add(fill(id, vl), cell, layer)
    add(fill(id, vr), mirrorCell(cell), layer)
  }
  const prefix = view === "back" ? "back-of-" : ""
  const shoulderCell: Pt[] = [[0, 70], [97, 70], [97, 92], L.armpit, [0, 166]]
  const upperArm: Pt[] = [[0, 166], L.armpit, [seamX(L, 186), 186], [0, 186]]

  add("scalp", rect(20, 0, 220, 25))
  pair("ear-{s}", EAR, 1)

  // arms (same bands front and back)
  pair(`${prefix}shoulder-{s}`, shoulderCell)
  pair(`${prefix}upper-arm-{s}`, upperArm)
  pair(`${prefix}elbow-{s}`, armCell(L, 186, 207))
  pair(`${prefix}forearm-{s}`, armCell(L, 207, L.hip[1]))
  pair(`${prefix}wrist-{s}`, armCell(L, L.hip[1], L.wristY))
  pair(view === "back" ? "back-of-hand-{s}" : "palm-{s}", armCell(L, L.wristY, L.palmY))
  pair("fingers-{s}", armCell(L, L.palmY, 338))

  if (view === "front") {
    add("forehead", [[104.5, 25], [135.5, 25], [138, 41], [102, 41]])
    pair("temple-{s}", [[20, 25], [104.5, 25], [102, 41], [20, 41]])
    pair("cheek-{s}", rect(20, 41, 120, 70))
    add("throat", [[97, 70], [143, 70], [143, 92], [126, 98], [114, 98], [97, 92]])
    pair("eye-{s}", EYE, 1)
    add("nose", NOSE, 1)
    add("mouth", MOUTH, 1)
    add("jaw", JAW, 1)

    const cb = L.chestBottom
    pair("chest-{s}", [[97, 92], [114, 98], [114, cb], [seamX(L, cb), cb], L.armpit])
    add("sternum", rect(114, 98, 126, cb))
    pair("hypochondrium-{s}", torsoCell(L, cb, 188, 105))
    add("epigastrium", rect(105, cb, 135, 188))
    pair("flank-{s}", torsoCell(L, 188, 230, 105))
    add("umbilical", rect(105, 188, 135, 230))

    // inguinal line from the ASIS to the top corner of the pubic triangle
    const P: Pt = [105, 252]
    const A = L.asis
    const ingY = (x: number) => A[1] + ((P[1] - A[1]) * (x - A[0])) / (P[0] - A[0])
    // where it meets the seam (waist → hip segment)
    let lo = L.waist[1]
    let hi = L.hip[1]
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      if (ingY(seamX(L, mid)) > mid) lo = mid
      else hi = mid
    }
    const ingSeam: Pt = [seamX(L, lo), lo]
    const hx = L.hipSplitX
    const Gm: Pt = [112.5, 268] // midpoint of the pubic triangle's side
    const thTop: Pt = [L.hip[0], L.thighTopY]
    const thY = (x: number) => thTop[1] + ((Gm[1] - thTop[1]) * (x - thTop[0])) / (Gm[0] - thTop[0])

    pair("iliac-{s}", [[seamX(L, 230), 230], [105, 230], P, ingSeam])
    add("suprapubic", rect(105, 230, 135, 252))
    add("genitals", [P, [135, 252], [120, 284]])
    pair("groin-{s}", [[hx, ingY(hx)], P, Gm, [hx, thY(hx)]])
    pair("hip-{s}", [ingSeam, [hx, ingY(hx)], [hx, thY(hx)], thTop, L.hip])
    pair("thigh-{s}", [thTop, Gm, [120, 284], [120, 338], [L.hip[0], 338]])
    pair("knee-{s}", rect(0, 338, 120, 372))
    pair("shin-{s}", rect(0, 372, 120, 448))
    pair("ankle-{s}", rect(0, 448, 120, 466))
    pair("foot-{s}", rect(0, 466, 120, 482))
    pair("toes-{s}", rect(0, 482, 120, 530))
  } else {
    add("back-of-head", rect(20, 25, 220, 70))
    add("nape", [[97, 70], [143, 70], [143, 92], [120, 100], [97, 92]])
    pair("upper-back-{s}", [[97, 92], [120, 100], [120, 150], [seamX(L, 150), 150], L.armpit])
    add("mid-back", [
      [seamX(L, 150), 150],
      [mx(seamX(L, 150)), 150],
      [mx(seamX(L, 200)), 200],
      [seamX(L, 200), 200],
    ])
    pair("lower-back-{s}", [[seamX(L, 200), 200], [120, 200], [120, L.hip[1]], L.hip])
    pair("buttock-{s}", [L.hip, [120, L.hip[1]], [120, 300], [L.hip[0], 300]])
    pair("back-of-thigh-{s}", rect(L.hip[0], 300, 120, 338))
    pair("back-of-knee-{s}", rect(0, 338, 120, 372))
    pair("calf-{s}", rect(0, 372, 120, 448))
    pair("back-of-ankle-{s}", rect(0, 448, 120, 466))
    pair("heel-{s}", rect(0, 466, 120, 484))
    pair("sole-{s}", rect(0, 484, 120, 530))
  }
  return out
}

/** Face close-up: the detailed head regions plus finer parts. */
function faceDefs(L: Landmarks): RegionDef[] {
  const HEAD_IDS = new Set(["scalp", "forehead", "throat", "nose", "jaw"])
  const base = detailedDefs("front", L).filter(
    (r) => HEAD_IDS.has(r.id) || /^(temple|cheek|ear)-/.test(r.id)
  )
  const out: RegionDef[] = [...base]
  const pair = (id: string, cell: Pt[], layer: number) => {
    out.push({ id: fill(id, "right"), cell, layer }, { id: fill(id, "left"), cell: mirrorCell(cell), layer })
  }
  pair("eyebrow-{s}", EYEBROW, 1)
  pair("eyelid-{s}", keep(EYE, [0, LID_Y], [1, LID_Y], [110, 0]), 1)
  pair("eye-{s}", keep(EYE, [0, LID_Y], [1, LID_Y], [110, 99]), 1)
  pair("nostril-{s}", NOSTRIL, 2)
  pair("earlobe-{s}", keep(EAR, [0, LOBE_Y], [1, LOBE_Y], [90, 99]), 2)
  out.push(
    { id: "lip-upper", cell: keep(MOUTH, [0, LIP_Y], [1, LIP_Y], [120, 0]), layer: 1 },
    { id: "lip-lower", cell: keep(MOUTH, [0, LIP_Y], [1, LIP_Y], [120, 99]), layer: 1 },
    { id: "chin", cell: CHIN, layer: 2 }
  )
  return out
}

/* -------------------------------------------------------------------------- */
/*                              Close-up drawings                             */
/* -------------------------------------------------------------------------- */

/** Right hand, palm towards the viewer, thumb on the viewer's left. */
const HAND: Contour = {
  start: [93, 100],
  segs: [
    [92.5, 130, 91.5, 152, 90.5, 170],
    [87, 186, 76, 206, 68, 228],
    [62, 244, 58, 262, 58.5, 276],
    [59, 289, 69, 294, 74, 285],
    [78, 276, 82, 263, 88.6, 253.5],
    [88.9, 255, 88.2, 258, 88, 262],
    [87.5, 280, 86.5, 310, 87, 334],
    [87.5, 346, 100.5, 348, 101, 335],
    [101.6, 310, 102, 286, 102.6, 271],
    [103, 269, 104, 269, 104.4, 271],
    [104.6, 300, 103.8, 330, 104, 346],
    [104.4, 360, 119.4, 360, 119.6, 346],
    [120, 330, 120.3, 300, 120.5, 273],
    [120.9, 271, 121.9, 271, 122.3, 273],
    [122.5, 300, 122.6, 325, 122.5, 339],
    [122.5, 352, 136, 352, 136.1, 339],
    [136.2, 318, 136.5, 295, 136.9, 272],
    [137.3, 270, 138.3, 270, 138.7, 272],
    [138.8, 293, 138.5, 310, 138.8, 322],
    [139.2, 335, 150.6, 335, 150.7, 321],
    [151, 302, 151.4, 284, 151.2, 266],
    [153.6, 240, 155, 212, 152.6, 186],
    [150.6, 165, 149, 140, 148.6, 100],
    [130, 100, 111, 100, 93, 100],
  ],
}

function handDefs(side: Side, surface: "palm" | "back"): RegionDef[] {
  const A: Pt = [88.6, 253.5] // thumb web
  const B: Pt = [76, 212] // up the thenar edge
  const W: Pt = [85, 300] // down between thumb and index
  const P1: Pt = [103.4, 270]
  const T: Pt = [60, 270] // a point on the thumb
  const s = (id: string) => fill(id, side)
  const back = surface === "back"
  return [
    { id: s(back ? "back-of-forearm-{s}" : "forearm-{s}"), cell: cellOf(above(140)) },
    { id: s(back ? "back-of-wrist-{s}" : "wrist-{s}"), cell: cellOf(below(140), above(176)) },
    { id: s("thumb-{s}"), cell: cellOf(below(176), [A, B, T], [A, W, T]) },
    {
      id: s(back ? "back-of-hand-{s}" : "palm-{s}"),
      cell: cellOf(below(176), [A, B, [140, 220]], [A, P1, [130, 200]], above(270)),
    },
    { id: s("index-finger-{s}"), cell: cellOf(below(176), [A, W, [100, 300]], [A, P1, [95, 320]], leftOf(103.4)) },
    { id: s("middle-finger-{s}"), cell: cellOf(below(270), rightOf(103.4), leftOf(121.4)) },
    { id: s("ring-finger-{s}"), cell: cellOf(below(270), rightOf(121.4), leftOf(137.6)) },
    { id: s("little-finger-{s}"), cell: cellOf(below(270), rightOf(137.6)) },
  ]
}

const HAND_DECOR = {
  palm: [
    "M91 186C84.5 204 84.5 228 88.5 247",
    "M90.5 214C108 211 130 217 150.5 228",
    "M104 251C118 245 136 247 150.5 254",
    "M88 300C93 302 97 302 101.8 300",
    "M87.6 322C92 324 97 324 101.4 322",
    "M104.3 304C109 306 115 306 120.2 304",
    "M104 330C109 332 115 332 119.9 330",
    "M122.5 302C127 304 132 304 136.4 302",
    "M122.6 326C127 328 132 328 136.2 326",
    "M138.7 292C142 294 147 294 151 292",
    "M138.7 310C142 312 147 312 150.9 310",
    "M64 262C67 265 72 266 76.5 263",
  ],
  back: [
    "M90.2 340.5C90 333 98.5 333 98.2 340.5",
    "M107.5 352C107.2 345 116.5 345 116.2 352",
    "M125.5 345C125.3 338 133.2 338 133 345",
    "M141.5 328C141.3 322 148.2 322 148 328",
    "M61.5 281C61.5 275 69 275 70.5 280.5",
    "M89 278C93 280.5 98 280.5 101.5 278",
    "M105 279C109.5 281.5 114.5 281.5 119.5 279",
    "M123 279C127 281 132 281 136 279",
    "M139.2 276C142.5 278 146.5 278 150.5 276",
  ],
}

/** Right foot in profile, toes towards the viewer's left. */
const FOOT: Contour = {
  start: [112, 150],
  segs: [
    [111, 190, 110, 225, 108, 250],
    [106, 262, 100, 270, 90, 276],
    [76, 284, 60, 294, 47, 302],
    [40, 306, 34, 311, 33.5, 318],
    [33, 325, 37, 330.5, 44, 331],
    [58, 333, 72, 331, 84, 327],
    [100, 322, 120, 322, 136, 328],
    [146, 332, 158, 331.5, 164, 324],
    [170, 316, 168, 302, 162, 294],
    [157, 284, 150, 270, 148, 252],
    [146, 230, 147, 190, 148, 150],
    [136, 150, 124, 150, 112, 150],
  ],
}

function footDefs(side: Side): RegionDef[] {
  const s = (id: string) => fill(id, side)
  const toe: [Pt, Pt, Pt] = [[58, 292], [50, 334], [30, 320]]
  const notToe: [Pt, Pt, Pt] = [toe[0], toe[1], [100, 300]]
  const heel: [Pt, Pt, Pt] = [[140, 280], [134, 340], [170, 320]]
  const notHeel: [Pt, Pt, Pt] = [heel[0], heel[1], [100, 300]]
  const sole: [Pt, Pt, Pt] = [[40, 320], [140, 318], [100, 340]]
  const notSole: [Pt, Pt, Pt] = [sole[0], sole[1], [100, 300]]
  const dorsum: [Pt, Pt, Pt] = [[96, 250], [118, 322], [60, 280]]
  const notDorsum: [Pt, Pt, Pt] = [dorsum[0], dorsum[1], [130, 270]]
  return [
    { id: s("shin-{s}"), cell: cellOf(above(245), leftOf(129)) },
    { id: s("calf-{s}"), cell: cellOf(above(245), rightOf(129)) },
    { id: s("toes-{s}"), cell: cellOf(below(245), toe) },
    { id: s("back-of-ankle-{s}"), cell: cellOf(below(245), notToe, heel, above(292)) },
    { id: s("heel-{s}"), cell: cellOf(below(292), notToe, heel) },
    { id: s("sole-{s}"), cell: cellOf(below(245), notToe, notHeel, sole) },
    { id: s("foot-{s}"), cell: cellOf(below(245), notToe, notHeel, notSole, dorsum) },
    { id: s("ankle-{s}"), cell: cellOf(below(245), notToe, notHeel, notSole, notDorsum) },
  ]
}

const FOOT_DECOR = [
  "M128 262C123.5 262 121 266 121.5 270C122 274.5 127 276 130.5 273.5C133.5 271 133 263.5 128 262Z",
  "M35.6 314.5C37 311 42 310.4 44.6 312.6",
  "M52 305C51 309 51.5 313 53 316",
]

/* -------------------------------------------------------------------------- */
/*                              Hints & decoration                            */
/* -------------------------------------------------------------------------- */

const SIMPLE_HINTS: Record<BodyFigureView, string[]> = {
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
const NAVEL = "M120 212.4C119.4 212.4 118.9 213.2 118.9 214C118.9 214.8 119.4 215.6 120 215.6C120.6 215.6 121.1 214.8 121.1 214C121.1 213.2 120.6 212.4 120 212.4Z"
/** Tiny face on the full-body view (viewer's-left half). */
const BODY_FACE_HALF = [
  "M104.5 39.4C107 38 111 37.8 114.6 39",
  "M95.6 45.5C94.4 48 94.8 52 96.4 54.4",
]
const BODY_FACE_CENTER = "M114.6 62.4C117.6 63.3 122.4 63.3 125.4 62.4"

const DETAILED_HINTS: Record<BodySex, Record<BodyFigureView, string[]>> = {
  male: {
    front: [SIMPLE_HINTS.front[0], SIMPLE_HINTS.front[1], SIMPLE_HINTS.front[2], ...BODY_FACE_HALF],
    back: [...SIMPLE_HINTS.back, "M95.6 45.5C94.4 48 94.8 52 96.4 54.4"],
  },
  female: {
    front: [
      "M108.8 95.6C102.4 97 95 98.2 87 100",
      "M90 147C91 158 97.5 165.5 105.5 165.5C110 165.5 113.2 163 115 159.5",
      SIMPLE_HINTS.front[2],
      ...BODY_FACE_HALF,
    ],
    back: [
      "M105.5 113C102 126 101.6 140 106.8 151",
      "M93.5 118C97 117 101.5 116.6 105 114",
      "M85 296C95 301.5 108 301 117.5 296",
      SIMPLE_HINTS.back[3],
      "M95.6 45.5C94.4 48 94.8 52 96.4 54.4",
    ],
  },
}

const circle = (cx: number, cy: number, r: number) => {
  const k = r * 0.5523
  return `M${cx} ${cy - r}C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}Z`
}

/** Face close-up decoration, in body coordinates (viewer's-left half). */
const FACE_DECOR_HALF = [
  "M104.5 43.9C106.6 41.9 112 41.7 114.8 43.7", // upper lid margin
  "M104.5 43.9C107 45.5 112 45.6 114.8 43.7", // lower lid margin
  "M105.4 42.3C107.6 40.9 112 40.8 114.2 42.1", // lid crease
  "M117.6 44.8C117.4 48.4 117 51.4 115.9 54", // nose side
  "M115.6 55.3C114.7 57.3 116.3 58.5 118 57.9", // ala
  "M95.6 45.2C94.2 47.6 94.5 52 96.3 54.6", // helix
  "M96.6 48.6C95.9 50 96.1 51.7 97 52.6", // concha
]
const FACE_DECOR_CENTER = [
  "M112.4 62.35C115.5 63.4 118 62.6 120 63.05C122 62.6 124.5 63.4 127.6 62.35", // lip line
  "M117.6 59.95C118.6 61 121.4 61 122.4 59.95", // cupid's bow
]
const FACE_DECOR_FEMALE = ["M114.8 43.7L116.1 42.9", "M114.3 42.8L115.3 41.7", "M113.5 42.2L114.1 41"]
const FACE_IRIS = [circle(109.7, 43.75, 1.75), circle(130.3, 43.75, 1.75)]

/* -------------------------------------------------------------------------- */
/*                                   Scenes                                   */
/* -------------------------------------------------------------------------- */

export interface BodyRegionShape {
  id: string
  label: string
  layer: number
  /** SVG path (even-odd: outer ring plus holes cut by higher layers). */
  d: string
  /** Outer polygon and holes, for hit testing. */
  poly: Pt[]
  holes: Pt[][]
  /** Label anchor (top-centre) in viewBox units. */
  anchor: Pt
  bbox: readonly [number, number, number, number]
}

export interface BodyMapScene {
  id: BodyMapSceneId
  title: string
  /** Patient side shown on the viewer's left, or `null` for close-ups that name the side in the title. */
  sides: [string, string] | null
  outline: string
  outlinePoly: Pt[]
  regions: BodyRegionShape[]
  /** Faint anatomical hint strokes. */
  hints: string
  /** Facial / hand detail strokes in close-ups. */
  decor: string
  /** Small filled details (irises). */
  decorFill: string
  /** Fade the silhouette out towards the edge it was cut from: transparent at `from`, opaque at `to`. */
  fade?: { from: number; to: number; regions: boolean }
  ground: boolean
}

const fmt = (pts: readonly Pt[]) => `M${pts.map(([x, y]) => `${+x.toFixed(2)} ${+y.toFixed(2)}`).join("L")}Z`
const area = (p: readonly Pt[]) => Math.abs(signedArea(p))

function buildRegions(outlinePoly: Pt[], defs: RegionDef[], sex: BodySex): BodyRegionShape[] {
  const clipped = defs.map((def) => ({ def, layer: def.layer ?? 0, poly: removeDegenerate(clipPolygon(outlinePoly, def.cell)) }))
  const live = clipped.filter((c) => c.poly.length >= 3 && area(c.poly) > 0.05)
  return live
    .map((c) => {
      const holes = live
        .filter((o) => o.layer === c.layer + 1)
        .map((o) => removeDegenerate(clipPolygon(o.poly, c.def.cell)))
        .filter((h) => h.length >= 3 && area(h) > 0.05)
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (const [x, y] of c.poly) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
      return {
        id: c.def.id,
        label: getBodyRegionLabel(c.def.id, { sex }),
        layer: c.layer,
        d: fmt(c.poly) + holes.map(fmt).join(""),
        poly: c.poly,
        holes,
        anchor: [(minX + maxX) / 2, minY] as Pt,
        bbox: [minX, minY, maxX, maxY] as const,
      }
    })
    .sort((a, b) => a.layer - b.layer)
}

// Face close-up: body head scaled about the middle of the canvas.
const FACE_K = 3.1
const faceT = ([x, y]: Pt): Pt => [CX + (x - CX) * FACE_K, 232 + (y - 54) * FACE_K]
// Hand and foot drawings are authored small; these place them in the canvas.
const handT = ([x, y]: Pt): Pt => [CX + (x - 106.5) * 1.32, 236 + (y - 230) * 1.32]
const footT = ([x, y]: Pt): Pt => [CX + (x - 101.75) * 1.08, 236 + (y - 240) * 1.08]

function buildScene(id: BodyMapSceneId, sex: BodySex, detail: BodyMapDetail): BodyMapScene {
  const L = LANDMARKS[sex]
  if (id === "front" || id === "back") {
    const contour = bodyContour(sex, detail)
    const outlinePoly = sampleContour(contour)
    const defs = detail === "simple" ? simpleDefs(id, L) : detailedDefs(id, L)
    const half = detail === "simple" ? SIMPLE_HINTS[id] : DETAILED_HINTS[sex][id]
    let hints = [...half, ...half.map(mirrorPath)].join("")
    if (id === "front") hints += detail === "simple" ? "M120 214a1.1 1.6 0 1 0 0.01 0Z" : NAVEL
    if (id === "front" && detail === "detailed") hints += BODY_FACE_CENTER
    return {
      id,
      title: id === "front" ? "Front" : "Back",
      sides: id === "front" ? ["R", "L"] : ["L", "R"],
      outline: contourPath(contour),
      outlinePoly,
      regions: buildRegions(outlinePoly, defs, sex),
      hints,
      decor: "",
      decorFill: "",
      ground: true,
    }
  }
  if (id === "head") {
    const contour = mapContour(bodyContour(sex, "detailed"), faceT)
    const outlinePoly = sampleContour(contour)
    const defs = faceDefs(L).map((r) => ({ ...r, cell: r.cell.map(faceT) }))
    const decorBody = [
      ...FACE_DECOR_HALF,
      ...FACE_DECOR_HALF.map(mirrorPath),
      ...FACE_DECOR_CENTER,
      ...(sex === "female" ? [...FACE_DECOR_FEMALE, ...FACE_DECOR_FEMALE.map(mirrorPath)] : []),
    ]
    const clav = DETAILED_HINTS[sex].front[0]
    return {
      id,
      title: "Face",
      sides: ["R", "L"],
      outline: contourPath(contour),
      outlinePoly,
      regions: buildRegions(outlinePoly, defs, sex),
      hints: mapPath(clav + mirrorPath(clav), faceT),
      decor: decorBody.map((d) => mapPath(d, faceT)).join(""),
      decorFill: FACE_IRIS.map((d) => mapPath(d, faceT)).join(""),
      fade: { from: 378, to: 338, regions: false },
      ground: false,
    }
  }
  const m = id.match(/^(hand|foot)-(left|right)(?:-(palm|back))?$/)!
  const part = m[1] as "hand" | "foot"
  const side = m[2] as Side
  if (part === "hand") {
    const surface = (m[3] ?? "palm") as "palm" | "back"
    // base drawing is the right palm; mirror for left palm / right back
    const mirrored = (side === "left") !== (surface === "back")
    const f = (p: Pt) => (mirrored ? mirrorPt(handT(p)) : handT(p))
    const contour = mapContour(HAND, f)
    const outlinePoly = sampleContour(contour)
    const defs = handDefs(side, surface).map((r) => {
      const cell = r.cell.map(handT)
      return { ...r, cell: mirrored ? mirrorCell(cell) : cell }
    })
    return {
      id,
      title: `${side === "left" ? "Left" : "Right"} hand · ${surface === "palm" ? "palm" : "back"}`,
      sides: null,
      outline: contourPath(contour),
      outlinePoly,
      regions: buildRegions(outlinePoly, defs, sex),
      hints: "",
      decor: HAND_DECOR[surface].map((d) => mapPath(d, f)).join(""),
      decorFill: "",
      fade: { from: 64, to: 108, regions: true },
      ground: false,
    }
  }
  const mirrored = side === "left"
  const f = (p: Pt) => (mirrored ? mirrorPt(footT(p)) : footT(p))
  const contour = mapContour(FOOT, f)
  const outlinePoly = sampleContour(contour)
  return {
    id,
    title: `${side === "left" ? "Left" : "Right"} foot · side`,
    sides: null,
    outline: contourPath(contour),
    outlinePoly,
    regions: buildRegions(
      outlinePoly,
      footDefs(side).map((r) => {
        const cell = r.cell.map(footT)
        return { ...r, cell: mirrored ? mirrorCell(cell) : cell }
      }),
      sex
    ),
    hints: "",
    decor: FOOT_DECOR.map((d) => mapPath(d, f)).join(""),
    decorFill: "",
    fade: { from: 138, to: 178, regions: true },
    ground: false,
  }
}

const SCENES = new Map<string, BodyMapScene>()

/** Geometry for one scene. Cached; safe to call during render and on the server. */
export function getBodyMapScene(
  id: BodyMapSceneId,
  options: { sex?: BodySex; detail?: BodyMapDetail } = {}
): BodyMapScene {
  const sex = options.sex ?? "male"
  const detail = id === "front" || id === "back" ? (options.detail ?? "detailed") : "detailed"
  const key = `${id}|${sex}|${detail}`
  let scene = SCENES.get(key)
  if (!scene) {
    scene = buildScene(id, sex, detail)
    SCENES.set(key, scene)
  }
  return scene
}

/** Regions selectable in a scene, in drawing order. */
export function getBodyRegions(
  view: BodyFigureView | BodyMapSceneId,
  options: { sex?: BodySex; detail?: BodyMapDetail } = {}
): { id: string; label: string }[] {
  return getBodyMapScene(view, options).regions.map(({ id, label }) => ({ id, label }))
}

/** Region under a viewBox point: topmost layer first, else the nearest region. */
export function hitTestBodyMapScene(scene: BodyMapScene, p: Pt): string {
  for (let i = scene.regions.length - 1; i >= 0; i--) {
    const r = scene.regions[i]
    if (pointInPolygon(p, r.poly) && !r.holes.some((h) => pointInPolygon(p, h))) return r.id
  }
  let best = scene.regions[0]
  let bestDist = Infinity
  for (const r of scene.regions) {
    const cx = (r.bbox[0] + r.bbox[2]) / 2
    const cy = (r.bbox[1] + r.bbox[3]) / 2
    const d = (cx - p[0]) ** 2 + (cy - p[1]) ** 2
    if (d < bestDist) {
      bestDist = d
      best = r
    }
  }
  return best.id
}

/* -------------------------------------------------------------------------- */
/*                                  Drill-down                                */
/* -------------------------------------------------------------------------- */

const FACE_PARTS = /^(scalp|forehead|temple-|eye-|ear-|nose|cheek-|mouth|jaw)/

/** The close-up a full-body region zooms into, if any. */
export function getZoomPart(id: string, view: BodyFigureView): BodyFocusPart | null {
  if (view === "front" && FACE_PARTS.test(id)) return "head"
  let m = id.match(/^(?:palm|fingers|wrist|back-of-hand|back-of-wrist)-(left|right)$/)
  if (m) return `hand-${m[1]}` as BodyFocusPart
  m = id.match(/^(?:ankle|foot|toes|back-of-ankle|heel|sole)-(left|right)$/)
  if (m) return `foot-${m[1]}` as BodyFocusPart
  return null
}

/** Scene shown for a focus part when coming from a body view. */
export function getFocusScene(part: BodyFocusPart, from: BodyFigureView): BodyMapSceneId {
  if (part.startsWith("hand-")) return `${part}-${from === "back" ? "back" : "palm"}` as BodyMapSceneId
  return part as BodyMapSceneId
}

const STUB = /^(forearm|back-of-forearm|shin|calf)-|^throat$/

type BBox = readonly [number, number, number, number]
const union = (boxes: BBox[]): BBox =>
  boxes.reduce<BBox>(
    (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])],
    [Infinity, Infinity, -Infinity, -Infinity]
  )

/**
 * Uniform scale + translate (viewBox units) that maps the part on the body
 * scene onto the matching close-up, for a continuous zoom animation.
 */
export function getZoomTransform(
  body: BodyMapScene,
  closeUp: BodyMapScene,
  part: BodyFocusPart
): { scale: number; x: number; y: number; origin: Pt } {
  // NaN scale = the part is not on this body view (callers fall back to a fade)
  const from = union(body.regions.filter((r) => getZoomPart(r.id, body.id as BodyFigureView) === part).map((r) => r.bbox))
  const to = union(closeUp.regions.filter((r) => !STUB.test(r.id)).map((r) => r.bbox))
  if (!Number.isFinite(from[0]) || !Number.isFinite(to[0])) return { scale: NaN, x: 0, y: 0, origin: [0, 0] }
  const scale = Math.min((to[2] - to[0]) / (from[2] - from[0]), (to[3] - to[1]) / (from[3] - from[1]))
  const fcx = (from[0] + from[2]) / 2
  const fcy = (from[1] + from[3]) / 2
  const tcx = (to[0] + to[2]) / 2
  const tcy = (to[1] + to[3]) / 2
  return { scale, x: tcx - fcx * scale, y: tcy - fcy * scale, origin: [fcx, fcy] }
}
