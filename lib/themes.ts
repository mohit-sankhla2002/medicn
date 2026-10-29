/**
 * Theme presets for medicn. Shared by the docs theme customizer (`/themes`)
 * and by scripts/build-registry.mts, which publishes each accent colour as an
 * installable `registry:theme` item.
 *
 * Everything is expressed as shadcn/ui CSS variables, plus the `--clinical-*`
 * tokens medicn components use for status colours.
 */

export type CssVars = Record<string, string>

export interface ThemeModeVars {
  light: CssVars
  dark: CssVars
}

// ---------------------------------------------------------------------------
// Base (neutral) colours
// ---------------------------------------------------------------------------

/** Neutral scale steps used to derive the surface tokens. */
interface NeutralScale {
  50: string
  100: string
  200: string
  400: string
  500: string
  800: string
  900: string
  950: string
}

export interface BaseColor {
  name: string
  label: string
  /** Swatch shown in the customizer. */
  swatch: string
  scale: NeutralScale
}

export const baseColors: BaseColor[] = [
  {
    name: "neutral",
    label: "Neutral",
    swatch: "oklch(0.556 0 0)",
    scale: {
      50: "oklch(0.985 0 0)",
      100: "oklch(0.97 0 0)",
      200: "oklch(0.922 0 0)",
      400: "oklch(0.708 0 0)",
      500: "oklch(0.556 0 0)",
      800: "oklch(0.269 0 0)",
      900: "oklch(0.205 0 0)",
      950: "oklch(0.145 0 0)",
    },
  },
  {
    name: "zinc",
    label: "Zinc",
    swatch: "oklch(0.552 0.016 285.938)",
    scale: {
      50: "oklch(0.985 0 0)",
      100: "oklch(0.967 0.001 286.375)",
      200: "oklch(0.92 0.004 286.32)",
      400: "oklch(0.705 0.015 286.067)",
      500: "oklch(0.552 0.016 285.938)",
      800: "oklch(0.274 0.006 286.033)",
      900: "oklch(0.21 0.006 285.885)",
      950: "oklch(0.141 0.005 285.823)",
    },
  },
  {
    name: "slate",
    label: "Slate",
    swatch: "oklch(0.554 0.046 257.417)",
    scale: {
      50: "oklch(0.984 0.003 247.858)",
      100: "oklch(0.968 0.007 247.896)",
      200: "oklch(0.929 0.013 255.508)",
      400: "oklch(0.704 0.04 256.788)",
      500: "oklch(0.554 0.046 257.417)",
      800: "oklch(0.279 0.041 260.031)",
      900: "oklch(0.208 0.042 265.755)",
      950: "oklch(0.129 0.042 264.695)",
    },
  },
  {
    name: "gray",
    label: "Gray",
    swatch: "oklch(0.551 0.027 264.364)",
    scale: {
      50: "oklch(0.985 0.002 247.839)",
      100: "oklch(0.967 0.003 264.542)",
      200: "oklch(0.928 0.006 264.531)",
      400: "oklch(0.707 0.022 261.325)",
      500: "oklch(0.551 0.027 264.364)",
      800: "oklch(0.278 0.033 256.848)",
      900: "oklch(0.21 0.034 264.665)",
      950: "oklch(0.13 0.028 261.692)",
    },
  },
  {
    name: "stone",
    label: "Stone",
    swatch: "oklch(0.553 0.013 58.071)",
    scale: {
      50: "oklch(0.985 0.001 106.423)",
      100: "oklch(0.97 0.001 106.424)",
      200: "oklch(0.923 0.003 48.717)",
      400: "oklch(0.709 0.01 56.259)",
      500: "oklch(0.553 0.013 58.071)",
      800: "oklch(0.268 0.007 34.298)",
      900: "oklch(0.216 0.006 56.043)",
      950: "oklch(0.147 0.004 49.25)",
    },
  },
]

