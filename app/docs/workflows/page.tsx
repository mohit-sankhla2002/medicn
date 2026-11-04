import type { Metadata } from "next"
import Link from "next/link"

import { ComponentPreview } from "@/components/docs/component-preview"
import { H2, P, PageHeader } from "@/components/docs/prose"

export const metadata: Metadata = { title: "Patient & practice workflows" }

const patientComponents = [
  ["patient-switcher", "Patient Switcher", "Keep self and family care accounts distinct, with visible access context."],
  ["patient-task-list", "Patient Task List", "Prepare for visits, finish intake and follow through on care tasks."],
  ["patient-message-thread", "Patient Message Thread", "Communicate with a care team and retain drafts when sending fails."],
  ["billing-summary", "Billing Summary", "Understand charges, adjustments and the balance recorded by the clinic."],
] as const

const practiceComponents = [
  ["patient-worklist", "Patient Worklist", "Find visits, filter their status and supply rooming or chart actions."],
  ["appointment-waitlist", "Appointment Waitlist", "Track appointment preferences and offer newly available slots."],
  ["patient-message-thread", "Patient Message Thread", "Reply as a clinician or coordinator using the same conversation component."],
  ["billing-summary", "Billing Summary", "Present the same authoritative statement to patients and staff."],
] as const

const research = [
  { product: "Elation", href: "https://www.elationhealth.com/solutions/ehr/", pattern: "Three-panel clinical console keeps reference information close to charting.", opportunity: "Next: resizable patient context, chart and task workspace. Build on the existing patient-chart block." },
  { product: "MyChart", href: "https://www.mychart.org/l/en-us/help/proxy/", pattern: "Caregiver access makes the currently viewed account visible and provides account switching.", opportunity: "Available: patient-switcher. Next: permission detail and record-sharing consent interfaces." },
  { product: "MyChart", href: "https://www.mychart.org/l/en-us/explore/", pattern: "Patient workflows include messages, refills, check-in, bills and records shared across organizations.", opportunity: "Available: tasks, messages and billing. Next: refill requests, check-in review and document sharing." },
  { product: "Jane", href: "https://jane.app/guide/using-wait-list-notifications", pattern: "Cancelled slots open a waitlist panel with eligible requests, offers and a release period.", opportunity: "Available: appointment-waitlist. Next: preference editor and availability picker; host owns matching and reservations." },
  { product: "Healthie", href: "https://help.gethealthie.com/article/371-care-plans", pattern: "Patient-visible plans combine recommendations, goals, documents and journaling settings.", opportunity: "Available: patient-task-list alongside care-plan. Next: goal check-ins, symptom journals and education resources." },
  { product: "SimplePractice", href: "https://support.simplepractice.com/hc/en-us/articles/18314732128653-Using-scored-measures", pattern: "Recurring scored measures have a patient completion flow and a clinician history view.", opportunity: "Next: outcome history and measure assignment controls, extending questionnaire rather than duplicating scoring." },
  { product: "Cliniko", href: "https://help.cliniko.com/en/articles/2351214-understanding-the-body-chart-editor", pattern: "Body charts support drawing, text, panning, colours and undo/redo.", opportunity: "Next: reusable annotation layer and visit comparison over body-map and lesion-map." },
  { product: "Bahmni", href: "https://www.bahmni.org/inpatient-management", pattern: "Wards reflect physical bed layouts and support admission, discharge and transfer.", opportunity: "Next: bed board, transfer dialog and nursing handover. Extend the existing emergency tracking block." },
  { product: "OpenELIS", href: "https://openelis-global.org/features-and-functionality/", pattern: "Laboratory work tracks specimens, validates results and reports workflow status.", opportunity: "Next: specimen tracker, collection worklist and results validation panel alongside lab-results." },
  { product: "OHIF", href: "https://docs.ohif.org/user-guide/viewer/measurement-panel/", pattern: "A measurement panel links annotations to images and exports tracked findings.", opportunity: "Next: imaging worklist, study metadata and viewer integration slots. Delegate image rendering to an imaging engine." },
  { product: "Tidepool", href: "https://support.tidepool.org/hc/en-us/articles/360029760391-Viewing-Diabetes-Data-Trends-CGM", pattern: "Interactive trends filter date windows, days and percentile bands, then drill into a day.", opportunity: "Next: glucose profile and remote-monitoring review panels with device provenance and data completeness." },
  { product: "Simple", href: "https://www.simple.org/simple-app/", pattern: "Fast mobile entry, overdue follow-up lists and offline sync support low-connectivity clinics.", opportunity: "Next: overdue outreach worklist and sync-status/conflict feedback. Persistence remains an application concern." },
  { product: "Abridge", href: "https://www.abridge.com/blog/a-year-of-abridge-in-summary", pattern: "Generated note passages link to transcript evidence and source audio.", opportunity: "Next: source-linked draft review with accept/edit controls, building on clinical-note." },
  { product: "Eka Care", href: "https://abdm-docs.dev.eka.care/docs/hiecm/v3", pattern: "Patient identity, care-context linking and consent mediate health-record exchange.", opportunity: "Next: optional ABHA identity and record-sharing consent components for India-focused applications." },
  { product: "Healthie / Claim.MD", href: "https://help.gethealthie.com/article/1240-healthie-and-claimmd-integration", pattern: "Eligibility, claim status and reimbursement responses remain connected to the billing service.", opportunity: "Available: billing-summary. Next: coverage summary, authorization tracker and claim worklist." },
  { product: "Linear", href: "https://linear.app/docs/custom-views", pattern: "Filterable worklists can become saved, shared views, with fast contextual previews.", opportunity: "Available: controlled filters in patient-worklist. Next: saved-view controls and a reusable contextual detail panel." },
  { product: "NHS design system", href: "https://service-manual.nhs.uk/design-system/components/task-list", pattern: "Task lists distinguish completed, incomplete and unavailable steps in longer services.", opportunity: "Available: patient-task-list and workflow-state. Next: check-answer summaries and linked form-error summaries." },
]

