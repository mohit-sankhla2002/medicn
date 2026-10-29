import type { Metadata } from "next"
import Link from "next/link"

import { Callout, H2, P, PageHeader } from "@/components/docs/prose"
import { categoryOrder, registryItems } from "@/registry/items"

export const metadata: Metadata = { title: "Introduction" }

export default function DocsIntroduction() {
  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        title="Introduction"
        description="Medical UI components and blocks you copy into your app. Built on shadcn/ui, Radix and Tailwind CSS."
      />
      <P>
        medicn is not a component library you install from npm. It is a{" "}
        <a className="font-medium underline underline-offset-4" href="https://ui.shadcn.com/docs/registry">
          shadcn registry
        </a>
        : the CLI copies the source of each component into your project, so you own the code and can adapt it to your
        clinical workflows, compliance requirements and design system.
      </P>
      <P>
        Every component uses shadcn semantic tokens (<code>primary</code>, <code>muted</code>, <code>border</code>…), so
        it picks up your theme and dark mode automatically. Clinical status colors (normal, borderline, abnormal,
        critical) use the Tailwind palette so they stay recognisable across themes.
      </P>

      <Callout tone="warning">
        medicn is a UI toolkit. Reference ranges, pain descriptors and other clinical defaults are generic and for
        display only — validate them against your organisation&apos;s protocols before using them in patient care.
      </Callout>

      <H2>What&apos;s inside</H2>
      <div className="grid gap-6 sm:grid-cols-2">
        {categoryOrder.map((category) => {
          const items = registryItems.filter((i) => i.category === category)
          if (items.length === 0) return null
          return (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
              <ul className="flex flex-col gap-1.5">
                {items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.type === "registry:block" ? `/blocks#${item.name}` : `/docs/components/${item.name}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <H2>Principles</H2>
      <ul className="ml-5 list-disc space-y-2 leading-7 text-foreground/85">
        <li>
          <strong>Safety first.</strong> Critical states are never conveyed by color alone — they always carry a text
          label, and high-alert information (allergies, DNR, high-alert medications) is visually distinct.
        </li>
        <li>
          <strong>Accessible by default.</strong> Keyboard support, ARIA patterns and reduced-motion handling are built
          in, not bolted on.
        </li>
        <li>
          <strong>Composable.</strong> Small components (pain scale, body map, vitals) compose into blocks (intake,
          booking, patient chart) that you can install as full pages.
        </li>
        <li>
          <strong>Data-agnostic.</strong> Components take plain props. Map them to FHIR, HL7 or your own API.
        </li>
      </ul>
    </article>
  )
}
