/**
 * Single source of truth for the medicn registry.
 * - `scripts/build-registry.mts` turns this into `registry.json` for `shadcn build`.
 * - The docs site renders component pages from it.
 *
 * `registryDependencies` entries prefixed with `medicn:` point at other items in this
 * registry and are expanded to absolute URLs at build time.
 */

export type RegistryCategory = "Scheduling" | "Anatomy" | "Forms" | "Clinical data" | "Patient" | "Blocks"

export interface PropDoc {
  name: string
  type: string
  default?: string
  description: string
}

export interface RegistryFile {
  path: string
  type: "registry:component" | "registry:block" | "registry:page" | "registry:lib"
  target?: string
}

export interface RegistryEntry {
  name: string
  title: string
  description: string
  type: "registry:component" | "registry:block"
  category: RegistryCategory
  files: RegistryFile[]
  dependencies?: string[]
  registryDependencies?: string[]
  /** Demo file names in components/demos (without extension). The first is the hero preview. */
  demos?: { name: string; title?: string; description?: string }[]
  api?: { component: string; description?: string; props: PropDoc[] }[]
  usage?: string
  notes?: string[]
  /** Standards and real products that use the same pattern. Shown on the docs page. */
  references?: { label: string; href: string; description?: string }[]
}

const component = (name: string): RegistryFile => ({
  path: `components/medicn/${name}.tsx`,
  type: "registry:component",
})