export default function WorkflowsPage() {
  return <article className="mx-auto max-w-4xl">
    <PageHeader title="Patient & practice workflows" description="Reusable interfaces for people receiving care and the teams coordinating it. Install individual components and connect them to your own application." />
    <div className="grid gap-6 md:grid-cols-2">
      {[{ title: "For patients and families", items: patientComponents }, { title: "For doctors and practice teams", items: practiceComponents }].map((group) => <section key={group.title} className="rounded-xl border p-5"><h2 className="mb-4 font-semibold">{group.title}</h2><ul className="space-y-4">{group.items.map(([name, title, description]) => <li key={name}><Link href={`/docs/components/${name}`} className="text-sm font-medium underline underline-offset-4">{title}</Link><p className="mt-1 text-sm text-muted-foreground">{description}</p></li>)}</ul></section>)}
    </div>
    <H2>Prepare for a visit</H2>
    <P>A task action opens its underlying workflow. Progress changes after that workflow is completed; opening a task alone does not complete it.</P>
    <ComponentPreview name="patient-task-list-demo" />
    <H2>Coordinate the clinic day</H2>
    <P>The worklist provides filtering and selection. Your application supplies authoritative encounter data and implements room assignment or chart navigation.</P>
    <ComponentPreview name="patient-worklist-demo" />
    <H2>Integration principles</H2>
    <ul className="ml-5 list-disc space-y-2 text-sm leading-7">
      <li>Data stays in your application. Components expose typed props, callbacks and action slots; they do not fetch records or connect to a vendor service.</li>
      <li>Use loading and error states during fetches, especially when switching patient context. Supply only records and actions the current user is authorized to access.</li>
      <li>Persist task, appointment, message and financial changes before publishing successful state back to the component. Validate booking expiry and availability on the server.</li>
      <li>Supply explicit date and time-zone strings. Override interface labels for localization and use currency-aware integer minor units for statements.</li>
      <li>Use the components independently or combine them with the existing charting, medication, scheduling and assessment components.</li>
    </ul>
    <H2>Product research & further opportunities</H2>
    <P>This comparison uses public product documentation, guides and example screens, reviewed November 4, 2026. It records interface patterns and proposed medicn adaptations. Proposed components below are opportunities, not implemented capabilities or evidence of measured customer demand.</P>
    <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[640px] text-left text-sm"><caption className="sr-only">Product interface patterns and medicn opportunities</caption><thead className="bg-muted/40"><tr><th scope="col" className="p-3">Reference</th><th scope="col" className="p-3">Observed pattern</th><th scope="col" className="p-3">medicn opportunity</th></tr></thead><tbody className="divide-y">{research.map((row, index) => <tr key={index} className="align-top"><th scope="row" className="p-3 font-medium"><a href={row.href} target="_blank" rel="noreferrer" className="underline underline-offset-4">{row.product}</a></th><td className="p-3 leading-6 text-muted-foreground">{row.pattern}</td><td className="p-3 leading-6">{row.opportunity}</td></tr>)}</tbody></table></div>
    <H2>Recommended next additions</H2>
    <P>Prioritize medication reconciliation, a clinical inbox, document handling, coverage and authorization status, outcome history, and overdue outreach. These connect existing components across visits. Specialty extensions such as imaging, bed management and glucose profiles can follow as focused collections.</P>
  </article>
}
