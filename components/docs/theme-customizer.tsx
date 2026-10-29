"use client"

import * as React from "react"
import { Check, Moon, Palette, RotateCcw, Sun, SunMoon } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import {
  accentColors,
  baseColors,
  clinicalPalettes,
  clinicalTones,
  defaultThemeConfig,
  fonts,
  getFontSnippet,
  getThemeCss,
  getThemeStyle,
  radii,
  type ThemeConfig,
} from "@/lib/themes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyButton } from "@/components/docs/copy-button"

const STORAGE_KEY = "medicn-theme"

interface ThemeCustomizerContextValue {
  config: ThemeConfig
  setConfig: (update: Partial<ThemeConfig>) => void
  reset: () => void
  isDefault: boolean
}

const ThemeCustomizerContext = React.createContext<ThemeCustomizerContextValue | null>(null)

export function useThemeCustomizer() {
  const context = React.useContext(ThemeCustomizerContext)
  if (!context) throw new Error("useThemeCustomizer must be used within ThemeCustomizerProvider")
  return context
}

function isSameConfig(a: ThemeConfig, b: ThemeConfig) {
  return (Object.keys(a) as (keyof ThemeConfig)[]).every((key) => a[key] === b[key])
}

/**
 * Holds the docs site's customised theme, persists it to localStorage and
 * applies it to the whole document (including block iframes, which read the
 * same storage key).
 */
export function ThemeCustomizerProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = React.useState<ThemeConfig>(defaultThemeConfig)

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (stored) setConfigState({ ...defaultThemeConfig, ...JSON.parse(stored) })
    } catch {
      // Ignore unavailable or malformed storage.
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      try {
        setConfigState(event.newValue ? { ...defaultThemeConfig, ...JSON.parse(event.newValue) } : defaultThemeConfig)
      } catch {
        setConfigState(defaultThemeConfig)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const setConfig = React.useCallback((update: Partial<ThemeConfig>) => {
    setConfigState((previous) => {
      const next = { ...previous, ...update }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage is optional.
      }
      return next
    })
  }, [])

  const reset = React.useCallback(() => {
    setConfigState(defaultThemeConfig)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage is optional.
    }
  }, [])

  const isDefault = isSameConfig(config, defaultThemeConfig)
  const value = React.useMemo(() => ({ config, setConfig, reset, isDefault }), [config, setConfig, reset, isDefault])

  return (
    <ThemeCustomizerContext.Provider value={value}>
      {!isDefault && <style data-medicn-theme>{getThemeStyle(config)}</style>}
      {children}
    </ThemeCustomizerContext.Provider>
  )
}

function OptionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-muted-foreground">{children}</div>
}

function OptionButton({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors outline-none",
        "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "border-primary ring-1 ring-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function Swatch({ color }: { color: string }) {
  return <span aria-hidden className="size-3.5 shrink-0 rounded-full border border-black/10" style={{ background: color }} />
}

export function ThemeCustomizerControls({ className }: { className?: string }) {
  const { config, setConfig, reset, isDefault } = useThemeCustomizer()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- next-themes resolves the mode on the client only
  React.useEffect(() => setMounted(true), [])

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-2">
        <OptionLabel>Primary colour</OptionLabel>
        <div className="grid grid-cols-3 gap-2">
          {accentColors.map((accent) => (
            <OptionButton
              key={accent.name}
              active={config.accent === accent.name}
              onClick={() => setConfig({ accent: accent.name })}
            >
              <Swatch
                color={
                  accent.light?.primary ??
                  baseColors.find((base) => base.name === config.base)?.scale[900] ??
                  "oklch(0.2 0 0)"
                }
              />
              {accent.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <OptionLabel>Base colour</OptionLabel>
        <div className="grid grid-cols-3 gap-2">
          {baseColors.map((base) => (
            <OptionButton key={base.name} active={config.base === base.name} onClick={() => setConfig({ base: base.name })}>
              <Swatch color={base.swatch} />
              {base.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <OptionLabel>Clinical status colours</OptionLabel>
        <div className="flex flex-col gap-2">
          {clinicalPalettes.map((palette) => (
            <OptionButton
              key={palette.name}
              active={config.clinical === palette.name}
              onClick={() => setConfig({ clinical: palette.name })}
              className="h-auto justify-between py-2"
              title={palette.description}
            >
              {palette.label}
              <span className="flex gap-1">
                {clinicalTones.map((tone) => (
                  <Swatch key={tone} color={palette.light[tone].solid} />
                ))}
              </span>
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <OptionLabel>Radius</OptionLabel>
        <div className="grid grid-cols-6 gap-2">
          {radii.map((radius) => (
            <OptionButton
              key={radius}
              active={config.radius === radius}
              onClick={() => setConfig({ radius })}
              className="justify-center px-0"
            >
              {radius}
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <OptionLabel>Font</OptionLabel>
        <Select value={config.font} onValueChange={(font) => setConfig({ font })}>
          <SelectTrigger className="w-full" aria-label="Font">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font.name} value={font.name} style={{ fontFamily: `var(${font.variable})` }}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <OptionLabel>Mode</OptionLabel>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: SunMoon },
          ].map(({ value, label, icon: Icon }) => (
            <OptionButton key={value} active={mounted && theme === value} onClick={() => setTheme(value)}>
              <Icon className="size-3.5" />
              {label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <ThemeCodeDialog />
        <Button variant="outline" size="sm" onClick={reset} disabled={isDefault}>
          <RotateCcw />
          Reset
        </Button>
      </div>
    </div>
  )
}

function CodePanel({ code }: { code: string }) {
  return (
    <div className="relative rounded-lg border bg-muted/40">
      <CopyButton value={code} className="absolute top-2 right-2 z-10" />
      <ScrollArea className="h-80">
        <pre className="p-4 font-mono text-xs leading-relaxed">
          <code>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

export function ThemeCodeDialog() {
  const { config } = useThemeCustomizer()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1">
          <Check />
          Copy code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Theme</DialogTitle>
          <DialogDescription>
            Replace the <code className="font-mono">:root</code> and <code className="font-mono">.dark</code> blocks in
            your <code className="font-mono">globals.css</code>, and add the <code className="font-mono">@theme inline</code>{" "}
            lines if they are not already there.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="css">
          <TabsList>
            <TabsTrigger value="css">globals.css</TabsTrigger>
            <TabsTrigger value="font">layout.tsx</TabsTrigger>
          </TabsList>
          <TabsContent value="css">
            <CodePanel code={getThemeCss(config)} />
          </TabsContent>
          <TabsContent value="font">
            <CodePanel code={getFontSnippet(config)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

/** Header button: opens the customizer in a popover from any page. */
export function ThemeCustomizerPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Customize theme">
          <Palette />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <ThemeCustomizerControls />
      </PopoverContent>
    </Popover>
  )
}