function baseVars({ scale: s }: BaseColor): ThemeModeVars {
  return {
    light: {
      background: "oklch(1 0 0)",
      foreground: s[950],
      card: "oklch(1 0 0)",
      "card-foreground": s[950],
      popover: "oklch(1 0 0)",
      "popover-foreground": s[950],
      secondary: s[100],
      "secondary-foreground": s[900],
      muted: s[100],
      "muted-foreground": s[500],
      accent: s[100],
      "accent-foreground": s[900],
      destructive: "oklch(0.577 0.245 27.325)",
      border: s[200],
      input: s[200],
      sidebar: s[50],
      "sidebar-foreground": s[950],
      "sidebar-accent": s[100],
      "sidebar-accent-foreground": s[900],
      "sidebar-border": s[200],
    },
    dark: {
      background: s[950],
      foreground: s[50],
      card: s[900],
      "card-foreground": s[50],
      popover: s[900],
      "popover-foreground": s[50],
      secondary: s[800],
      "secondary-foreground": s[50],
      muted: s[800],
      "muted-foreground": s[400],
      accent: s[800],
      "accent-foreground": s[50],
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      sidebar: s[900],
      "sidebar-foreground": s[50],
      "sidebar-accent": s[800],
      "sidebar-accent-foreground": s[50],
      "sidebar-border": "oklch(1 0 0 / 10%)",
    },
  }
}

// ---------------------------------------------------------------------------
// Accent (primary) colours
// ---------------------------------------------------------------------------

export interface AccentColor {
  name: string
  label: string
  /** `null` uses the base colour's own neutral primary. */
  light: { primary: string; foreground: string; ring: string } | null
  dark: { primary: string; foreground: string; ring: string } | null
  /** Five chart colours, light and dark. */
  charts: { light: string[]; dark: string[] }
}

export const accentColors: AccentColor[] = [
  {
    name: "teal",
    label: "Teal",
    light: { primary: "oklch(0.52 0.1 192)", foreground: "oklch(0.985 0 0)", ring: "oklch(0.62 0.09 192)" },
    dark: { primary: "oklch(0.74 0.12 188)", foreground: "oklch(0.2 0.03 200)", ring: "oklch(0.56 0.09 190)" },
    charts: {
      light: ["oklch(0.85 0.13 181)", "oklch(0.7 0.12 183)", "oklch(0.6 0.1 185)", "oklch(0.51 0.09 186)", "oklch(0.44 0.07 188)"],
      dark: ["oklch(0.85 0.13 181)", "oklch(0.7 0.12 183)", "oklch(0.6 0.1 185)", "oklch(0.51 0.09 186)", "oklch(0.44 0.07 188)"],
    },
  },
  {
    name: "blue",
    label: "Blue",
    light: { primary: "oklch(0.488 0.243 264.376)", foreground: "oklch(0.97 0.014 254.604)", ring: "oklch(0.708 0.165 254.624)" },
    dark: { primary: "oklch(0.623 0.214 259.815)", foreground: "oklch(0.97 0.014 254.604)", ring: "oklch(0.488 0.243 264.376)" },
    charts: {
      light: ["oklch(0.809 0.105 251.813)", "oklch(0.623 0.214 259.815)", "oklch(0.546 0.245 262.881)", "oklch(0.488 0.243 264.376)", "oklch(0.424 0.199 265.638)"],
      dark: ["oklch(0.809 0.105 251.813)", "oklch(0.623 0.214 259.815)", "oklch(0.546 0.245 262.881)", "oklch(0.488 0.243 264.376)", "oklch(0.424 0.199 265.638)"],
    },
  },
  {
    name: "violet",
    label: "Violet",
    light: { primary: "oklch(0.541 0.281 293.009)", foreground: "oklch(0.969 0.016 293.756)", ring: "oklch(0.702 0.183 293.541)" },
    dark: { primary: "oklch(0.606 0.25 292.717)", foreground: "oklch(0.969 0.016 293.756)", ring: "oklch(0.541 0.281 293.009)" },
    charts: {
      light: ["oklch(0.811 0.111 293.571)", "oklch(0.606 0.25 292.717)", "oklch(0.541 0.281 293.009)", "oklch(0.491 0.27 292.581)", "oklch(0.432 0.232 292.759)"],
      dark: ["oklch(0.811 0.111 293.571)", "oklch(0.606 0.25 292.717)", "oklch(0.541 0.281 293.009)", "oklch(0.491 0.27 292.581)", "oklch(0.432 0.232 292.759)"],
    },
  },
  {
    name: "rose",
    label: "Rose",
    light: { primary: "oklch(0.586 0.253 17.585)", foreground: "oklch(0.969 0.015 12.422)", ring: "oklch(0.712 0.194 13.428)" },
    dark: { primary: "oklch(0.645 0.246 16.439)", foreground: "oklch(0.969 0.015 12.422)", ring: "oklch(0.586 0.253 17.585)" },
    charts: {
      light: ["oklch(0.81 0.117 11.638)", "oklch(0.645 0.246 16.439)", "oklch(0.586 0.253 17.585)", "oklch(0.514 0.222 16.935)", "oklch(0.455 0.188 13.697)"],
      dark: ["oklch(0.81 0.117 11.638)", "oklch(0.645 0.246 16.439)", "oklch(0.586 0.253 17.585)", "oklch(0.514 0.222 16.935)", "oklch(0.455 0.188 13.697)"],
    },
  },
  {
    name: "orange",
    label: "Orange",
    light: { primary: "oklch(0.646 0.222 41.116)", foreground: "oklch(0.98 0.016 73.684)", ring: "oklch(0.75 0.183 55.934)" },
    dark: { primary: "oklch(0.705 0.213 47.604)", foreground: "oklch(0.98 0.016 73.684)", ring: "oklch(0.646 0.222 41.116)" },
    charts: {
      light: ["oklch(0.837 0.128 66.29)", "oklch(0.705 0.213 47.604)", "oklch(0.646 0.222 41.116)", "oklch(0.553 0.195 38.402)", "oklch(0.47 0.157 37.304)"],
      dark: ["oklch(0.837 0.128 66.29)", "oklch(0.705 0.213 47.604)", "oklch(0.646 0.222 41.116)", "oklch(0.553 0.195 38.402)", "oklch(0.47 0.157 37.304)"],
    },
  },
  {
    name: "green",
    label: "Green",
    light: { primary: "oklch(0.527 0.154 150.069)", foreground: "oklch(0.982 0.018 155.826)", ring: "oklch(0.723 0.219 149.579)" },
    dark: { primary: "oklch(0.696 0.17 162.48)", foreground: "oklch(0.262 0.051 172.552)", ring: "oklch(0.527 0.154 150.069)" },
    charts: {
      light: ["oklch(0.871 0.15 154.449)", "oklch(0.723 0.219 149.579)", "oklch(0.627 0.194 149.214)", "oklch(0.527 0.154 150.069)", "oklch(0.448 0.119 151.328)"],
      dark: ["oklch(0.871 0.15 154.449)", "oklch(0.723 0.219 149.579)", "oklch(0.627 0.194 149.214)", "oklch(0.527 0.154 150.069)", "oklch(0.448 0.119 151.328)"],
    },
  },
  {
    name: "base",
    label: "Mono",
    light: null,
    dark: null,
    charts: {
      light: ["oklch(0.87 0 0)", "oklch(0.556 0 0)", "oklch(0.439 0 0)", "oklch(0.371 0 0)", "oklch(0.269 0 0)"],
      dark: ["oklch(0.87 0 0)", "oklch(0.556 0 0)", "oklch(0.439 0 0)", "oklch(0.371 0 0)", "oklch(0.269 0 0)"],
    },
  },
]

