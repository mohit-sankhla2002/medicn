import type { Metadata } from "next"

import { Callout, H2, PageHeader } from "@/components/docs/prose"

export const metadata: Metadata = { title: "Accessibility & safety" }

const rows = [
  ["Body Map", "Regions are toggle buttons with anatomical labels; Enter/Space toggles; front/back view switch is a toggle group."],
  ["Pain Scale", "WAI-ARIA radio group with roving tabindex; arrows, Home and End; descriptor announced via aria-live."],
  ["Appointment Calendar", "Appointments and empty slots are buttons with full date, time, patient and status in their accessible name."],
  ["Vitals Form", "Inputs are labelled with units; errors are linked via aria-describedby and announced with role=alert."],
  ["Patient Header", "Allergy details are available on focus as well as hover; severe allergies add an icon, not just color."],
  ["Clinical Status Badge", "Every status has a text label; the critical pulse is disabled with prefers-reduced-motion."],
]

export default function AccessibilityPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        title="Accessibility & safety"
        description="Clinical software is used under pressure, by everyone. These are the guarantees medicn components make."
      />
      <H2>Per component</H2>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y">
            {rows.map(([name, text]) => (
              <tr key={name} className="align-top">
                <th scope="row" className="w-48 bg-muted/40 px-4 py-3 font-medium">
                  {name}
                </th>
                <td className="px-4 py-3 text-foreground/85">{text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <H2>Clinical safety</H2>
      <Callout tone="warning">
        Defaults such as vital-sign reference ranges are generic adult screening values. They are not clinical decision
        support. Override statuses with your institution&apos;s protocols, and have clinical stakeholders review any
        workflow before go-live.
      </Callout>
      <ul className="ml-5 list-disc space-y-2 leading-7 text-foreground/85">
        <li>Never rely on color alone to convey a critical state.</li>
        <li>Display units next to every value and normalize stored values (medicn forms emit metric units).</li>
        <li>Use anatomical left/right consistently — the body map uses the patient&apos;s perspective.</li>
        <li>Keep timestamps explicit: components accept pre-formatted strings so you control time zones.</li>
      </ul>
    </article>
  )
}