export const registryItems: RegistryEntry[] = [
  // ───────────────────────────── Scheduling ─────────────────────────────
  {
    name: "appointment-calendar",
    title: "Appointment Calendar",
    description:
      "Clinic scheduling calendar with day, week and month views, provider columns, overlap layout and status colors.",
    type: "registry:component",
    category: "Scheduling",
    references: [
      { label: "FHIR R4 Appointment", href: "https://hl7.org/fhir/R4/appointment.html", description: "Status values map onto `Appointment.status` (booked, arrived, fulfilled, cancelled, noshow)." },
      { label: "FHIR R4 Schedule", href: "https://hl7.org/fhir/R4/schedule.html", description: "Provider columns correspond to a practitioner's `Schedule`." },
    ],
    files: [component("appointment-calendar")],
    dependencies: ["date-fns", "lucide-react"],
    registryDependencies: ["button", "toggle-group"],
    demos: [
      { name: "appointment-calendar-demo", title: "Week view" },
      {
        name: "appointment-calendar-day-demo",
        title: "Day view with providers",
        description: "Pass `providers` to get one column per clinician (resource view). Slots here are 15 minutes.",
      },
      { name: "appointment-calendar-month-demo", title: "Month view" },
    ],
    usage: `import { AppointmentCalendar, type Appointment } from "@/components/medicn/appointment-calendar"

const appointments: Appointment[] = [
  {
    id: "1",
    title: "Amelia Hart",
    type: "Follow-up",
    start: new Date(2026, 10, 2, 9, 0),
    end: new Date(2026, 10, 2, 9, 30),
    status: "confirmed",
    providerId: "patel",
  },
]

<AppointmentCalendar
  appointments={appointments}
  defaultView="week"
  defaultDate={new Date(2026, 10, 2)}
  onAppointmentClick={(appt) => openChart(appt.id)}
  onSlotClick={({ start, providerId }) => openBookingDialog(start, providerId)}
/>`,
    notes: [
      "Statuses: scheduled, confirmed, checked-in, in-progress, completed, cancelled (struck through), no-show.",
      "Empty slots are only interactive when `onSlotClick` is provided. Day headers open the day view.",
      "Pass `now` to draw the current-time line. It is opt-in so server and client renders always match.",
      "Appointments are placed on their start day and clipped to `startHour`–`endHour`.",
      "`AppointmentStatusBadge` and `APPOINTMENT_STATUS_LABELS` are exported for use in lists and dialogs.",
    ],
    api: [
      {
        component: "AppointmentCalendar",
        props: [
          { name: "appointments", type: "Appointment[]", description: "Appointments to display." },
          { name: "view", type: '"day" | "week" | "month"', description: "Controlled view." },
          { name: "defaultView", type: "CalendarView", default: '"week"', description: "Initial view when uncontrolled." },
          { name: "onViewChange", type: "(view: CalendarView) => void", description: "Called when the view changes." },
          { name: "date", type: "Date", description: "Controlled date that sets the visible period." },
          { name: "defaultDate", type: "Date", default: "new Date()", description: "Initial date when uncontrolled. Pass it for server rendering." },
          { name: "onDateChange", type: "(date: Date) => void", description: "Called by Today, previous/next, or clicking a day." },
          { name: "providers", type: "CalendarProvider[]", description: "Day view shows one column per provider; unmatched appointments go to “Unassigned”." },
          { name: "startHour", type: "number", default: "7", description: "First hour of the time grid." },
          { name: "endHour", type: "number", default: "19", description: "Hour the time grid ends (exclusive)." },
          { name: "slotMinutes", type: "number", default: "30", description: "Length of a clickable slot and grid line spacing." },
          { name: "weekStartsOn", type: "0 | 1 | 2 | 3 | 4 | 5 | 6", default: "1", description: "First day of the week (0 = Sunday)." },
          { name: "hideWeekends", type: "boolean", default: "false", description: "Hide Saturday and Sunday." },
          { name: "hourHeight", type: "number", default: "72", description: "Pixel height of one hour in day and week views." },
          { name: "maxHeight", type: "number | string", default: "640", description: "Max height of the scrollable time grid." },
          { name: "onAppointmentClick", type: "(appointment: Appointment) => void", description: "Called when an appointment is clicked." },
          { name: "onSlotClick", type: "(slot: { start: Date; end: Date; providerId?: string }) => void", description: "Makes empty slots clickable." },
          { name: "renderAppointment", type: "(appointment: Appointment) => ReactNode", description: "Custom block content. Positioning and status colors are kept." },
          { name: "now", type: "Date", description: "Draws the current-time line and highlights today." },
        ],
      },
      {
        component: "Appointment",
        props: [
          { name: "id / title", type: "string", description: "`title` is usually the patient name." },
          { name: "start / end", type: "Date", description: "Appointment time range." },
          { name: "status", type: "AppointmentStatus", default: '"scheduled"', description: "Drives color and label." },
          { name: "type", type: "string", description: 'Visit type, e.g. "Follow-up", "New patient".' },
          { name: "providerId", type: "string", description: "Matches `CalendarProvider.id` for the day resource view." },
          { name: "location", type: "string", description: "Room or site." },
          { name: "telehealth", type: "boolean", description: "Shows a video icon." },
        ],
      },
    ],
  },
  {
    name: "appointment-slot-picker",
    title: "Appointment Slot Picker",
    description: "Patient self-booking picker: choose a day, then an available time grouped by morning, afternoon and evening.",
    type: "registry:component",
    category: "Scheduling",
    references: [
      { label: "FHIR R4 Slot", href: "https://hl7.org/fhir/R4/slot.html", description: "Each time button is a free `Slot` in a provider's `Schedule`." },
    ],
    files: [component("appointment-slot-picker")],
    dependencies: ["date-fns", "lucide-react"],
    registryDependencies: ["button", "calendar"],
    demos: [{ name: "appointment-slot-picker-demo" }],
    usage: `import { AppointmentSlotPicker } from "@/components/medicn/appointment-slot-picker"

const [value, setValue] = React.useState<Date | null>(null)

<AppointmentSlotPicker
  getSlots={(date) => slotsFor(date)}
  value={value}
  onValueChange={setValue}
  disabledDates={(d) => d.getDay() === 0 || d.getDay() === 6}
  timeZoneLabel="Eastern Time (ET)"
/>`,
    notes: [
      "Unavailable slots render disabled and struck through. Days with availability get a dot in the calendar.",
      "The slot grid has a single tab stop; use arrow keys, Home and End to move between times.",
      "Pass `today` when rendering on the server so the calendar does not read the clock during render.",
    ],
    api: [
      {
        component: "AppointmentSlotPicker",
        props: [
          { name: "slots", type: "{ start: Date; end?: Date; available?: boolean }[]", description: "Slots across any dates; filtered to the selected day." },
          { name: "getSlots", type: "(date: Date) => TimeSlot[]", description: "Alternative to `slots`: return the slots for one day." },
          { name: "date / defaultDate", type: "Date", description: "Controlled / initial selected day." },
          { name: "onDateChange", type: "(date: Date) => void", description: "Called when the day changes." },
          { name: "value / defaultValue", type: "Date | null", description: "Controlled / initial selected slot start." },
          { name: "onValueChange", type: "(value: Date | null) => void", description: "Called with the slot start, or `null` when deselected." },
          { name: "disabledDates", type: "(date: Date) => boolean", description: "Days that cannot be picked." },
          { name: "today", type: "Date", description: "Highlights today in the calendar." },
          { name: "timeZoneLabel", type: "string", description: 'Shown in the header, e.g. "Eastern Time (ET)".' },
          { name: "slotFormat", type: "string", default: '"h:mm a"', description: "date-fns pattern for slot labels." },
          { name: "emptyMessage", type: "ReactNode", description: "Shown when the day has no slots." },
        ],
      },
    ],
  },

  // ───────────────────────────── Clinical data ─────────────────────────────
  {
    name: "clinical-status-badge",
    title: "Clinical Status Badge",
    description: "Color-coded status pill for results and observations: normal, borderline, abnormal, critical.",
    type: "registry:component",
    category: "Clinical data",
    references: [
      { label: "HL7 v3 ObservationInterpretation", href: "https://hl7.org/fhir/R4/v3/ObservationInterpretation/cs.html", description: "normal ≈ N, abnormal ≈ L/H/A, critical ≈ LL/HH/AA." },
    ],
    files: [component("clinical-status-badge")],
    dependencies: ["class-variance-authority"],
    demos: [{ name: "clinical-status-badge-demo" }],
    usage: `import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"

<ClinicalStatusBadge status="critical" />
<ClinicalStatusBadge status="normal">Within range</ClinicalStatusBadge>`,
    api: [
      {
        component: "ClinicalStatusBadge",
        description: "Extends the native span props.",
        props: [
          {
            name: "status",
            type: '"normal" | "watch" | "abnormal" | "critical" | "info" | "unknown"',
            default: '"unknown"',
            description: "Clinical severity. Drives color and the default label.",
          },
          { name: "dot", type: "boolean", default: "true", description: "Leading status dot. Critical dots pulse (respects reduced motion)." },
          { name: "children", type: "ReactNode", description: "Custom label. Defaults to the status label." },
        ],
      },
    ],
  },
  {
    name: "vital-signs",
    title: "Vital Signs",
    description: "Vital sign cards with reference ranges, automatic status classification and trend sparklines.",
    type: "registry:component",
    category: "Clinical data",
    references: [
      { label: "FHIR R4 Vital Signs profile", href: "https://hl7.org/fhir/R4/observation-vitalsigns.html", description: "Readings map to vital-signs `Observation` resources." },
    ],
    files: [component("vital-signs")],
    registryDependencies: ["medicn:clinical-status-badge"],
    demos: [
      { name: "vital-signs-demo", title: "Panel" },
      { name: "vital-sign-card-demo", title: "Single card", description: "A critical reading gets an emphasized border." },
    ],
    usage: `import { VitalSignsPanel } from "@/components/medicn/vital-signs"

<VitalSignsPanel
  readings={[
    { type: "bloodPressure", systolic: 142, diastolic: 91, history: [128, 135, 142] },
    { type: "heartRate", value: 78, recordedAt: "Today, 09:42" },
    { type: "spo2", value: 97 },
  ]}
/>`,
    notes: [
      "Default bands are generic adult screening ranges, not clinical decision support. Pass `status` on a reading to apply your own protocol.",
      "Helpers `classifyVital`, `classifyBloodPressure`, `worstStatus` and `VITAL_DEFINITIONS` are exported for reuse.",
    ],
    api: [
      {
        component: "VitalSignsPanel",
        props: [
          { name: "readings", type: "VitalReading[]", description: "Readings to render as a responsive grid of cards." },
          { name: "hideRange", type: "boolean", default: "false", description: "Hide the reference range line." },
        ],
      },
      {
        component: "VitalSignCard",
        props: [
          { name: "reading", type: "VitalReading", description: "A single reading." },
          { name: "hideRange", type: "boolean", default: "false", description: "Hide the reference range line." },
        ],
      },
      {
        component: "VitalReading",
        description: "Shape of a reading.",
        props: [
          {
            name: "type",
            type: '"bloodPressure" | "heartRate" | "respiratoryRate" | "temperature" | "spo2" | "bmi" | "glucose"',
            description: "Which vital sign.",
          },
          { name: "value", type: "number", description: "Numeric value (all types except blood pressure)." },
          { name: "systolic / diastolic", type: "number", description: "Blood pressure components in mmHg." },
          { name: "history", type: "number[]", description: "Older → newer values for the sparkline." },
          { name: "recordedAt", type: "string", description: 'Pre-formatted timestamp, e.g. "Today, 09:42".' },
          { name: "status", type: "ClinicalStatus", description: "Override the computed status." },
        ],
      },
    ],
  },
  {
    name: "medication-list",
    title: "Medication List",
    description: "Active medication list with dose, route, frequency, PRN and high-alert flags.",
    type: "registry:component",
    category: "Clinical data",
    references: [
      { label: "FHIR R4 MedicationRequest", href: "https://hl7.org/fhir/R4/medicationrequest.html", description: "Rows correspond to active medication requests or statements." },
    ],
    files: [component("medication-list")],
    dependencies: ["lucide-react"],
    demos: [{ name: "medication-list-demo" }],
    usage: `import { MedicationList } from "@/components/medicn/medication-list"

<MedicationList
  medications={[
    { id: "1", name: "Metformin", strength: "500 mg", route: "Oral", frequency: "Twice daily", status: "active" },
    { id: "2", name: "Apixaban", strength: "5 mg", route: "Oral", frequency: "Twice daily", highAlert: true },
  ]}
/>`,
    api: [
      {
        component: "MedicationList",
        props: [
          { name: "medications", type: "Medication[]", description: "Medications to list." },
          { name: "renderActions", type: "(medication: Medication) => ReactNode", description: "Per-row actions slot, e.g. a dropdown menu." },
          { name: "emptyMessage", type: "ReactNode", default: '"No medications recorded."', description: "Shown when the list is empty." },
        ],
      },
      {
        component: "Medication",
        props: [
          { name: "id / name", type: "string", description: "Required identifiers." },
          { name: "strength, route, frequency, indication, prescriber, startDate", type: "string", description: "Optional display fields." },
          { name: "status", type: '"active" | "held" | "discontinued" | "completed"', default: '"active"', description: "Discontinued and completed rows are de-emphasized." },
          { name: "prn", type: "boolean", description: "As-needed medication." },
          { name: "highAlert", type: "boolean", description: "Flags high-alert medications such as anticoagulants or insulin." },
        ],
      },
    ],
  },

  {
    name: "lab-results",
    title: "Lab Results",
    description:
      "Results-review table grouped into collapsible panels, with FHIR interpretation flags, reference ranges, change since the previous result, and a trend chart for each result.",
    type: "registry:component",
    category: "Clinical data",
    references: [
      { label: "FHIR R4 Observation", href: "https://hl7.org/fhir/R4/observation.html", description: "Each row is an `Observation`: value, unit, `referenceRange`, `interpretation`, `status`, `effectiveDateTime`." },
      { label: "FHIR R4 DiagnosticReport", href: "https://hl7.org/fhir/R4/diagnosticreport.html", description: "Each panel is a `DiagnosticReport` grouping its results." },
      { label: "HL7 v3 ObservationInterpretation", href: "https://hl7.org/fhir/R4/v3/ObservationInterpretation/cs.html", description: "The N, L, H, LL, HH, A and AA flags." },
      { label: "MyChart: Test results", href: "https://www.mychart.org/l/en-us/help/test-results/", description: "Epic's patient portal shows each result with its standard range and a \"Compare result trends\" history view — the same pattern." },
    ],
    files: [component("lab-results")],
    dependencies: ["recharts", "date-fns", "lucide-react"],
    registryDependencies: ["badge", "card", "chart", "collapsible", "label", "switch", "table", "medicn:clinical-status-badge"],
    demos: [
      { name: "lab-results-demo" },
      {
        name: "lab-results-abnormal-demo",
        title: "Abnormal only",
        description: "`defaultAbnormalOnly` hides normal results and any panel left empty. Text results use a lab-supplied `interpretation`.",
      },
    ],
    usage: `import { LabResults, type LabPanel } from "@/components/medicn/lab-results"

const panels: LabPanel[] = [
  {
    id: "bmp",
    name: "Basic metabolic panel",
    collectedAt: "2026-03-14T07:30:00",
    results: [
      {
        id: "k",
        name: "Potassium",
        code: "2823-3",
        value: 6.4,
        unit: "mmol/L",
        referenceRange: { low: 3.5, high: 5.1, criticalLow: 2.8, criticalHigh: 6.2 },
        effectiveDate: "2026-03-14T07:30:00",
        previous: [{ value: 5.3, effectiveDate: "2026-03-12T07:15:00" }],
      },
    ],
  },
]

<LabResults panels={panels} onResultSelect={(result) => console.log(result.code)} />`,
    notes: [
      "Fields follow FHIR R4 `Observation` (value, unit, referenceRange, interpretation, status, effectiveDateTime) and `DiagnosticReport` for panels.",
      "`interpretation` uses HL7 v3 ObservationInterpretation codes. When it is missing, `getLabInterpretation(result)` derives it from a numeric value and the reference range. LL/HH need `criticalLow`/`criticalHigh`.",
      "`getLabStatus` maps N → normal, L/H/A → abnormal, LL/HH/AA → critical. `LAB_INTERPRETATION_LABELS` gives full text (e.g. \"Critical high\"), which is also the screen-reader text of each flag pill.",
      "Reference ranges are data from your lab; nothing is hard-coded.",
      "Each row has a button (Enter/Space or click) that calls `onResultSelect` and expands an inline trend chart (numeric results with `previous`) or the note. The reference range is shaded and dots are coloured by status.",
      "The change arrow has an aria-label such as \"Up 1.1 from 5.3 mmol/L on Mar 12, 2026\". Preliminary, corrected, amended and cancelled results get a status tag.",
      "An aria-live region announces how many results are shown when the filter changes.",
    ],
    api: [
      {
        component: "LabResults",
        description: "Other div props are passed to the root Card.",
        props: [
          { name: "panels", type: "LabPanel[]", description: "Panels (DiagnosticReports) with their results." },
          { name: "title", type: "ReactNode", default: '"Results"', description: "Card title." },
          { name: "defaultOpenPanels", type: "string[]", default: "all panel ids", description: "Panels expanded initially." },
          { name: "openPanels", type: "string[]", description: "Controlled expanded panel ids." },
          { name: "onOpenPanelsChange", type: "(ids: string[]) => void", description: "Called when a panel is expanded or collapsed." },
          { name: "onResultSelect", type: "(result: LabResult, panel: LabPanel) => void", description: "Called when a result row is activated." },
          { name: "showPrevious", type: "boolean", default: "true", description: "Show the Previous column with the change since the last result." },
          { name: "abnormalOnly", type: "boolean", description: "Controlled \"Abnormal only\" filter." },
          { name: "defaultAbnormalOnly", type: "boolean", default: "false", description: "Initial filter state when uncontrolled." },
          { name: "onAbnormalOnlyChange", type: "(value: boolean) => void", description: "Called when the switch is toggled." },
          { name: "hideFilter", type: "boolean", default: "false", description: "Hide the built-in switch (filtering still works via `abnormalOnly`)." },
          { name: "dateFormat", type: "string", default: '"MMM d, yyyy"', description: "date-fns pattern for dates." },
          { name: "emptyMessage", type: "ReactNode", default: '"No results available."', description: "Shown when there are no panels." },
        ],
      },
      {
        component: "LabResult",
        props: [
          { name: "id / name", type: "string", description: "Required identifiers; name e.g. \"Hemoglobin\"." },
          { name: "code", type: "string", description: "LOINC code." },
          { name: "value", type: "number | string", description: "Result value. Only numbers are flagged automatically and trended." },
          { name: "unit", type: "string", description: "UCUM unit, e.g. \"mmol/L\"." },
          { name: "referenceRange", type: "{ low?, high?, criticalLow?, criticalHigh?, text? }", description: "Range from the performing lab. `text` replaces low–high in the display." },
          { name: "interpretation", type: '"N" | "L" | "H" | "LL" | "HH" | "A" | "AA"', description: "Lab-supplied flag. Derived when absent." },
          { name: "status", type: '"final" | "preliminary" | "corrected" | "amended" | "cancelled"', default: '"final"', description: "Observation status." },
          { name: "effectiveDate", type: "string", description: "ISO date-time." },
          { name: "previous", type: "{ value: number; effectiveDate: string }[]", description: "History, most recent first." },
          { name: "note", type: "string", description: "Comment shown in the expanded row." },
        ],
      },
      {
        component: "LabPanel",
        props: [
          { name: "id / name", type: "string", description: "Panel identifiers, e.g. \"Complete blood count\"." },
          { name: "collectedAt", type: "string", description: "ISO collection date-time." },
          { name: "status", type: "LabResultStatus", description: "Report status." },
          { name: "results", type: "LabResult[]", description: "Results in the panel." },
        ],
      },
    ],
  },
  {
    name: "vitals-chart",
    title: "Vitals Chart",
    description:
      "Trend chart of vital signs over time, with a shaded normal band and dots coloured by clinical status, like EHR flowsheet graphs and NEWS2 charts.",
    type: "registry:component",
    category: "Clinical data",
    references: [
      { label: "FHIR R4 Vital Signs profile", href: "https://hl7.org/fhir/R4/observation-vitalsigns.html", description: "Series types match the core vital-signs Observations and their LOINC codes." },
      { label: "RCP: National Early Warning Score (NEWS2)", href: "https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/", description: "The NHS-standard observation chart plots each vital over time against coloured ranges, the pattern this chart follows." },
    ],
    files: [component("vitals-chart")],
    dependencies: ["recharts", "date-fns", "lucide-react"],
    registryDependencies: ["button", "chart", "table", "toggle-group", "medicn:clinical-status-badge", "medicn:vital-signs"],
    demos: [
      { name: "vitals-chart-demo" },
      {
        name: "vitals-chart-single-demo",
        title: "Single vital",
        description: "With one series the selector is hidden. SpO₂ dropping below 92% shows abnormal and critical dots.",
      },
    ],
    usage: `import { VitalsChart } from "@/components/medicn/vitals-chart"

<VitalsChart
  series={[
    { type: "heartRate", points: [{ time: "2026-03-14T08:00:00", value: 82 }, { time: "2026-03-14T12:00:00", value: 96 }] },
    { type: "bloodPressure", points: [{ time: "2026-03-14T08:00:00", value: 124, value2: 78 }] },
  ]}
/>`,
    notes: [
      "The root has no card or border, so wrap it in your own Card.",
      "Labels, units and point status come from `VITAL_DEFINITIONS`, `classifyVital` and `classifyBloodPressure` in vital-signs. `oxygenSaturation` maps to `spo2`.",
      "Default normal bands are derived from those classifiers (exported as `VITALS_CHART_DEFAULT_RANGES`). They are generic adult screening defaults, not decision support; pass `range` (and `range2` for diastolic) to match your protocol.",
      "`weight` and `custom` series have no default band. Pass `range` for shading and in/out-of-range status, or `classify` for your own logic.",
      "Blood pressure is drawn as two lines: systolic solid, diastolic dashed.",
      "The chart is aria-hidden. A data table with time, value and status is always present for screen readers, and \"Show table\" makes it visible.",
      "Animations are disabled when the user prefers reduced motion. `time` can be ISO (formatted with `timeFormat`) or a ready-made label.",
    ],
    api: [
      {
        component: "VitalsChart",
        description: "Other div props are passed to the root.",
        props: [
          { name: "series", type: "VitalsChartSeries[]", description: "One or more vitals. A selector appears when there is more than one." },
          { name: "value", type: "string", description: "Controlled selected series key (`id ?? type`)." },
          { name: "defaultValue", type: "string", default: "first series", description: "Initial selected series when uncontrolled." },
          { name: "onValueChange", type: "(value: string) => void", description: "Called when the selected vital changes." },
          { name: "height", type: "number", default: "240", description: "Chart height in px." },
          { name: "showRange", type: "boolean", default: "true", description: "Shade the normal band." },
          { name: "timeFormat", type: "string", default: '"HH:mm"', description: "date-fns pattern for x-axis ticks." },
          { name: "tooltipTimeFormat", type: "string", default: '"MMM d, HH:mm"', description: "date-fns pattern for the tooltip and table." },
          { name: "defaultShowTable", type: "boolean", default: "false", description: "Show the data table initially." },
        ],
      },
      {
        component: "VitalsChartSeries",
        props: [
          { name: "type", type: '"bloodPressure" | "heartRate" | "respiratoryRate" | "temperature" | "oxygenSaturation" | "weight" | "custom"', description: "Vital type. Sets default label, unit, band and classifier." },
          { name: "id", type: "string", description: "Unique key when two series share a type." },
          { name: "label / unit", type: "string", description: "Override the default label and unit." },
          { name: "points", type: "{ time: string; value: number; value2?: number }[]", description: "Observations, oldest first. `value2` is diastolic for BP." },
          { name: "range / range2", type: "{ low: number; high: number }", description: "Normal band (range2 = diastolic band for BP)." },
          { name: "classify", type: "(point) => ClinicalStatus", description: "Custom per-point status." },
        ],
      },
    ],
  },
  {
    name: "medication-form",
    title: "Medication Form",
    description:
      "Structured medication order entry (sig builder) with drug search, quick-pick presets, PRN, high-alert warning and a live plain-language sig preview.",
    type: "registry:component",
    category: "Forms",
    references: [
      { label: "FHIR R4 MedicationRequest", href: "https://hl7.org/fhir/R4/medicationrequest.html", description: "The order maps onto `MedicationRequest` with `dispenseRequest` (quantity, refills) and `substitution`." },
      { label: "FHIR R4 Dosage", href: "https://hl7.org/fhir/R4/dosage.html", description: "Dose, route, timing and `asNeeded` follow `Dosage`." },
      { label: "FHIR timing abbreviations", href: "https://hl7.org/fhir/R4/valueset-timing-abbreviation.html", description: "Frequency codes (QD, BID, TID, Q4H, BED, WK…) come from this value set." },
      { label: "ISMP list of high-alert medications (community/ambulatory)", href: "https://home.ecri.org/blogs/ismp-resources/high-alert-medications-in-community-ambulatory-care-settings", description: "Basis for the high-alert warning." },
      { label: "ISMP Canada: Do Not Use dangerous abbreviations", href: "https://www.ismp-canada.org/download/ISMPC_List_of_Dangerous_Abbreviations.pdf", description: "Why the sig spells out \"daily\" and \"units\" and never prints trailing zeros." },
    ],
    files: [component("medication-form")],
    dependencies: ["lucide-react"],
    registryDependencies: [
      "button",
      "checkbox",
      "command",
      "field",
      "input",
      "label",
      "popover",
      "select",
      "switch",
      "textarea",
      "medicn:medication-list",
    ],
    demos: [
      {
        name: "medication-form-demo",
        title: "With drug list and presets",
        description:
          "Pick a drug (insulin glargine and warfarin are flagged high-alert), apply a quick pick, and submit. Orders are added to a `MedicationList` with `toMedication`.",
      },
      {
        name: "medication-form-prn-demo",
        title: "As-needed order",
        description: "Prefilled with `defaultValue`: albuterol inhaler, 2 puffs every 4 hours as needed for wheezing.",
      },
    ],
    usage: `import { MedicationForm, toMedication, type MedicationOrder } from "@/components/medicn/medication-form"
import { MedicationList } from "@/components/medicn/medication-list"

<MedicationForm
  medicationOptions={[
    { name: "Metformin", strength: "500 mg", form: "tablet", code: "861007" },
    { name: "Warfarin", strength: "5 mg", form: "tablet", highAlert: true },
  ]}
  presets={[{ label: "1 tab PO BID", order: { dose: { value: 1, unit: "tablet" }, route: "oral", frequency: "BID" } }]}
  onSubmit={(order: MedicationOrder) => setMeds((prev) => [...prev, toMedication(order, crypto.randomUUID())])}
  onCancel={close}
/>`,
    notes: [
      "Modelled on FHIR R4 MedicationRequest + Dosage and NCPDP SCRIPT structured sig. Frequency codes follow the FHIR timing-abbreviation value set; Q12H is an extra code that maps to timing.repeat { frequency: 1, period: 12, periodUnit: \"h\" }.",
      "`formatSig` writes plain words only, following ISMP error-prone abbreviation guidance: no QD/BID/U in the output, no trailing zeros (\"1\", not \"1.0\") and always a leading zero (\"0.5\"). \"U\"/\"IU\" become \"units\" and \"cc\" becomes \"mL\".",
      "Choosing a drug or dose form fills strength, form, dose unit, route and the high-alert flag. A high-alert drug shows a warning callout (ISMP high-alert list).",
      "Validation runs on submit: medication, dose, route and frequency are required; \"as needed for\" is required when PRN is on; quantity and refills must be whole numbers of 0 or more. The first invalid field gets focus.",
      "Free-text drug names are always allowed. The sig preview is announced politely to screen readers.",
      "The form only builds the order. It does not check doses, interactions or allergies.",
      "`toMedication(order, id?)` maps an order to a `MedicationList` row (status \"active\").",
    ],
    api: [
      {
        component: "MedicationForm",
        description: "Extends the native form props.",
        props: [
          { name: "defaultValue", type: "Partial<MedicationOrder>", description: "Initial order, e.g. when editing." },
          { name: "onSubmit", type: "(order: MedicationOrder) => void", description: "Called with a valid order." },
          { name: "onCancel", type: "() => void", description: "Shows a Cancel button when provided." },
          { name: "presets", type: "{ label: string; order: Partial<MedicationOrder> }[]", description: "Quick-pick chips merged into the current order." },
          { name: "medicationOptions", type: "{ name: string; strength?: string; form?: string; code?: string; highAlert?: boolean }[]", description: "Turns the medication field into a searchable combobox. Free text is still allowed." },
          { name: "submitLabel", type: "string", default: '"Add medication"', description: "Submit button text." },
          { name: "resetOnSubmit", type: "boolean", default: "false", description: "Reset to `defaultValue` after a successful submit." },
          { name: "className", type: "string", description: "Classes for the form element." },
        ],
      },
      {
        component: "MedicationOrder",
        props: [
          { name: "medication", type: "string", description: "Drug name." },
          { name: "code", type: "string", description: "RxNorm code." },
          { name: "strength / form", type: "string", description: 'e.g. "500 mg" / "tablet" | "capsule" | "inhaler"…' },
          { name: "dose", type: "{ value?: number; unit: string }", description: 'e.g. { value: 1, unit: "tablet" }.' },
          { name: "route", type: "MedicationRoute", description: "oral, sublingual, IV, IM, SC, topical, inhaled, rectal, ophthalmic, otic, nasal, transdermal." },
          { name: "frequency", type: "FrequencyCode", description: "QD, BID, TID, QID, AM, PM, QOD, Q1H–Q8H, Q12H, BED, WK, MO, ONCE or custom." },
          { name: "customFrequency", type: "string", description: 'Plain-word frequency when `frequency` is "custom".' },
          { name: "timing", type: "{ withFood?: boolean }", description: "Adds \"with food\" to the sig." },
          { name: "asNeeded / asNeededFor", type: "boolean / string", description: "PRN flag and reason." },
          { name: "duration", type: '{ value: number; unit: "days" | "weeks" | "months" }', description: "Course length." },
          { name: "quantity / refills", type: "number", description: "Dispense quantity and number of refills." },
          { name: "substitutionAllowed", type: "boolean", default: "true", description: "Generic substitution allowed (false = dispense as written)." },
          { name: "indication", type: "string", description: "Reason for the medication." },
          { name: "instructions", type: "string", description: "Patient instructions, added to the end of the sig." },
          { name: "highAlert", type: "boolean", description: "ISMP high-alert medication." },
        ],
      },
      {
        component: "Helpers",
        props: [
          { name: "formatSig", type: "(order: Partial<MedicationOrder>) => string", description: "Readable sig, e.g. \"Take 1 tablet by mouth twice daily with food for 10 days.\"" },
          { name: "toMedication", type: "(order: MedicationOrder, id?: string) => Medication", description: "Maps an order to a MedicationList row." },
          { name: "FREQUENCIES", type: "{ code; label; abbreviation?; sig; timesPerDay? }[]", description: "Frequency options." },
          { name: "ROUTES", type: "{ code; label; verb; sig }[]", description: "Route options with sig wording." },
          { name: "formatFrequency / formatDoseNumber / formatDoseUnit", type: "function", description: "Plain-word, ISMP-safe building blocks." },
        ],
      },
    ],
  },
  {
    name: "clinical-timeline",
    title: "Clinical Timeline",
    description:
      "Chronological patient activity feed (visits, labs, imaging, medications, immunizations, messages) with type filters, search, day or month grouping and load more.",
    type: "registry:component",
    category: "Patient",
    references: [
      { label: "FHIR R4 Patient $everything", href: "https://hl7.org/fhir/R4/patient-operation-everything.html", description: "Returns every resource for a patient; sorting those by date gives this feed." },
      { label: "FHIR R4 Encounter", href: "https://hl7.org/fhir/R4/encounter.html", description: "Visits are `Encounter` resources." },
      { label: "Medplum React components", href: "https://github.com/medplum/medplum/tree/main/packages/react/src", description: "The open-source Medplum EHR toolkit ships `PatientTimeline`, `EncounterTimeline` and `ResourceTimeline` for the same job." },
    ],
    files: [component("clinical-timeline")],
    dependencies: ["date-fns", "lucide-react"],
    registryDependencies: ["button", "input", "toggle-group", "medicn:clinical-status-badge"],
    demos: [
      { name: "clinical-timeline-demo", title: "Chart review timeline" },
      {
        name: "clinical-timeline-compact-demo",
        title: "Grouped by month",
        description: "`groupBy=\"month\"`, no search, and 5 events per page.",
      },
    ],
    usage: `import { ClinicalTimeline, type TimelineEvent } from "@/components/medicn/clinical-timeline"

const events: TimelineEvent[] = [
  { id: "1", type: "lab", title: "Hemoglobin A1c", date: "2026-10-24T07:15:00", status: "abnormal", statusLabel: "High", href: "/labs/a1c" },
  { id: "2", type: "encounter", title: "Office visit", date: "2026-10-20T10:30:00", author: "Dr. Priya Patel" },
]

<ClinicalTimeline events={events} groupBy="day" pageSize={10} onEventSelect={(e) => openEvent(e.id)} />`,
    notes: [
      "Event types map to FHIR resources: Encounter, DocumentReference, Observation/DiagnosticReport, ImagingStudy, MedicationRequest, Procedure, Immunization, Communication. Any other string works too and gets a generic icon.",
      "Events are sorted newest first and grouped by local day or month. Pass local ISO date-times (no offset) to avoid server/client time-zone differences. Date-only values hide the time.",
      "The filter chips are a multi-select toggle group with a count for each type; no selection shows everything. Search matches title, text descriptions, author, location and tags.",
      "\"Load more\" adds `pageSize` events and moves focus to the first new one. The number of visible events is announced to screen readers.",
      "Uses <section>/<ol>/<li> and <time dateTime> semantics. Status always has a text label, never color alone.",
    ],
    api: [
      {
        component: "ClinicalTimeline",
        description: "Extends the native div props.",
        props: [
          { name: "events", type: "TimelineEvent[]", description: "Events in any order." },
          { name: "types", type: "string[]", description: "Filter chip options in order. Defaults to the types present in `events`." },
          { name: "filter", type: "string[]", description: "Controlled selected types (empty = all)." },
          { name: "defaultFilter", type: "string[]", default: "[]", description: "Initial selected types when uncontrolled." },
          { name: "onFilterChange", type: "(types: string[]) => void", description: "Called when the type filter changes." },
          { name: "searchable", type: "boolean", default: "true", description: "Show the search input." },
          { name: "groupBy", type: '"day" | "month"', default: '"day"', description: "Group heading granularity." },
          { name: "pageSize", type: "number", default: "10", description: "Events shown at first and added by each Load more." },
          { name: "onEventSelect", type: "(event: TimelineEvent) => void", description: "Makes event titles buttons." },
          { name: "renderActions", type: "(event: TimelineEvent) => ReactNode", description: "Extra controls for each event." },
          { name: "renderLink", type: "(event: TimelineEvent, children: ReactNode) => ReactNode", description: "Custom renderer for the View link (e.g. Next.js Link). Defaults to <a>." },
          { name: "emptyMessage", type: "ReactNode", default: '"No activity recorded."', description: "Shown when there are no events." },
        ],
      },
      {
        component: "TimelineEvent",
        props: [
          { name: "id / title", type: "string", description: "Identifier and headline." },
          { name: "type", type: "TimelineEventType", description: "encounter, note, lab, imaging, medication, procedure, immunization, vitals, message, document, or any string." },
          { name: "date", type: "string", description: "ISO date or date-time." },
          { name: "description", type: "ReactNode", description: "Body text. Only string descriptions are searched." },
          { name: "author / location", type: "string", description: "Meta line." },
          { name: "status / statusLabel", type: "ClinicalStatus / string", description: "Shows a ClinicalStatusBadge and tints the icon for watch, abnormal and critical." },
          { name: "tags", type: "string[]", description: "Small labels." },
          { name: "href", type: "string", description: "Adds a View link." },
        ],
      },
    ],
  },

  {
    name: "allergy-list",
    title: "Allergy List",
    description:
      "View and edit allergies and intolerances (FHIR AllergyIntolerance) with criticality, reactions, verification, no-known-allergies handling and a built-in entry form.",
    type: "registry:component",
    category: "Clinical data",
    references: [
      { label: "FHIR R4 AllergyIntolerance", href: "https://hl7.org/fhir/R4/allergyintolerance.html", description: "Every field and enum matches: `type`, `category`, `criticality`, `clinicalStatus`, `verificationStatus`, `reaction.manifestation`, `reaction.severity`." },
      { label: "US Core AllergyIntolerance profile", href: "https://hl7.org/fhir/us/core/StructureDefinition-us-core-allergyintolerance.html", description: "US EHRs must exchange allergies in this shape, including recording that a patient has no known allergies." },
    ],
    files: [component("allergy-list")],
    dependencies: ["lucide-react"],
    registryDependencies: [
      "alert-dialog",
      "button",
      "collapsible",
      "command",
      "dialog",
      "dropdown-menu",
      "field",
      "input",
      "label",
      "popover",
      "radio-group",
      "select",
      "switch",
      "textarea",
      "medicn:clinical-status-badge",
    ],
    demos: [
      { name: "allergy-list-demo", title: "Allergy list" },
      {
        name: "allergy-list-empty-demo",
        title: "Not recorded vs. no known allergies",
        description:
          "`allergies={undefined}` means allergy status is not recorded. Toggle NKA to confirm no known allergies; adding an allergy clears it.",
      },
    ],
    usage: `import { AllergyList, type Allergy } from "@/components/medicn/allergy-list"

const [allergies, setAllergies] = React.useState<Allergy[] | undefined>([
  {
    id: "1",
    substance: "Penicillin",
    category: "medication",
    criticality: "high",
    reactions: [{ manifestation: "Anaphylaxis", severity: "severe" }],
  },
])
const [nka, setNka] = React.useState(false)

<AllergyList
  allergies={allergies}
  onAllergiesChange={setAllergies}
  noKnownAllergies={nka}
  onNoKnownAllergiesChange={setNka}
  suggestions={["Penicillin", "Latex", "Peanut"]}
/>`,
    api: [
      {
        component: "AllergyList",
        props: [
          { name: "allergies", type: "Allergy[]", description: "Controlled allergies. `undefined` (with no default) means allergy status is not recorded." },
          { name: "defaultAllergies", type: "Allergy[]", description: "Initial allergies when uncontrolled." },
          { name: "onAllergiesChange", type: "(allergies: Allergy[]) => void", description: "Called after add, edit or remove." },
          { name: "noKnownAllergies", type: "boolean", description: "Controlled NKA state. Shown only when there are no active allergies; cleared when an active allergy is added." },
          { name: "defaultNoKnownAllergies", type: "boolean", default: "false", description: "Initial NKA state when uncontrolled." },
          { name: "onNoKnownAllergiesChange", type: "(value: boolean) => void", description: "Called when NKA is toggled or cleared by adding an allergy." },
          { name: "suggestions", type: "string[]", description: "Substance suggestions for the form combobox. Free text is always allowed." },
          { name: "readOnly", type: "boolean", default: "false", description: "Hide add, edit and remove controls and the NKA toggle." },
          { name: "title", type: "ReactNode", default: '"Allergies & intolerances"', description: "Header title." },
        ],
      },
      {
        component: "AllergyForm",
        description: "The entry form used in the dialog, exported for standalone use.",
        props: [
          { name: "defaultValue", type: "Partial<Allergy>", description: "Allergy to edit; its id is kept." },
          { name: "suggestions", type: "string[]", description: "Enables the substance combobox." },
          { name: "onSubmit", type: "(allergy: Allergy) => void", description: "Called with a valid allergy. Substance is required; a missing reaction only shows a warning." },
          { name: "onCancel", type: "() => void", description: "Shows a Cancel button." },
          { name: "submitLabel", type: "ReactNode", default: '"Save allergy"', description: "Submit button label." },
        ],
      },
      {
        component: "Allergy",
        props: [
          { name: "id / substance", type: "string", description: "Required. `substance` maps to FHIR `code.text`." },
          { name: "code", type: "string", description: "Optional RxNorm / SNOMED CT code." },
          { name: "type", type: '"allergy" | "intolerance"', description: "Intolerance gets a label on the row." },
          { name: "category", type: '"food" | "medication" | "environment" | "biologic"', description: "Sets the row icon." },
          { name: "criticality", type: '"low" | "high" | "unable-to-assess"', description: "High is shown in the critical tone and sorted first." },
          { name: "clinicalStatus", type: '"active" | "inactive" | "resolved"', default: '"active"', description: "Inactive and resolved entries are grouped under a collapsible Inactive section." },
          { name: "verificationStatus", type: '"unconfirmed" | "confirmed" | "refuted" | "entered-in-error"', description: "Unconfirmed shows a badge. Refuted and entered-in-error are treated as inactive and struck through." },
          { name: "reactions", type: '{ manifestation: string; severity?: "mild" | "moderate" | "severe" }[]', description: "Reaction manifestations with optional severity." },
          { name: "onset, recordedDate, note", type: "string", description: "Optional display fields." },
        ],
      },
    ],
    notes: [
      "Modelled on HL7 FHIR R4 AllergyIntolerance.",
      "Three states: active allergies, “No known allergies” (`noKnownAllergies`) and “Allergies not recorded”. Use `toPatientAllergies(allergies, nka)` to feed PatientHeader, which treats `[]` as NKDA and `undefined` as not recorded.",
      "Helpers exported: `sortAllergies`, `isAllergyActive`, `formatReactions`, `toPatientAllergies`, label maps and `COMMON_MANIFESTATIONS`.",
      "Remove asks for confirmation. To keep history, set the clinical status to inactive or resolved instead.",
    ],
  },
  {
    name: "problem-list",
    title: "Problem List",
    description:
      "Patient problem list (FHIR Condition) with Active/Resolved/All filters, coded diagnoses, async code search and resolve/reactivate actions.",
    type: "registry:component",
    category: "Clinical data",
    references: [
      { label: "FHIR R4 Condition", href: "https://hl7.org/fhir/R4/condition.html", description: "`clinicalStatus`, `verificationStatus`, `category` (problem-list-item, encounter-diagnosis), `severity`, `onset` and `abatement` match exactly." },
      { label: "ONC §170.315(a)(6) Problem list", href: "https://www.healthit.gov/test-method/problem-list", description: "The US EHR certification criterion for recording, changing and viewing active and historical problems. It was removed in the 2020 Cures Update, but every certified EHR built before then implements it." },
    ],
    files: [component("problem-list")],
    dependencies: ["lucide-react"],
    registryDependencies: [
      "alert-dialog",
      "button",
      "checkbox",
      "command",
      "dialog",
      "dropdown-menu",
      "field",
      "input",
      "popover",
      "select",
      "tabs",
      "textarea",
      "medicn:clinical-status-badge",
    ],
    demos: [
      {
        name: "problem-list-demo",
        title: "Problem list with code search",
        description: "`searchCodes` here is an async lookup over a small sample of ICD-10-CM codes. `today` turns on “Mark resolved”.",
      },
      { name: "problem-list-readonly-demo", title: "Read only" },
    ],
    usage: `import { ProblemList, type Problem } from "@/components/medicn/problem-list"

const problems: Problem[] = [
  {
    id: "1",
    display: "Type 2 diabetes mellitus",
    code: { system: "ICD-10-CM", code: "E11.9" },
    clinicalStatus: "active",
    onset: "2019-04-02",
  },
]

<ProblemList
  defaultProblems={problems}
  searchCodes={async (q) => (await fetch(\`/api/icd10?q=\${q}\`)).json()}
  today="2026-10-29"
/>`,
    api: [
      {
        component: "ProblemList",
        props: [
          { name: "problems", type: "Problem[]", description: "Controlled problems." },
          { name: "defaultProblems", type: "Problem[]", default: "[]", description: "Initial problems when uncontrolled." },
          { name: "onProblemsChange", type: "(problems: Problem[]) => void", description: "Called after any add, edit, resolve, reactivate, pin or remove." },
          { name: "searchCodes", type: "(query: string) => Promise<ProblemCodeResult[]> | ProblemCodeResult[]", description: "Diagnosis lookup for the form combobox (sync or async, debounced 200 ms). Without it the diagnosis is a plain text input." },
          { name: "today", type: "string", description: "Today as YYYY-MM-DD. Used as the abatement date for “Mark resolved”; without it that action is hidden." },
          { name: "readOnly", type: "boolean", default: "false", description: "Hide add and row actions." },
          { name: "defaultFilter", type: '"active" | "resolved" | "all"', default: '"active"', description: "Initial filter tab." },
          { name: "title", type: "ReactNode", default: '"Problem list"', description: "Header title." },
        ],
      },
      {
        component: "ProblemForm",
        description: "The add/edit form used in the dialog, exported for standalone use.",
        props: [
          { name: "defaultValue", type: "Partial<Problem>", description: "Problem to edit; its id is kept." },
          { name: "searchCodes", type: "ProblemCodeSearch", description: "Enables the searchable diagnosis combobox with free-text fallback." },
          { name: "onSubmit", type: "(problem: Problem) => void", description: "Called with a valid problem. The diagnosis is required." },
          { name: "onCancel", type: "() => void", description: "Shows a Cancel button." },
          { name: "submitLabel", type: "ReactNode", default: '"Save problem"', description: "Submit button label." },
        ],
      },
      {
        component: "Problem",
        props: [
          { name: "id / display", type: "string", description: "Required. `display` maps to FHIR `code.text`." },
          { name: "code", type: '{ system: "ICD-10-CM" | "SNOMED CT" | string; code: string }', description: "Shown as a mono pill." },
          { name: "clinicalStatus", type: '"active" | "recurrence" | "relapse" | "inactive" | "remission" | "resolved"', description: "Required. Decides the Active or Resolved tab." },
          { name: "verificationStatus", type: '"unconfirmed" | "provisional" | "differential" | "confirmed" | "refuted" | "entered-in-error"', description: "Non-confirmed values show a badge. Refuted and entered-in-error appear only under All." },
          { name: "category", type: '"problem-list-item" | "encounter-diagnosis"', description: "Encounter diagnoses are labelled." },
          { name: "severity", type: '"mild" | "moderate" | "severe"', description: "Severity pill." },
          { name: "onset / abatement", type: "string", description: "ISO date, YYYY-MM or YYYY, shown as “since Apr 2019” or “resolved 2015”. Other strings pass through." },
          { name: "recordedDate, note", type: "string", description: "Optional fields." },
          { name: "priority", type: "boolean", description: "Pinned or chief problem, sorted to the top with a star." },
        ],
      },
    ],
    notes: [
      "Modelled on HL7 FHIR R4 Condition. Active covers active, recurrence and relapse; Resolved covers inactive, remission and resolved.",
      "Code search results are announced via aria-live. Stale responses are ignored and errors fall back to free text.",
      "The demo ICD-10-CM list is sample data, not a terminology service.",
      "Helpers exported: `filterProblems`, `isProblemActive`, `isProblemResolved`, `formatProblemDate`, label maps.",
    ],
  },

  // ───────────────────────────── Anatomy ─────────────────────────────
  {
    name: "body-map",
    title: "Body Map",
    description:
      "Interactive front/back human anatomy map for marking where the problem is, with heat-map intensity and selection chips.",
    type: "registry:component",
    category: "Anatomy",
    files: [component("body-map")],
    dependencies: ["lucide-react"],
    registryDependencies: ["badge", "button", "toggle-group"],
    demos: [
      { name: "body-map-demo" },
      {
        name: "body-map-intensity-demo",
        title: "Pain intensity heat map",
        description: "Pass `intensity` (0–10 per region) to color regions amber → red. Read-only here.",
      },
      {
        name: "body-map-controlled-demo",
        title: "Controlled, single select",
        description: "Controlled `view` and `value`, `multiple={false}`, with the face disabled.",
      },
    ],
    usage: `"use client"

import * as React from "react"
import { BodyMap, BodyMapSelectionList } from "@/components/medicn/body-map"

export function PainLocation() {
  const [areas, setAreas] = React.useState<string[]>([])
  return (
    <div className="flex flex-col items-center gap-4">
      <BodyMap value={areas} onValueChange={setAreas} />
      <BodyMapSelectionList value={areas} onRemove={(id) => setAreas((a) => a.filter((x) => x !== id))} />
    </div>
  )
}`,
    notes: [
      "54 regions (28 front, 26 back). Region ids use anatomical sides from the patient's perspective, e.g. `front-knee-left`, `back-lower-back-right`. In the front view the patient's right is on the viewer's left.",
      "`BODY_REGIONS`, `getBodyRegionLabel(id)` and `getBodyMapHeatColor(intensity)` are exported for summaries and legends.",
      "Selection keeps ids from both views, so switching front/back never loses data.",
      "Each region is a `role=\"checkbox\"` with its anatomical label; Enter or Space toggles it.",
      "Paths are computed at module load without browser APIs, so the map renders on the server.",
    ],
    api: [
      {
        component: "BodyMap",
        description: "Other div props are passed to the root.",
        props: [
          { name: "view", type: '"front" | "back"', description: "Controlled view." },
          { name: "defaultView", type: "BodyView", default: '"front"', description: "Initial view when uncontrolled." },
          { name: "onViewChange", type: "(view: BodyView) => void", description: "Called when the view changes." },
          { name: "value", type: "string[]", description: "Controlled selected region ids." },
          { name: "defaultValue", type: "string[]", default: "[]", description: "Initial selection when uncontrolled." },
          { name: "onValueChange", type: "(ids: string[]) => void", description: "Called when the selection changes." },
          { name: "multiple", type: "boolean", default: "true", description: "When `false`, a click replaces the selection." },
          { name: "intensity", type: "Record<string, number>", description: "Region id → 0–10. Heat-map coloring; added to labels and aria-labels." },
          { name: "showViewToggle", type: "boolean", default: "true", description: "Show the Front/Back toggle." },
          { name: "showLabels", type: "boolean", default: "true", description: "Floating region label on hover and focus." },
          { name: "readOnly", type: "boolean", default: "false", description: "Regions are focusable but cannot be toggled." },
          { name: "disabledRegions", type: "string[]", default: "[]", description: "Regions that cannot be selected." },
          { name: "className", type: "string", description: "Root defaults to `w-full max-w-[280px]`." },
        ],
      },
      {
        component: "BodyMapSelectionList",
        props: [
          { name: "value", type: "string[]", description: "Region ids to show as chips." },
          { name: "onRemove", type: "(id: string) => void", description: "Shows a remove button on each chip." },
          { name: "intensity", type: "Record<string, number>", description: "Adds “n/10” to each chip." },
          { name: "emptyText", type: "ReactNode", default: '"No areas selected"', description: "Shown when empty." },
        ],
      },
    ],
  },

  // ───────────────────────────── Forms ─────────────────────────────
  {
    name: "pain-scale",
    title: "Pain Scale",
    description: "0–10 Numeric Rating Scale with color bands, face descriptors and full keyboard support.",
    type: "registry:component",
    category: "Forms",
    files: [component("pain-scale")],
    dependencies: ["lucide-react"],
    demos: [
      { name: "pain-scale-demo" },
      { name: "pain-scale-sizes-demo", title: "Compact", description: "Small size without anchors or descriptor, for tables and dense forms." },
    ],
    usage: `import { PainScale } from "@/components/medicn/pain-scale"

const [pain, setPain] = React.useState<number | null>(null)

<PainScale value={pain} onValueChange={setPain} />`,
    notes: ["Implements the WAI-ARIA radio group pattern: arrow keys, Home and End move and select."],
    api: [
      {
        component: "PainScale",
        props: [
          { name: "value", type: "number | null", description: "Controlled score." },
          { name: "defaultValue", type: "number | null", default: "null", description: "Uncontrolled initial score." },
          { name: "onValueChange", type: "(value: number) => void", description: "Called when the score changes." },
          { name: "showDescriptor", type: "boolean", default: "true", description: "Show the face and descriptor for the selected score." },
          { name: "showAnchors", type: "boolean", default: "true", description: "Show anchor labels under 0, 5 and 10." },
          { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Button height." },
          { name: "disabled", type: "boolean", default: "false", description: "Disable input." },
          { name: "label", type: "string", default: '"Pain intensity from 0 to 10"', description: "Accessible name of the radio group." },
        ],
      },
    ],
  },
  {
    name: "vitals-form",
    title: "Vitals Form",
    description: "Vital signs entry with units, metric/imperial toggle, live status, plausibility checks and BMI.",
    type: "registry:component",
    category: "Forms",
    references: [
      { label: "FHIR R4 Vital Signs profile", href: "https://hl7.org/fhir/R4/observation-vitalsigns.html", description: "Fields match the core vital signs and their LOINC codes (8480-6/8462-4 blood pressure, 8867-4 heart rate, 9279-1 respiratory rate, 8310-5 temperature, 2708-6 SpO₂, 29463-7 weight, 8302-2 height, 39156-5 BMI). `onSubmit` returns metric UCUM units." },
    ],
    files: [component("vitals-form")],
    registryDependencies: ["button", "field", "input", "toggle-group", "medicn:clinical-status-badge", "medicn:vital-signs"],
    demos: [{ name: "vitals-form-demo" }],
    usage: `import { VitalsForm } from "@/components/medicn/vitals-form"

<VitalsForm onSubmit={(values) => saveVitals(values)} />`,
    notes: ["Submitted values are always normalized to metric units (°C, kg, cm) regardless of the unit toggle."],
    api: [
      {
        component: "VitalsForm",
        props: [
          { name: "onSubmit", type: "(values: VitalsFormValues) => void", description: "Called with metric values when the form is valid." },
          { name: "onValuesChange", type: "(values: VitalsFormValues) => void", description: "Called on every change. Memoize the callback." },
          { name: "defaultUnits", type: '"metric" | "imperial"', default: '"metric"', description: "Initial unit system." },
          { name: "submitLabel", type: "string", default: '"Save vitals"', description: "Submit button text." },
          { name: "hideSubmit", type: "boolean", default: "false", description: "Hide the action row when embedding in a larger form." },
        ],
      },
    ],
  },

  // ───────────────────────────── Patient ─────────────────────────────
  {
    name: "patient-header",
    title: "Patient Header",
    description: "Patient banner with demographics, copyable MRN, allergy chips and safety flags.",
    type: "registry:component",
    category: "Patient",
    references: [
      { label: "FHIR R4 Patient", href: "https://hl7.org/fhir/R4/patient.html", description: "Demographics and identifiers such as the MRN come from `Patient`." },
      { label: "FHIR R4 AllergyIntolerance", href: "https://hl7.org/fhir/R4/allergyintolerance.html", description: "Allergy chips use the `reaction.severity` values mild, moderate and severe." },
    ],
    files: [component("patient-header")],
    dependencies: ["lucide-react"],
    registryDependencies: ["avatar", "button", "tooltip"],
    demos: [
      { name: "patient-header-demo" },
      { name: "patient-header-compact-demo", title: "Compact", description: "Single-row banner for sticky chart headers." },
    ],
    usage: `import { PatientHeader } from "@/components/medicn/patient-header"

<PatientHeader
  patient={{
    name: "Amelia Hart",
    mrn: "MRN-204918",
    age: 38,
    sex: "Female",
    allergies: [{ substance: "Penicillin", reaction: "Anaphylaxis", severity: "severe" }],
    flags: [{ label: "Fall risk", tone: "warning" }],
  }}
/>`,
    api: [
      {
        component: "PatientHeader",
        props: [
          { name: "patient", type: "Patient", description: "Patient data, see below." },
          { name: "actions", type: "ReactNode", description: "Right-aligned actions such as “Start visit”." },
          { name: "compact", type: "boolean", default: "false", description: "Single-row variant without allergies and details." },
        ],
      },
      {
        component: "Patient",
        props: [
          { name: "name / mrn", type: "string", description: "Required." },
          { name: "age, sex, pronouns, dateOfBirth", type: "number | string", description: "Demographics line." },
          { name: "allergies", type: "PatientAllergy[]", description: "`undefined` shows “Not recorded”, `[]` shows NKDA." },
          { name: "flags", type: '{ label: string; tone?: "default" | "warning" | "critical" }[]', description: "Safety flags, e.g. DNR, Fall risk." },
          { name: "details", type: "{ label: string; value: ReactNode }[]", description: "Extra facts such as PCP, insurance, language." },
          { name: "avatarUrl", type: "string", description: "Photo URL. Falls back to initials." },
        ],
      },
    ],
  },
  // ───────────────────────────── Blocks ─────────────────────────────
  {
    name: "clinic-dashboard",
    title: "Clinic Dashboard",
    description: "Sidebar dashboard with KPIs, a provider day schedule, waiting room triage and new results.",
    type: "registry:block",
    category: "Blocks",
    files: [{ path: "components/blocks/clinic-dashboard/page.tsx", type: "registry:page", target: "app/clinic-dashboard/page.tsx" }],
    dependencies: ["date-fns", "lucide-react"],
    registryDependencies: ["avatar", "button", "card", "input", "separator", "sidebar", "tooltip", "medicn:appointment-calendar", "medicn:clinical-status-badge"],
  },
  {
    name: "patient-chart",
    title: "Patient Chart",
    description: "Patient chart: banner, vitals, editable problem list and allergies, lab results with trends, medication orders, timeline and a SOAP note.",
    type: "registry:block",
    category: "Blocks",
    files: [{ path: "components/blocks/patient-chart/page.tsx", type: "registry:page", target: "app/patient-chart/page.tsx" }],
    dependencies: ["lucide-react"],
    registryDependencies: ["button", "card", "dialog", "field", "tabs", "textarea", "medicn:allergy-list", "medicn:clinical-timeline", "medicn:lab-results", "medicn:medication-form", "medicn:medication-list", "medicn:patient-header", "medicn:problem-list", "medicn:vital-signs", "medicn:vitals-chart", "medicn:vitals-form"],
  },
  {
    name: "appointment-booking",
    title: "Appointment Booking",
    description: "Three-step patient self-booking flow: visit type, time slot, details and confirmation.",
    type: "registry:block",
    category: "Blocks",
    files: [{ path: "components/blocks/appointment-booking/page.tsx", type: "registry:page", target: "app/appointment-booking/page.tsx" }],
    dependencies: ["date-fns", "lucide-react"],
    registryDependencies: ["button", "card", "checkbox", "field", "input", "radio-group", "textarea", "medicn:appointment-slot-picker"],
  },
  {
    name: "symptom-report",
    title: "Symptom Report",
    description: "Patients mark affected areas on a body map, rate each one, and describe their symptoms.",
    type: "registry:block",
    category: "Blocks",
    files: [{ path: "components/blocks/symptom-report/page.tsx", type: "registry:page", target: "app/symptom-report/page.tsx" }],
    dependencies: ["lucide-react"],
    registryDependencies: ["button", "card", "field", "select", "textarea", "toggle-group", "medicn:body-map", "medicn:pain-scale"],
  },
  {
    name: "patient-intake",
    title: "Patient Intake Form",
    description: "New-patient intake: demographics, contacts, insurance, history, medications, allergies, body map and consent.",
    type: "registry:block",
    category: "Blocks",
    files: [{ path: "components/blocks/patient-intake/page.tsx", type: "registry:page", target: "app/patient-intake/page.tsx" }],
    dependencies: ["lucide-react"],
    registryDependencies: ["button", "card", "checkbox", "field", "input", "radio-group", "select", "switch", "textarea", "medicn:body-map", "medicn:pain-scale"],
  },
]

export function getRegistryItem(name: string) {
  return registryItems.find((item) => item.name === name)
}

export const categoryOrder: RegistryCategory[] = ["Scheduling", "Anatomy", "Forms", "Clinical data", "Patient", "Blocks"]