function accentVars(accent: AccentColor, base: BaseColor): ThemeModeVars {
  const s = base.scale
  const light = accent.light ?? { primary: s[900], foreground: s[50], ring: s[400] }
  const dark = accent.dark ?? { primary: s[200], foreground: s[900], ring: s[500] }
  const charts = (values: string[]) => Object.fromEntries(values.map((value, i) => [`chart-${i + 1}`, value]))
  return {
    light: {
      primary: light.primary,
      "primary-foreground": light.foreground,
      ring: light.ring,
      "sidebar-primary": light.primary,
      "sidebar-primary-foreground": light.foreground,
      "sidebar-ring": light.ring,
      ...charts(accent.charts.light),
    },
    dark: {
      primary: dark.primary,
      "primary-foreground": dark.foreground,
      ring: dark.ring,
      "sidebar-primary": dark.primary,
      "sidebar-primary-foreground": dark.foreground,
      "sidebar-ring": dark.ring,
      ...charts(accent.charts.dark),
    },
  }
}

// ---------------------------------------------------------------------------
// Clinical status colours
// ---------------------------------------------------------------------------

export const clinicalTones = ["normal", "watch", "abnormal", "critical", "info"] as const
export type ClinicalTone = (typeof clinicalTones)[number]

export interface ClinicalPalette {
  name: string
  label: string
  description: string
  /** `solid` is used for dots, bars and fills; `text` for text on a tinted background. */
  light: Record<ClinicalTone, { solid: string; text: string }>
  dark: Record<ClinicalTone, { solid: string; text: string }>
}

