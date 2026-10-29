import type { Metadata } from "next"
import Link from "next/link"

import { CodeBlock } from "@/components/docs/code-block"
import { InstallCommand } from "@/components/docs/install-command"
import { Callout, Code, H2, P, PageHeader } from "@/components/docs/prose"
import { Button } from "@/components/ui/button"
import { registryUrl } from "@/lib/site"
import { accentColors, clinicalCssVars, clinicalPalettes, clinicalThemeInline, clinicalTones } from "@/lib/themes"

export const metadata: Metadata = { title: "Theming" }

const toneUse: Record<(typeof clinicalTones)[number], string> = {
  normal: "Within range, completed visits, active medications, NKDA.",
  watch: "Borderline values, mild allergies, held medications, patients in the room.",
  abnormal: "Out of range, moderate allergies, the middle of the pain scale.",
  critical: "Critical values, severe allergies, high-alert drugs, no-shows, the current-time line.",
  info: "Informational results, confirmed visits, completed medications.",
}

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n")

export default function ThemingPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        title="Theming"
        description="medicn uses your shadcn/ui CSS variables, plus a small set of clinical status tokens. Change them and every component follows."
      >
        <Button asChild size="sm" className="w-fit">
          <Link href="/themes">Open the theme customizer</Link>
        </Button>
      </PageHeader>

      <H2 id="tokens">shadcn/ui tokens</H2>
      <P>
        Surfaces, text, borders, focus rings and the primary colour come from the standard shadcn/ui variables (
        <Code>--background</Code>, <Code>--primary</Code>, <Code>--border</Code>, <Code>--ring</Code>…). Corner rounding
        comes from <Code>--radius</Code> and the font from <Code>--font-sans</Code>. If you already have a shadcn/ui theme,
        medicn components match it with no extra setup.
      </P>

      <H2 id="clinical-tokens">Clinical status tokens</H2>
      <P>
        Status colours have a clinical meaning, so they get their own tokens instead of reusing <Code>--primary</Code> or{" "}
        <Code>--destructive</Code>. Each tone has a solid colour (dots, bars, fills, the pain scale) and a{" "}
        <Code>-foreground</Code> colour for text on a tinted background.
      </P>
      <div className="my-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Token</th>
              <th className="px-4 py-2 font-medium">Used for</th>
            </tr>
          </thead>
          <tbody>
            {clinicalTones.map((tone) => (
              <tr key={tone} className="border-t">
                <td className="px-4 py-2 align-top">
                  <span className="inline-flex items-center gap-2 font-mono text-xs">
                    <span className="size-3 rounded-full" style={{ background: `var(--clinical-${tone})` }} />
                    --clinical-{tone}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{toneUse[tone]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        You don&apos;t need to add these by hand. Components that use them carry the defaults, and{" "}
        <Code>shadcn add</Code> writes them into your <Code>globals.css</Code>. The defaults look like this:
      </P>
      <CodeBlock
        lang="css"
        title="globals.css"
        code={`@theme inline {
${clinicalThemeInline}
}

:root {
${declarations(clinicalCssVars.light)}
}

.dark {
${declarations(clinicalCssVars.dark)}
}`}
      />
      <Callout tone="warning">
        Never rely on colour alone to carry clinical meaning. Every medicn status also has a text label, and you should
        keep it. Check contrast if you change the <Code>-foreground</Code> values.
      </Callout>

      <H2 id="presets">Install a preset</H2>
      <P>
        Each primary colour and clinical palette is published as a <Code>registry:theme</Code> item. Installing one
        updates the matching variables in your <Code>globals.css</Code> and leaves the rest alone.
      </P>
      <InstallCommand args={`add ${registryUrl("theme-rose")}`} />
      <P className="text-sm text-muted-foreground">
        Run theme installs as their own command. Later component installs only add variables that are missing, so they
        keep your theme.
      </P>
      <P>Primary colours (sets primary, ring, sidebar primary and chart colours):</P>
      <ul className="my-4 flex flex-wrap gap-2">
        {accentColors.map((accent) => (
          <li key={accent.name}>
            <Code>@medicn/theme-{accent.name}</Code>
          </li>
        ))}
      </ul>
      <P>Clinical palettes (sets the clinical status tokens):</P>
      <ul className="my-4 flex flex-col gap-2">
        {clinicalPalettes.map((palette) => (
          <li key={palette.name} className="text-sm text-muted-foreground">
            <Code>@medicn/clinical-{palette.name}</Code> — {palette.description}
          </li>
        ))}
      </ul>

      <H2 id="custom">Build your own</H2>
      <P>
        The <Link href="/themes" className="font-medium underline underline-offset-4">theme customizer</Link> combines a
        primary colour, base colour, clinical palette, radius and font, previews them on real components, and gives you
        the full <Code>globals.css</Code> and font setup to copy.
      </P>
    </article>
  )
}
