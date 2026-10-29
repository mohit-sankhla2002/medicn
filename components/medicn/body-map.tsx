"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { ArrowLeftIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  BODY_VIEWBOX,
  getBodyMapScene,
  getBodyRegionLabel,
  getFocusScene,
  getParentRegion,
  getZoomPart,
  getZoomTransform,
  isRegionAncestor,
  type BodyFigureView,
  type BodyFocusPart,
  type BodyMapDetail,
  type BodySex,
  type BodyView,
} from "@/components/medicn/body-map-data"

export {
  BODY_REGIONS,
  DETAILED_BODY_REGIONS,
  getBodyMapScene,
  getBodyRegionLabel,
  getBodyRegions,
  getParentRegion,
  getSimpleRegions,
  hitTestBodyMapScene,
  type BodyFigureView,
  type BodyFocusPart,
  type BodyMapDetail,
  type BodyMapScene,
  type BodyMapSceneId,
  type BodyRegionId,
  type BodyRegionInfo,
  type BodyRegionShape,
  type BodySex,
  type BodyView,
} from "@/components/medicn/body-map-data"

const [VB_X, VB_Y, VB_W, VB_H] = BODY_VIEWBOX
const VIEWBOX = BODY_VIEWBOX.join(" ")

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

const ancestorsOf = (id: string) => {
  const out: string[] = []
  for (let p = getParentRegion(id); p && out.length < 6; p = getParentRegion(p)) out.push(p)
  return out
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

const FOCUS_TURN: Record<BodyFocusPart, number> = {
  head: 10,
  "hand-right": 26,
  "hand-left": -26,
  "foot-right": 55,
  "foot-left": -55,
}

const persp = (deg: number) => `perspective(900px) rotateY(${deg}deg)`
const scaleAbout = (s: number) => `translate(${120 * (1 - s)}px, ${250 * (1 - s)}px) scale(${s})`

/* -------------------------------------------------------------------------- */
/*                                   BodyMap                                  */
/* -------------------------------------------------------------------------- */

export interface BodyMapProps extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  /** Controlled view. `"head"` shows the face close-up (detailed mode). */
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
  /** `"detailed"` splits the body into ~100 fine regions with zoomable close-ups; `"simple"` keeps the original 54. */
  detail?: BodyMapDetail
  /** Silhouette. Region ids are the same for both. */
  sex?: BodySex
  defaultSex?: BodySex
  onSexChange?: (sex: BodySex) => void
  /** Show a Male / Female toggle. */
  showSexToggle?: boolean
  /** Clicking the face, a hand or a foot zooms into a close-up (detailed mode). */
  zoomable?: boolean
  /** Controlled close-up (`null` = whole body). */
  focusPart?: BodyFocusPart | null
  defaultFocusPart?: BodyFocusPart | null
  onFocusPartChange?: (part: BodyFocusPart | null) => void
  /** Show the Front / Back (/ Face) toggle. */
  showViewToggle?: boolean
  /** Show a floating label with the region name on hover / focus. */
  showLabels?: boolean
  /** Regions can be inspected but not toggled. */
  readOnly?: boolean
  /** Region ids that cannot be selected (also disables their sub-regions). */
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
  detail = "detailed",
  sex: sexProp,
  defaultSex = "male",
  onSexChange,
  showSexToggle = false,
  zoomable = true,
  focusPart: focusProp,
  defaultFocusPart = null,
  onFocusPartChange,
  showViewToggle = true,
  showLabels = true,
  readOnly = false,
  disabledRegions = EMPTY,
  className,
  onKeyDown,
  ...props
}: BodyMapProps) {
  const [viewState, setView] = useControllableState(viewProp, defaultView, onViewChange)
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange)
  const [sex, setSex] = useControllableState(sexProp, defaultSex, onSexChange)
  const [focusState, setFocus] = useControllableState<BodyFocusPart | null>(
    focusProp,
    defaultFocusPart,
    onFocusPartChange
  )
  const [active, setActive] = React.useState<{ id: string; focus: boolean } | null>(null)
  const [announcement, setAnnouncement] = React.useState("")
  const titleId = React.useId()
  const uid = React.useId().replace(/:/g, "")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const sceneRef = React.useRef<SVGGElement>(null)
  const busy = React.useRef(false)
  const returnFocus = React.useRef<string | null>(null)

  const detailed = detail === "detailed"
  const canZoom = detailed && zoomable
  const bodyView: BodyFigureView = viewState === "back" ? "back" : "front"
  const focus: BodyFocusPart | null = detailed ? (focusState ?? (viewState === "head" ? "head" : null)) : null
  const sceneId = focus ? getFocusScene(focus, bodyView) : bodyView
  const scene = getBodyMapScene(sceneId, { sex, detail })
  const heat = intensity !== undefined

  const selected = React.useMemo(() => new Set(value), [value])
  const selectedAncestors = React.useMemo(() => new Set(value.flatMap(ancestorsOf)), [value])
  const disabled = React.useMemo(() => new Set(disabledRegions), [disabledRegions])
  const isDisabledId = (id: string) => disabled.has(id) || ancestorsOf(id).some((a) => disabled.has(a))
  const isRelated = (id: string) =>
    !selected.has(id) && (selectedAncestors.has(id) || ancestorsOf(id).some((a) => selected.has(a)))

  // own intensity, else the worst sub-region, else the nearest parent
  const childHeat = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const [id, level] of Object.entries(intensity ?? {})) {
      for (const a of ancestorsOf(id)) map.set(a, Math.max(map.get(a) ?? 0, level))
    }
    return map
  }, [intensity])
  const heatOf = (id: string): number | undefined => {
    if (!intensity) return undefined
    if (intensity[id] !== undefined) return intensity[id]
    if (childHeat.has(id)) return childHeat.get(id)
    for (const a of ancestorsOf(id)) if (intensity[a] !== undefined) return intensity[a]
    return undefined
  }

  const toggle = (id: string) => {
    if (readOnly || isDisabledId(id)) return
    if (selected.has(id)) {
      setValue(value.filter((v) => v !== id))
      return
    }
    // picking a finer (or coarser) part replaces its parent (or children)
    const rest = value.filter((v) => !isRegionAncestor(v, id) && !isRegionAncestor(id, v))
    setValue(multiple ? [...rest, id] : [id])
  }

  /* ------------------------------ transitions ----------------------------- */

  const run = async (
    phase1: (g: SVGGElement, stage: HTMLDivElement) => Animation[],
    commit: () => void,
    phase2: (g: SVGGElement, stage: HTMLDivElement) => Animation[],
    after?: () => void
  ) => {
    if (busy.current) return
    const g = sceneRef.current
    const stage = stageRef.current
    setActive(null)
    if (!g || !stage || typeof stage.animate !== "function" || prefersReducedMotion()) {
      flushSync(commit)
      after?.()
      return
    }
    busy.current = true
    try {
      const first = phase1(g, stage)
      await Promise.all(first.map((a) => a.finished))
      flushSync(commit)
      first.forEach((a) => a.cancel())
      const second = sceneRef.current && stageRef.current ? phase2(sceneRef.current, stageRef.current) : []
      await Promise.all(second.map((a) => a.finished))
      second.forEach((a) => a.cancel())
    } catch {
      // animation cancelled (unmount); the commit already happened or is irrelevant
    } finally {
      busy.current = false
      after?.()
    }
  }

  const focusRegion = (id?: string | null) =>
    requestAnimationFrame(() => {
      const el = id
        ? stageRef.current?.querySelector<SVGElement>(`[data-region="${id}"]`)
        : stageRef.current?.querySelector<SVGElement>("[data-region]:not([aria-disabled])")
      el?.focus({ preventScroll: true })
    })

  const zoomIn = (part: BodyFocusPart, originId: string | null, fromKeyboard: boolean) => {
    if (!canZoom || focus) return
    const from = bodyView === "back" && part === "head" ? "front" : bodyView
    const body = getBodyMapScene(from, { sex, detail })
    const target = getBodyMapScene(getFocusScene(part, from), { sex, detail })
    const t = getZoomTransform(body, target, part)
    const turn = FOCUS_TURN[part]
    returnFocus.current = originId
    const commit = () => {
      if (part === "head" || bodyView !== from) setView(part === "head" ? "head" : from)
      setFocus(part)
      setAnnouncement(`${target.title} close-up. Press Escape to return to the body.`)
    }
    const canTween = from === bodyView && Number.isFinite(t.scale)
    run(
      (g, stage) => [
        g.animate(
          canTween
            ? [
                { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
                { transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`, opacity: 1, offset: 0.78 },
                { transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`, opacity: 0 },
              ]
            : [{ opacity: 1 }, { opacity: 0 }],
          { duration: canTween ? 560 : 200, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "forwards" }
        ),
        stage.animate([{ transform: persp(0) }, { transform: persp(turn) }], {
          duration: 560,
          easing: "ease-in-out",
          fill: "forwards",
        }),
      ],
      commit,
      (g, stage) => [
        g.animate([{ opacity: 0, transform: scaleAbout(1.04) }, { opacity: 1, transform: scaleAbout(1) }], {
          duration: 280,
          easing: "ease-out",
        }),
        stage.animate([{ transform: persp(-turn * 0.5) }, { transform: persp(0) }], {
          duration: 320,
          easing: "ease-out",
        }),
      ],
      () => fromKeyboard && focusRegion()
    )
  }

  const zoomOut = (nextView?: BodyFigureView, fromKeyboard = true) => {
    if (!focus) return
    const to = nextView ?? bodyView
    const closeUp = scene
    const body = getBodyMapScene(to, { sex, detail })
    const t = getZoomTransform(body, closeUp, focus)
    const turn = FOCUS_TURN[focus]
    const origin = returnFocus.current
    const commit = () => {
      setFocus(null)
      if (viewState === "head" || to !== bodyView) setView(to)
      setAnnouncement(`${to === "front" ? "Front" : "Back"} of body.`)
    }
    const canTween = Number.isFinite(t.scale)
    run(
      (g, stage) => [
        g.animate([{ opacity: 1, transform: scaleAbout(1) }, { opacity: 0, transform: scaleAbout(1.04) }], {
          duration: 200,
          easing: "ease-in",
          fill: "forwards",
        }),
        stage.animate([{ transform: persp(0) }, { transform: persp(-turn * 0.5) }], {
          duration: 200,
          easing: "ease-in",
          fill: "forwards",
        }),
      ],
      commit,
      (g, stage) => [
        g.animate(
          canTween
            ? [
                { transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`, opacity: 0 },
                { transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`, opacity: 1, offset: 0.18 },
                { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
              ]
            : [{ opacity: 0 }, { opacity: 1 }],
          { duration: canTween ? 520 : 220, easing: "cubic-bezier(0.45, 0, 0.2, 1)" }
        ),
        stage.animate([{ transform: persp(turn) }, { transform: persp(0) }], { duration: 520, easing: "ease-in-out" }),
      ],
      () => {
        if (fromKeyboard) focusRegion(origin && to === bodyView ? origin : null)
        returnFocus.current = null
      }
    )
  }

  const flipTo = (next: BodyFigureView) => {
    if (next === bodyView) return
    const dir = next === "back" ? 1 : -1
    run(
      (_, stage) => [
        stage.animate([{ transform: persp(0) }, { transform: persp(90 * dir) }], {
          duration: 210,
          easing: "cubic-bezier(0.5, 0, 0.9, 0.5)",
          fill: "forwards",
        }),
      ],
      () => {
        setView(next)
        setAnnouncement(`${next === "front" ? "Front" : "Back"} of body.`)
      },
      (_, stage) => [
        stage.animate([{ transform: persp(-90 * dir) }, { transform: persp(0) }], {
          duration: 260,
          easing: "cubic-bezier(0.1, 0.5, 0.5, 1)",
        }),
      ]
    )
  }

  const onEscape = React.useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== "Escape" || !focus || e.defaultPrevented) return
    const activeEl = document.activeElement
    if (activeEl && activeEl !== document.body && !rootRef.current?.contains(activeEl)) return
    e.preventDefault()
    zoomOut(undefined, rootRef.current?.contains(activeEl) ?? false)
  })
  React.useEffect(() => {
    if (!focus) return
    const listener = (e: KeyboardEvent) => onEscape(e)
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [focus])

  /* -------------------------------- render -------------------------------- */

  const shapes = scene.regions
  const activeShape = active ? shapes.find((s) => s.id === active.id) : undefined
  const toggleValue = focus === "head" ? "head" : bodyView
  const zoomHintId = `${uid}-zoom-hint`
  const fadeId = `${uid}-fade`
  const fade = scene.fade

  return (
    <div
      ref={rootRef}
      data-slot="body-map"
      data-view={focus ? sceneId : bodyView}
      data-detail={detail}
      data-sex={sex}
      className={cn("flex w-full max-w-[280px] flex-col items-center gap-3", className)}
      onKeyDown={onKeyDown}
      {...props}
    >
      {(showViewToggle || showSexToggle) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {showViewToggle && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={toggleValue}
              onValueChange={(v) => {
                if (!v || v === toggleValue) return
                if (v === "head") zoomIn("head", null, false)
                else if (focus) zoomOut(v as BodyFigureView, false)
                else flipTo(v as BodyFigureView)
              }}
              aria-label="Body view"
            >
              <ToggleGroupItem value="front" className="px-3">
                Front
              </ToggleGroupItem>
              <ToggleGroupItem value="back" className="px-3">
                Back
              </ToggleGroupItem>
              {canZoom && (
                <ToggleGroupItem value="head" className="px-3">
                  Face
                </ToggleGroupItem>
              )}
            </ToggleGroup>
          )}
          {showSexToggle && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={sex}
              onValueChange={(v) => v && setSex(v as BodySex)}
              aria-label="Body type"
            >
              <ToggleGroupItem value="male" className="px-3">
                Male
              </ToggleGroupItem>
              <ToggleGroupItem value="female" className="px-3">
                Female
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      )}

      <div ref={stageRef} className="relative w-full [transform-style:flat]">
        <svg
          viewBox={VIEWBOX}
          role="group"
          aria-labelledby={titleId}
          className="block h-auto w-full overflow-hidden select-none"
          style={{ "--body-fill": "color-mix(in oklab, var(--foreground) 7%, var(--muted))" } as React.CSSProperties}
          onPointerLeave={() => setActive((a) => (a?.focus ? a : null))}
        >
          <title id={titleId}>{focus ? `Body map, ${scene.title} close-up` : `Body map, ${bodyView} view`}</title>
          {fade && (
            <defs>
              <linearGradient id={`${fadeId}-g`} gradientUnits="userSpaceOnUse" x1="0" y1={fade.from} x2="0" y2={fade.to}>
                <stop offset="0" stopColor="#000" />
                <stop offset="1" stopColor="#fff" />
              </linearGradient>
              <mask id={fadeId} maskUnits="userSpaceOnUse" x={VB_X} y={VB_Y} width={VB_W} height={VB_H}>
                <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill={`url(#${fadeId}-g)`} />
              </mask>
            </defs>
          )}

          {/* side markers */}
          {scene.sides && (
            <g aria-hidden="true" className="fill-muted-foreground/70 text-[9px] font-medium tracking-wide">
              <text x={VB_X + 6} y={VB_Y + 14}>
                {scene.sides[0]}
              </text>
              <text x={VB_X + VB_W - 6} y={VB_Y + 14} textAnchor="end">
                {scene.sides[1]}
              </text>
            </g>
          )}

          <g ref={sceneRef} style={{ transformBox: "view-box", transformOrigin: "0 0" }}>
            {scene.ground && (
              <ellipse aria-hidden="true" cx={120} cy={493} rx={34} ry={3} className="fill-foreground/[0.06]" />
            )}
            {fade && !fade.regions && (
              <path aria-hidden="true" d={scene.outline} mask={`url(#${fadeId})`} className="fill-(--body-fill)" />
            )}

            <g mask={fade?.regions ? `url(#${fadeId})` : undefined}>
              {shapes.map((shape) => {
                const isSelected = selected.has(shape.id)
                const related = isRelated(shape.id)
                const isDisabled = isDisabledId(shape.id)
                const level = heatOf(shape.id)
                const hasHeat = heat && level !== undefined && level > 0
                const zoomPart = canZoom && !focus && !isDisabled ? getZoomPart(shape.id, bodyView) : null
                const selectable = !readOnly && !isDisabled
                return (
                  <path
                    key={shape.id}
                    d={shape.d}
                    fillRule="evenodd"
                    role="checkbox"
                    aria-checked={isSelected ? true : related ? "mixed" : false}
                    aria-label={hasHeat ? `${shape.label}, intensity ${level} of 10` : shape.label}
                    aria-describedby={zoomPart ? zoomHintId : undefined}
                    aria-disabled={isDisabled || undefined}
                    aria-readonly={readOnly || undefined}
                    tabIndex={isDisabled ? -1 : 0}
                    data-region={shape.id}
                    data-layer={shape.layer}
                    data-zoom={zoomPart ?? undefined}
                    data-selected={isSelected || undefined}
                    data-related={related || undefined}
                    data-disabled={isDisabled || undefined}
                    style={hasHeat ? { fill: getBodyMapHeatColor(level) } : undefined}
                    className={cn(
                      "fill-(--body-fill) stroke-background outline-none [stroke-linejoin:round]",
                      // facial features are tiny on the full figure: thinner seams
                      shape.layer > 0 && !focus ? "[stroke-width:0.55]" : "[stroke-width:1.1]",
                      "transition-[fill,opacity] duration-150 ease-out motion-reduce:transition-none",
                      (selectable || zoomPart) && (zoomPart ? "cursor-zoom-in" : "cursor-pointer"),
                      (selectable || zoomPart) &&
                        !isSelected &&
                        !hasHeat &&
                        "hover:fill-[color-mix(in_oklab,var(--primary)_25%,var(--body-fill))]",
                      (selectable || zoomPart) && hasHeat && "hover:opacity-85",
                      related && !heat && "fill-[color-mix(in_oklab,var(--primary)_45%,var(--body-fill))]",
                      isSelected && !heat && "fill-primary hover:fill-primary/90",
                      isDisabled && "cursor-not-allowed fill-[color-mix(in_oklab,var(--muted)_45%,var(--background))]"
                    )}
                    onClick={() => (zoomPart ? zoomIn(zoomPart, shape.id, false) : toggle(shape.id))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && zoomPart) {
                        e.preventDefault()
                        zoomIn(zoomPart, shape.id, true)
                      } else if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggle(shape.id)
                      }
                    }}
                    onPointerEnter={() => !busy.current && setActive({ id: shape.id, focus: false })}
                    onFocus={(e) =>
                      setActive({ id: shape.id, focus: e.currentTarget.matches(":focus-visible") })
                    }
                    onBlur={() => setActive(null)}
                  />
                )
              })}
            </g>

            {/* anatomical hints and close-up details */}
            <g aria-hidden="true" className="pointer-events-none" mask={fade ? `url(#${fadeId})` : undefined}>
              {scene.hints && (
                <path d={scene.hints} className="fill-none stroke-foreground/15 [stroke-linecap:round] [stroke-width:0.9]" />
              )}
              {scene.decorFill && <path d={scene.decorFill} className="fill-foreground/25" />}
              {scene.decor && (
                <path
                  d={scene.decor}
                  className="fill-none stroke-foreground/30 [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.1]"
                />
              )}
              <path
                d={scene.outline}
                className="fill-none stroke-foreground/25 [stroke-linejoin:round] [stroke-width:1.25] dark:stroke-foreground/30"
              />
            </g>

            {/* selection outlines (heat map mode), clipped to each region so cut-outs stay clean */}
            {heat && (
              <g aria-hidden="true" className="pointer-events-none">
                {shapes
                  .filter((s) => selected.has(s.id))
                  .map((s, i) => (
                    <React.Fragment key={s.id}>
                      <clipPath id={`${uid}-sel-${i}`}>
                        <path d={s.d} clipRule="evenodd" />
                      </clipPath>
                      <path
                        d={s.d}
                        clipPath={`url(#${uid}-sel-${i})`}
                        className="fill-none stroke-foreground [stroke-dasharray:3_2] [stroke-linejoin:round] [stroke-width:3.2]"
                      />
                    </React.Fragment>
                  ))}
              </g>
            )}

            {/* hover / focus highlight (inner stroke) */}
            {activeShape && (
              <g aria-hidden="true" className="pointer-events-none">
                <clipPath id={`${uid}-hl`}>
                  <path d={activeShape.d} clipRule="evenodd" />
                </clipPath>
                <path
                  d={activeShape.d}
                  clipPath={`url(#${uid}-hl)`}
                  className={cn(
                    "fill-none [stroke-linejoin:round]",
                    active?.focus ? "stroke-ring [stroke-width:4.5]" : "stroke-primary/70 [stroke-width:2.5]"
                  )}
                />
              </g>
            )}
          </g>
        </svg>

        {focus && (
          <div className="absolute inset-x-0 bottom-2 flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{scene.title}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => zoomOut(undefined, false)}>
              <ArrowLeftIcon />
              Back to body
            </Button>
          </div>
        )}

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
            {heatOf(activeShape.id) !== undefined && (
              <span className="ml-1.5 text-muted-foreground tabular-nums">{heatOf(activeShape.id)}/10</span>
            )}
          </div>
        )}
      </div>

      <span id={zoomHintId} hidden>
        Press Enter to zoom in.
      </span>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            BodyMapSelectionList                            */
/* -------------------------------------------------------------------------- */

export interface BodyMapSelectionListProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Selected region ids. */
  value: string[]
  /** Called with the id of the chip whose remove button was pressed. Omit to hide remove buttons. */
  onRemove?: (id: string) => void
  /** Optional intensities shown next to each label. */
  intensity?: Record<string, number>
  /** Uses sex-specific labels ("Left breast"). */
  sex?: BodySex
  /** Text shown when nothing is selected. */
  emptyText?: React.ReactNode
}

export function BodyMapSelectionList({
  value,
  onRemove,
  intensity,
  sex,
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
          const label = getBodyRegionLabel(id, { sex })
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