export const clinicalPalettes: ClinicalPalette[] = [
  {
    name: "standard",
    label: "Standard",
    description: "Green, amber, orange and red, as used in most early-warning charts.",
    light: {
      normal: { solid: "oklch(0.63 0.15 158)", text: "oklch(0.45 0.1 162)" },
      watch: { solid: "oklch(0.77 0.16 75)", text: "oklch(0.48 0.11 60)" },
      abnormal: { solid: "oklch(0.68 0.19 45)", text: "oklch(0.52 0.16 40)" },
      critical: { solid: "oklch(0.6 0.22 27)", text: "oklch(0.5 0.19 27)" },
      info: { solid: "oklch(0.64 0.13 235)", text: "oklch(0.48 0.12 240)" },
    },
    dark: {
      normal: { solid: "oklch(0.7 0.15 162)", text: "oklch(0.85 0.12 163)" },
      watch: { solid: "oklch(0.8 0.16 80)", text: "oklch(0.88 0.13 85)" },
      abnormal: { solid: "oklch(0.72 0.18 50)", text: "oklch(0.84 0.11 55)" },
      critical: { solid: "oklch(0.66 0.21 25)", text: "oklch(0.81 0.11 20)" },
      info: { solid: "oklch(0.72 0.13 230)", text: "oklch(0.84 0.08 225)" },
    },
  },
  {
    name: "colorblind",
    label: "Colour-blind safe",
    description: "Blue, yellow, orange and magenta. Distinct under red–green colour blindness.",
    light: {
      normal: { solid: "oklch(0.58 0.14 250)", text: "oklch(0.45 0.13 255)" },
      watch: { solid: "oklch(0.84 0.15 95)", text: "oklch(0.47 0.09 85)" },
      abnormal: { solid: "oklch(0.7 0.17 55)", text: "oklch(0.52 0.14 50)" },
      critical: { solid: "oklch(0.55 0.21 350)", text: "oklch(0.47 0.19 350)" },
      info: { solid: "oklch(0.68 0.1 200)", text: "oklch(0.47 0.08 205)" },
    },
    dark: {
      normal: { solid: "oklch(0.7 0.13 250)", text: "oklch(0.84 0.08 250)" },
      watch: { solid: "oklch(0.87 0.15 95)", text: "oklch(0.91 0.12 95)" },
      abnormal: { solid: "oklch(0.75 0.16 55)", text: "oklch(0.85 0.1 60)" },
      critical: { solid: "oklch(0.67 0.2 350)", text: "oklch(0.82 0.11 350)" },
      info: { solid: "oklch(0.76 0.1 200)", text: "oklch(0.86 0.06 200)" },
    },
  },
  {
    name: "muted",
    label: "Muted",
    description: "Lower-chroma tones for calm, low-stimulus interfaces.",
    light: {
      normal: { solid: "oklch(0.62 0.08 158)", text: "oklch(0.45 0.06 160)" },
      watch: { solid: "oklch(0.74 0.1 80)", text: "oklch(0.48 0.07 70)" },
      abnormal: { solid: "oklch(0.66 0.11 50)", text: "oklch(0.5 0.09 45)" },
      critical: { solid: "oklch(0.58 0.15 25)", text: "oklch(0.48 0.13 25)" },
      info: { solid: "oklch(0.62 0.07 235)", text: "oklch(0.47 0.06 240)" },
    },
    dark: {
      normal: { solid: "oklch(0.68 0.08 160)", text: "oklch(0.84 0.06 160)" },
      watch: { solid: "oklch(0.78 0.1 80)", text: "oklch(0.87 0.07 85)" },
      abnormal: { solid: "oklch(0.7 0.11 50)", text: "oklch(0.83 0.07 55)" },
      critical: { solid: "oklch(0.64 0.15 25)", text: "oklch(0.8 0.08 20)" },
      info: { solid: "oklch(0.7 0.07 230)", text: "oklch(0.84 0.05 225)" },
    },
  },
]

function clinicalVars(palette: ClinicalPalette): ThemeModeVars {
  const toVars = (tones: ClinicalPalette["light"]) =>
    Object.fromEntries(
      clinicalTones.flatMap((tone) => [
        [`clinical-${tone}`, tones[tone].solid],
        [`clinical-${tone}-foreground`, tones[tone].text],
      ])
    )
  return { light: toVars(palette.light), dark: toVars(palette.dark) }
}

/** The default clinical tokens. Shipped with every component that uses them. */
export const clinicalCssVars = clinicalVars(clinicalPalettes[0])

// ---------------------------------------------------------------------------
// Radius and fonts
// ---------------------------------------------------------------------------

export const radii = ["0", "0.3", "0.5", "0.625", "0.75", "1"] as const
export type Radius = (typeof radii)[number]

export interface FontOption {
  name: string
  label: string
  /** CSS variable set by next/font on <html> in the docs site. */
  variable: string
  /** next/font/google export name, for the copyable snippet. */
  importName: string
}

export const fonts: FontOption[] = [
  { name: "geist", label: "Geist", variable: "--font-geist", importName: "Geist" },
  { name: "inter", label: "Inter", variable: "--font-inter", importName: "Inter" },
  { name: "figtree", label: "Figtree", variable: "--font-figtree", importName: "Figtree" },
  { name: "ibm-plex-sans", label: "IBM Plex Sans", variable: "--font-ibm-plex-sans", importName: "IBM_Plex_Sans" },
  { name: "nunito-sans", label: "Nunito Sans", variable: "--font-nunito-sans", importName: "Nunito_Sans" },
  { name: "source-sans-3", label: "Source Sans 3", variable: "--font-source-sans-3", importName: "Source_Sans_3" },
]

// ---------------------------------------------------------------------------
// Theme config → CSS
// ---------------------------------------------------------------------------

export interface ThemeConfig {
  base: string
  accent: string
  clinical: string
  radius: Radius
  font: string
}

export const defaultThemeConfig: ThemeConfig = {
  base: "neutral",
  accent: "teal",
  clinical: "standard",
  radius: "0.625",
  font: "geist",
}

const byName = <T extends { name: string }>(list: T[], name: string) => list.find((item) => item.name === name) ?? list[0]

export function getThemeVars(config: ThemeConfig): ThemeModeVars & { theme: CssVars } {
  const base = byName(baseColors, config.base)
  const surfaces = baseVars(base)
  const accent = accentVars(byName(accentColors, config.accent), base)
  const clinical = clinicalVars(byName(clinicalPalettes, config.clinical))
  return {
    theme: { radius: `${config.radius}rem` },
    light: { ...surfaces.light, ...accent.light, ...clinical.light },
    dark: { ...surfaces.dark, ...accent.dark, ...clinical.dark },
  }
}

const declarations = (vars: CssVars, indent = "  ") =>
  Object.entries(vars)
    .map(([key, value]) => `${indent}--${key}: ${value};`)
    .join("\n")

/** `--color-clinical-*` mappings so Tailwind generates `bg-clinical-watch` etc. */
export const clinicalThemeInline = clinicalTones
  .flatMap((tone) => [
    `  --color-clinical-${tone}: var(--clinical-${tone});`,
    `  --color-clinical-${tone}-foreground: var(--clinical-${tone}-foreground);`,
  ])
  .join("\n")

/** CSS to paste into globals.css. */
export function getThemeCss(config: ThemeConfig) {
  const vars = getThemeVars(config)
  return `:root {
  --radius: ${vars.theme.radius};
${declarations(vars.light)}
}

.dark {
${declarations(vars.dark)}
}

@theme inline {
${clinicalThemeInline}
}
`
}

/** CSS applied by the live customizer. Scoped to `selector` so it can override `:root`. */
export function getThemeStyle(config: ThemeConfig, selector = ":root") {
  const vars = getThemeVars(config)
  const font = byName(fonts, config.font)
  return `${selector} {
  --radius: ${vars.theme.radius};
  --font-sans: var(${font.variable});
${declarations(vars.light)}
}
.dark${selector === ":root" ? "" : ` ${selector}`} {
${declarations(vars.dark)}
}`
}

export function getFontSnippet(config: ThemeConfig) {
  const font = byName(fonts, config.font)
  return `import { ${font.importName} } from "next/font/google"

const fontSans = ${font.importName}({
  subsets: ["latin"],
  variable: "--font-sans",
})

// <html className={fontSans.variable}>`
}
