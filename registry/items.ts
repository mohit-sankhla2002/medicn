/**
 * Single source of truth for the medicn registry.
 * - `scripts/build-registry.mts` turns this into `registry.json` for `shadcn build`.
 * - The docs site renders component pages from it.
 *
 * `registryDependencies` entries prefixed with `medicn:` point at other items in this
 * registry and are expanded to absolute URLs at build time.
 */

export type RegistryCategory =
  | "Scheduling"
  | "Anatomy"
  | "Forms"
  | "Assessments"
  | "Charting"
  | "Clinical data"
  | "Patient"
  | "Blocks"

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
      "Interactive human anatomy map for pinpointing where the problem is: ~100 fine regions (eyes, ears, nose, fingers, abdominal regions…), male and female figures, zoomable close-ups of the face, hands and feet, heat-map intensity and selection chips.",
    type: "registry:component",
    category: "Anatomy",
    files: [component("body-map"), { path: "components/medicn/body-map-data.ts", type: "registry:lib" }],
    dependencies: ["lucide-react"],
    registryDependencies: ["badge", "button", "toggle-group"],
    references: [
      {
        label: "Abdominal regions (nine-region scheme)",
        href: "https://en.wikipedia.org/wiki/Abdomen#Regions",
        description: "Detailed abdomen uses the nine regions bounded by the midclavicular lines and the subcostal and intertubercular planes.",
      },
    ],
    demos: [
      {
        name: "body-map-demo",
        title: "Detailed, with sex toggle",
        description: "Click the head, a hand or a foot to zoom into a close-up.",
      },
      {
        name: "body-map-head-demo",
        title: "Face close-up",
        description:
          "`defaultView=\"head\"` opens straight into the face: eyelids, nostrils, lips, earlobes, chin. Parts roll up with `getParentRegion`.",
      },
      {
        name: "body-map-intensity-demo",
        title: "Pain intensity heat map",
        description: "Pass `intensity` (0–10 per region) to color regions amber → red. Read-only here.",
      },
      {
        name: "body-map-controlled-demo",
        title: "Controlled, single select",
        description: "Controlled `view`, `focusPart` and `value`, `multiple={false}`, with one region disabled.",
      },
      {
        name: "body-map-simple-demo",
        title: "Simple regions",
        description: "`detail=\"simple\"` keeps the original 54 regions (and their ids), without close-ups.",
      },
    ],
    usage: `"use client"

import * as React from "react"
import { BodyMap, BodyMapSelectionList, type BodySex } from "@/components/medicn/body-map"

export function PainLocation() {
  const [areas, setAreas] = React.useState<string[]>([])
  const [sex, setSex] = React.useState<BodySex>("female")
  return (
    <div className="flex flex-col items-center gap-4">
      <BodyMap value={areas} onValueChange={setAreas} sex={sex} onSexChange={setSex} showSexToggle />
      <BodyMapSelectionList sex={sex} value={areas} onRemove={(id) => setAreas((a) => a.filter((x) => x !== id))} />
    </div>
  )
}`,
    notes: [
      "Two region sets. `detail=\"detailed\"` (default) has ~100 body regions plus close-up parts; `detail=\"simple\"` keeps the original 54 regions with their exact ids (`front-knee-left`, `back-lower-back-right`…) and look, so stored selections keep working.",
      "Detailed ids are kebab-case with the patient's side as a suffix: `eye-left`, `ear-right`, `nose`, `palm-left`, `back-of-knee-right`, `lower-back-left`. Posterior surfaces use `back-of-…` where the front has the same name. `scalp`, `ear-*` and `fingers-*` appear in more than one view and share their selection.",
      "Head & neck: scalp, forehead, temples, eyes, ears, nose, cheeks, mouth, jaw, throat, back of head, nape. Front torso: chest (labelled breast when `sex=\"female\"`), sternum, the nine abdominal regions (epigastric, umbilical, suprapubic, hypochondriac, flank/lumbar and iliac on each side), groin and genital/pelvic area. Back: upper back, mid back, lower back, buttocks. Each limb: shoulder, upper arm, elbow, forearm, wrist, palm / back of hand, fingers; hip, thigh, knee / back of knee, shin / calf, ankle / back of ankle, top of foot, toes, heel and sole.",
      "Close-ups (detailed mode): clicking or pressing Enter on a face, hand or foot region turns and zooms the figure into a close-up with finer parts: eyebrows, upper eyelids, nostrils, upper / lower lip, chin, earlobes; thumb and each finger; and a side view of the foot (top, toes, sole, heel, ankle, Achilles). Space selects the region instead. \"Back to body\" or Escape zooms back out. Set `zoomable={false}` to turn this off.",
      "`getParentRegion(id)` rolls a region up one level (`eyelid-left` → `eye-left` → `front-face`); `getSimpleRegions(id)` returns every simple region it belongs to (midline regions like the sternum straddle two). Selecting a finer part replaces its parent in the selection and vice versa; related regions are shown half-filled with `aria-checked=\"mixed\"`, and simple ids passed to a detailed map highlight their detailed children.",
      "Male and female silhouettes share every region id; `sex` only changes the outline, anatomical hints and the chest label. Use `showSexToggle` for a built-in Male / Female toggle, or control `sex` yourself.",
      "`BODY_REGIONS`, `DETAILED_BODY_REGIONS`, `getBodyRegionLabel(id, { sex })` and `getBodyMapHeatColor(intensity)` are exported for summaries and legends. Geometry lives in `body-map-data.ts` (`getBodyMapScene`, `getBodyRegions`, `hitTestBodyMapScene`) and is shared with Lesion Map.",
      "Animations use the Web Animations API (no extra dependency) and are skipped when the user prefers reduced motion. View changes are announced in a polite live region.",
      "Each region is a `role=\"checkbox\"` with its anatomical label (\"Left ear\", \"Right lower back\"); Enter or Space toggles it. Sides are the patient's: in front-facing views the patient's right is on the viewer's left.",
      "Regions are convex cells clipped to the silhouette at module load, without browser APIs, so the map renders on the server and the regions tile the outline with no gaps.",
    ],
    api: [
      {
        component: "BodyMap",
        description: "Other div props are passed to the root.",
        props: [
          { name: "detail", type: '"detailed" | "simple"', default: '"detailed"', description: "Fine regions with close-ups, or the original 54 regions." },
          { name: "sex", type: '"male" | "female"', description: "Controlled silhouette. Region ids are identical for both." },
          { name: "defaultSex", type: "BodySex", default: '"male"', description: "Initial silhouette when uncontrolled." },
          { name: "onSexChange", type: "(sex: BodySex) => void", description: "Called from the sex toggle." },
          { name: "showSexToggle", type: "boolean", default: "false", description: "Show a Male / Female toggle next to the view toggle." },
          { name: "view", type: '"front" | "back" | "head"', description: "Controlled view. `\"head\"` is the face close-up (detailed mode)." },
          { name: "defaultView", type: "BodyView", default: '"front"', description: "Initial view when uncontrolled." },
          { name: "onViewChange", type: "(view: BodyView) => void", description: "Called when the view changes (including `\"head\"`)." },
          { name: "zoomable", type: "boolean", default: "true", description: "Face, hand and foot regions zoom into close-ups (detailed mode only)." },
          { name: "focusPart", type: '"head" | "hand-left" | "hand-right" | "foot-left" | "foot-right" | null', description: "Controlled close-up; `null` shows the whole body. Hands show the palm from the front view and the back of the hand from the back view." },
          { name: "defaultFocusPart", type: "BodyFocusPart | null", default: "null", description: "Initial close-up when uncontrolled." },
          { name: "onFocusPartChange", type: "(part: BodyFocusPart | null) => void", description: "Called when zooming in or out." },
          { name: "value", type: "string[]", description: "Controlled selected region ids." },
          { name: "defaultValue", type: "string[]", default: "[]", description: "Initial selection when uncontrolled." },
          { name: "onValueChange", type: "(ids: string[]) => void", description: "Called when the selection changes." },
          { name: "multiple", type: "boolean", default: "true", description: "When `false`, a click replaces the selection." },
          { name: "intensity", type: "Record<string, number>", description: "Region id → 0–10. Heat-map coloring; added to labels and aria-labels. Parents show their worst child; close-ups inherit from parents." },
          { name: "showViewToggle", type: "boolean", default: "true", description: "Show the Front / Back (/ Face) toggle." },
          { name: "showLabels", type: "boolean", default: "true", description: "Floating region label on hover and focus." },
          { name: "readOnly", type: "boolean", default: "false", description: "Regions are focusable (and close-ups still open) but cannot be toggled." },
          { name: "disabledRegions", type: "string[]", default: "[]", description: "Regions that cannot be selected; also disables their sub-regions." },
          { name: "className", type: "string", description: "Root defaults to `w-full max-w-[280px]`." },
        ],
      },
      {
        component: "BodyMapSelectionList",
        props: [
          { name: "value", type: "string[]", description: "Region ids to show as chips." },
          { name: "onRemove", type: "(id: string) => void", description: "Shows a remove button on each chip." },
          { name: "intensity", type: "Record<string, number>", description: "Adds “n/10” to each chip." },
          { name: "sex", type: "BodySex", description: "Sex-specific labels (\"Left breast\")." },
          { name: "emptyText", type: "ReactNode", default: '"No areas selected"', description: "Shown when empty." },
        ],
      },
      {
        component: "getParentRegion",
        description: "Exported helpers from `body-map` (geometry lives in `body-map-data.ts`).",
        props: [
          { name: "getParentRegion(id)", type: "string | undefined", description: "One level up: close-up part → detailed region → simple region. `undefined` for simple ids." },
          { name: "getSimpleRegions(id)", type: "string[]", description: "All simple regions a region rolls up to." },
          { name: "getBodyRegionLabel(id, { sex })", type: "string", description: "Label for any region id." },
          { name: "getBodyRegions(view, { sex, detail })", type: "{ id, label }[]", description: "Regions in a view or close-up scene." },
          { name: "getBodyMapScene(id, { sex, detail })", type: "BodyMapScene", description: "Outline path, region paths/polygons and hints for a scene." },
          { name: "hitTestBodyMapScene(scene, [x, y])", type: "string", description: "Region at a viewBox point (finest first, else nearest)." },
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
  // ───────────────────────────── Anatomy (continued) ─────────────────────────────
  {
    name: "dental-chart",
    title: "Dental Chart",
    description:
      "Odontogram for dental charting: permanent, primary or mixed dentition, FDI / Universal / Palmer numbering, 5-surface diagrams, existing vs planned treatment and an ADA-style findings summary.",
    type: "registry:component",
    category: "Anatomy",
    files: [{ path: "components/medicn/dental-chart.tsx", type: "registry:component" }],
    registryDependencies: ["badge", "toggle-group"],
    demos: [
      {
        name: "dental-chart-demo",
        title: "Permanent dentition with paint toolbar",
        description:
          "FDI numbering with existing findings. Pick a tool, choose Existing or Planned, then click a tooth or one of its five surfaces. Clicking the same finding again removes it.",
      },
      {
        name: "dental-chart-arch-demo",
        title: "Arch layout (occlusal view of both jaws)",
        description:
          "`defaultLayout=\"arch\"` with `showLayoutToggle`: teeth sit along the upper and lower jaw arches, each with its occlusal 5-surface diagram (buccal outward, mesial toward the midline). Painting, findings and summary work exactly as in the rows layout.",
      },
      {
        name: "dental-chart-primary-demo",
        title: "Primary dentition, Universal letters",
        description: "`dentition=\"primary\"` with `numbering=\"universal\"` (A–T) and a reduced tool set for a paediatric chart.",
      },
      {
        name: "dental-chart-readonly-demo",
        title: "Read-only with summary",
        description:
          "`readOnly` chart (teeth stay focusable and announce their findings) next to `DentalChartSummary` split into existing work and the treatment plan.",
      },
    ],
    usage: `"use client"

import * as React from "react"
import {
  DentalChart,
  DentalChartLegend,
  DentalChartSummary,
  type DentalChartValue,
} from "@/components/medicn/dental-chart"

export function Odontogram() {
  const [chart, setChart] = React.useState<DentalChartValue>({
    "36": { conditions: [], surfaces: { M: { type: "caries" }, O: { type: "caries" } } },
    "46": { conditions: [{ type: "crown", status: "planned" }] },
  })

  return (
    <div className="flex flex-col gap-4">
      <DentalChart
        value={chart}
        onValueChange={setChart}
        numbering="fdi"
        defaultLayout="arch"
        showLayoutToggle
      />
      <DentalChartLegend />
      <DentalChartSummary value={chart} />
    </div>
  )
}`,
    notes: [
      "Tooth ids are always ISO 3950 / FDI two-digit strings (`\"36\"`, `\"55\"`), whatever `numbering` displays. Use `toothNumber(id, system)` to format and `getToothInfo(id)` for arch, side, type and name.",
      "Universal: permanent 1 (upper right third molar) → 16 (upper left third molar), 17 (lower left third molar) → 32 (lower right third molar); primary A–T in the same order. Palmer is rendered as text with box-drawing angles, e.g. `6┘`, `└6`, `6┐`, `┌6`, primary teeth A–E.",
      "Chart orientation: viewed facing the patient, so the patient's right is on the viewer's left. In each surface diagram the facial (buccal) surface faces the outside of the chart, lingual/palatal faces the occlusal plane, and mesial faces the midline.",
      "Surface keys are `M`, `O`, `D`, `B`, `L`. Incisors and canines display `O` as `I` (incisal) and `B` as `F` (facial). Summaries list surfaces in M-O-D-B-L order, e.g. `36 MO caries`.",
      "`status` separates existing work from the treatment plan. Planned findings are drawn dashed (surfaces as a light fill with a dashed edge). Diagnoses (caries, missing, fracture, watch) are always recorded as existing.",
      "Colours: caries `--clinical-critical`, amalgam `--clinical-info`, composite and crowns `--primary`, sealant `--clinical-normal`, fracture `--clinical-abnormal`, watch `--clinical-watch`.",
      "Keyboard: the chart is one tab stop. Arrow keys move between teeth (Up/Down switch arches), Home/End jump to the ends of a row, Enter/Space activates a tooth, and M, O/I, D, B/F, L/P apply the active tool to that surface. Each tooth is a button whose label reads e.g. “Tooth 36, lower left first molar, caries on occlusal surface”.",
      "`onToothClick(tooth, surface)` fires on every activation before the built-in handling. Use `tool=\"select\"` with `selected`/`onSelectedChange` (keys `\"36\"` and `\"36:O\"`) to drive your own procedure dialog, or `applyDentalTool()` to reuse the paint logic.",
      "`getDentalFindings(value, system)` flattens a chart into ADA-style findings for notes, claims or export; `describeTooth()` returns the accessible description.",
      "Layouts: `\"rows\"` (default) draws straight rows with side-view teeth; `\"arch\"` is an occlusal odontogram, with the upper jaw on top as a U opening downward and the lower jaw beneath opening upward. Teeth follow a catenary arch form, rotated to the curve and sized by type (molars largest, incisors narrow). Gums, palate and tongue are shown as faint shapes behind them. Both layouts share the same state, tools, keyboard model and accessible labels.",
      "Arch layout surfaces: buccal/facial faces out of the arch, lingual/palatal faces the palate or tongue, mesial faces the midline and distal faces away from it. Click a tooth number to activate the whole tooth (e.g. to select it). Crowns are a ring around the crown, implants a fixture circle, root canals the canal orifices, pontics a bar along the arch.",
      "Mixed dentition in the arch layout: the primary teeth form an inner arch inside the permanent one, with their numbers on the lingual side. Arrow keys follow the same row order: Left/Right move along an arch, Up/Down move outer upper → inner upper → inner lower → outer lower.",
      "Rows layout scrolls horizontally on narrow screens (teeth stay 36–40px wide). The arch layout is a single SVG that scales to its container (up to 30rem wide), so it needs no scrolling down to 320px.",
      "This is a charting UI, not a coding service: map findings to CDT / SNOMED CT codes in your own backend.",
    ],
    api: [
      {
        component: "DentalChart",
        description: "Other div props are passed to the root.",
        props: [
          { name: "dentition", type: '"permanent" | "primary" | "mixed"', default: '"permanent"', description: "Which teeth to draw. Mixed shows permanent and primary rows for each arch." },
          { name: "numbering", type: '"fdi" | "universal" | "palmer"', default: '"fdi"', description: "Display numbering. Ids in `value` are always FDI." },
          { name: "value", type: "DentalChartValue", description: "Controlled findings: `Record<ToothId, { conditions; surfaces?; note? }>`." },
          { name: "defaultValue", type: "DentalChartValue", default: "{}", description: "Initial findings when uncontrolled." },
          { name: "onValueChange", type: "(value: DentalChartValue) => void", description: "Called after a tool is applied." },
          { name: "selected", type: "string[]", description: "Controlled selection: tooth ids and `tooth:surface` keys." },
          { name: "defaultSelected", type: "string[]", default: "[]", description: "Initial selection when uncontrolled." },
          { name: "onSelectedChange", type: "(selected: string[]) => void", description: "Called when the Select tool toggles a tooth or surface." },
          { name: "tool", type: "DentalChartTool", description: "Controlled active tool: `select`, `caries`, `amalgam`, `composite`, `sealant`, `crown`, `root-canal`, `implant`, `pontic`, `extraction`, `missing`, `fracture`, `watch`, `erase`." },
          { name: "defaultTool", type: "DentalChartTool", default: '"select"', description: "Initial tool when uncontrolled." },
          { name: "onToolChange", type: "(tool: DentalChartTool) => void", description: "Called when the toolbar changes tool." },
          { name: "status", type: '"existing" | "planned"', description: "Controlled status applied by treatment tools." },
          { name: "defaultStatus", type: "FindingStatus", default: '"existing"', description: "Initial status when uncontrolled." },
          { name: "onStatusChange", type: "(status: FindingStatus) => void", description: "Called when the Existing/Planned toggle changes." },
          { name: "onToothClick", type: "(tooth: ToothId, surface?: Surface) => void", description: "Fires on every tooth or surface activation, before built-in handling." },
          { name: "showToolbar", type: "boolean", default: "!readOnly", description: "Show the tool and status toolbars." },
          { name: "tools", type: "DentalChartTool[]", description: "Restrict the toolbar to these tools." },
          { name: "readOnly", type: "boolean", default: "false", description: "Teeth stay focusable and announce findings but cannot be changed." },
          { name: "caption", type: "ReactNode | null", description: "Replaces the numbering/orientation caption; `null` hides it." },
          { name: "layout", type: '"rows" | "arch"', description: "Controlled layout: straight rows, or teeth arranged along the upper and lower jaw arches (occlusal view)." },
          { name: "defaultLayout", type: '"rows" | "arch"', default: '"rows"', description: "Initial layout when uncontrolled." },
          { name: "onLayoutChange", type: '(layout: "rows" | "arch") => void', description: "Called when the layout toggle changes." },
          { name: "showLayoutToggle", type: "boolean", default: "false", description: "Show a Rows / Arch toggle in the toolbar (also shown when `readOnly`)." },
        ],
      },
      {
        component: "DentalChartLegend",
        props: [
          { name: "items", type: '(DentalChartTool | "planned")[]', description: "Restrict the legend to these entries." },
        ],
      },
      {
        component: "DentalChartSummary",
        props: [
          { name: "value", type: "DentalChartValue", description: "Findings to list, grouped by tooth in chart order." },
          { name: "numbering", type: "NumberingSystem", default: '"fdi"', description: "Numbering used for tooth labels." },
          { name: "status", type: '"existing" | "planned"', description: "Only show findings with this status." },
          { name: "emptyText", type: "ReactNode", default: '"No findings charted"', description: "Shown when there is nothing to list." },
        ],
      },
    ],
    references: [
      {
        label: "ISO 3950:2016 — Designation system for teeth and areas of the oral cavity",
        href: "https://www.iso.org/standard/68292.html",
        description: "The FDI two-digit notation used for tooth ids: quadrants 1–4 permanent, 5–8 primary, positions counted from the midline.",
      },
      {
        label: "FDI World Dental Federation notation",
        href: "https://en.wikipedia.org/wiki/FDI_World_Dental_Federation_notation",
        description: "Overview of quadrant and position numbering with examples.",
      },
      {
        label: "Universal Numbering System (ADA)",
        href: "https://en.wikipedia.org/wiki/Universal_Numbering_System",
        description: "Permanent 1–32 from the upper right third molar; primary A–T. Used by `numbering=\"universal\"`.",
      },
      {
        label: "Palmer notation",
        href: "https://en.wikipedia.org/wiki/Palmer_notation",
        description: "Quadrant angle plus 1–8 (primary A–E), shown by `numbering=\"palmer\"`.",
      },
      {
        label: "FHIR R4 BodyStructure",
        href: "https://hl7.org/fhir/R4/bodystructure.html",
        description: "`location` / `locationQualifier` can carry a tooth and surface when exchanging findings.",
      },
      {
        label: "Open Dental — Chart Module",
        href: "https://www.opendental.com/manual/chart.html",
        description: "A production graphical tooth chart showing existing work and planned treatment.",
      },
    ],
  },
  {
    name: "lesion-map",
    title: "Lesion Map",
    description:
      "Skin lesion and wound documentation map: numbered pins at exact positions on the front/back body, auto-detected region, status-coloured tracking and an editor.",
    type: "registry:component",
    category: "Anatomy",
    files: [{ path: "components/medicn/lesion-map.tsx", type: "registry:component" }],
    dependencies: ["lucide-react"],
    registryDependencies: [
      "button",
      "field",
      "input",
      "select",
      "textarea",
      "toggle-group",
      "medicn:body-map",
      "medicn:clinical-status-badge",
    ],
    demos: [
      {
        name: "lesion-map-demo",
        title: "Front and back with editor",
        description:
          "Both views side by side with five lesions of mixed status. Click the body to add a pin, drag or use arrow keys to move it, and edit the selected lesion in the side panel.",
      },
      {
        name: "lesion-map-readonly-demo",
        title: "Read-only with lesion list",
        description:
          "`LesionList` beside a `readOnly` map sharing `selectedId`. Clicking a row switches to the pin's view and focuses it.",
      },
    ],
    usage: `"use client"

import * as React from "react"
import { LesionList, LesionMap, type Lesion } from "@/components/medicn/lesion-map"

export function SkinCheck() {
  const [lesions, setLesions] = React.useState<Lesion[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  return (
    <div className="flex flex-col gap-6">
      <LesionMap
        value={lesions}
        onValueChange={setLesions}
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
      />
      <LesionList value={lesions} selectedId={selectedId} onSelectedIdChange={setSelectedId} />
    </div>
  )
}`,
    notes: [
      "Pins are placed only on the silhouette: the filled body outline is the click target, and drags or arrow-key nudges that would leave it are ignored (SVG `isPointInFill`).",
      "`x` / `y` are normalised 0–1 coordinates relative to the illustration, not anatomically precise positions. Use them to redraw the pin, not for measurement or registration between visits.",
      "`region` is a body-map region id (e.g. `back-of-forearm-left`, `nose`, `knee-right`), detected by point-in-region against the same geometry as `BodyMap` (finest layer first, falling back to the nearest region). It is re-detected when a pin moves and can be overridden in the editor. Export `detectBodyRegion(view, x, y, { sex, detail })` for server-side use.",
      "`detail` picks the region set used for detection: `\"detailed\"` (default, e.g. \"Left knee\", \"Nose\") or `\"simple\"` (the original 54 ids). Lesions keep whatever region they were saved with; labels resolve for both sets.",
      "`sex` switches between the male and female silhouettes (same region ids; the chest is labelled breast for female).",
      "Status drives the pin ring: changed = clinical-critical, new = clinical-watch, stable = clinical-normal, resolved = muted and dashed. The status is always written out too (legend, list badge, editor, pin `aria-label`).",
      "Pins are numbered by their position in `value`, so keep the array in a stable order (e.g. creation order) to keep numbers consistent between visits.",
      "Keyboard: Tab to a pin, Enter/Space selects, arrow keys nudge (Shift for larger steps), Delete or Backspace removes, Escape deselects.",
      "Store photos and dermoscopy images separately (e.g. FHIR `Media` / `DocumentReference`) and link them by lesion `id`; the component holds no images.",
      "For FHIR, map each lesion to a `BodyStructure` (location + morphology) and record findings over time as `Observation`s whose `focus`/`bodySite` reference it.",
      "Dermatome mode is out of scope: dermatome boundaries vary between individuals and references, and drawing them on this simplified silhouette would be inaccurate.",
    ],
    api: [
      {
        component: "LesionMap",
        description: "Other div props are passed to the root.",
        props: [
          { name: "value", type: "Lesion[]", description: "Controlled lesions." },
          { name: "defaultValue", type: "Lesion[]", default: "[]", description: "Initial lesions when uncontrolled." },
          { name: "onValueChange", type: "(lesions: Lesion[]) => void", description: "Called on add, move, edit and remove." },
          { name: "view", type: '"front" | "back"', description: "Controlled view." },
          { name: "defaultView", type: "BodyView", default: '"front"', description: "Initial view when uncontrolled." },
          { name: "onViewChange", type: "(view: BodyView) => void", description: "Called when the view changes." },
          { name: "selectedId", type: "string | null", description: "Controlled selected lesion id." },
          { name: "defaultSelectedId", type: "string | null", default: "null", description: "Initial selection when uncontrolled." },
          { name: "onSelectedIdChange", type: "(id: string | null) => void", description: "Called when a pin is selected or deselected." },
          { name: "idPrefix", type: "string", default: '"lesion"', description: "New lesions get ids `${idPrefix}-${n}`." },
          { name: "layout", type: '"toggle" | "side-by-side"', default: '"toggle"', description: "One view with a Front/Back toggle, or both views." },
          { name: "readOnly", type: "boolean", default: "false", description: "Pins can be selected but not added, moved, edited or removed." },
          { name: "showEditor", type: "boolean", default: "true", description: "Show `LesionEditor` beside the map for the selected lesion." },
          { name: "showLegend", type: "boolean", default: "true", description: "Status legend under the map." },
          { name: "newLesionDefaults", type: 'Partial<Pick<Lesion, "type" | "status" | "date">>', description: 'Values for new pins (default type "other", status "new").' },
          { name: "renderPin", type: "(props: LesionPinRenderProps) => ReactNode", description: "Custom SVG pin content centred on (0, 0), ~6.5 viewBox units radius. Receives `lesion`, `number`, `selected`, `title`." },
          { name: "sex", type: '"male" | "female"', default: '"male"', description: "Silhouette; region ids are the same for both." },
          { name: "detail", type: '"detailed" | "simple"', default: '"detailed"', description: "Region set used to detect `region` for new or moved pins." },
        ],
      },
      {
        component: "LesionEditor",
        description: "Form for one lesion: label, type, status, region, size, date, colour, notes.",
        props: [
          { name: "lesion", type: "Lesion", description: "Lesion being edited." },
          { name: "number", type: "number", description: "Pin number shown in the heading." },
          { name: "onChange", type: "(lesion: Lesion) => void", description: "Called with the updated lesion on every edit." },
          { name: "onRemove", type: "() => void", description: "Shows a Remove button." },
          { name: "onClose", type: "() => void", description: "Shows a close button." },
          { name: "sex / detail", type: "BodySex / BodyMapDetail", description: "Region labels and the region list offered in the Region select." },
        ],
      },
      {
        component: "LesionList",
        props: [
          { name: "value", type: "Lesion[]", description: "Lesions, numbered in array order." },
          { name: "selectedId", type: "string | null", description: "Highlights the matching row." },
          { name: "onSelectedIdChange", type: "(id: string | null) => void", description: "Row click; share with `LesionMap` to focus the pin." },
          { name: "emptyText", type: "ReactNode", default: '"No lesions recorded"', description: "Shown when empty." },
        ],
      },
      {
        component: "Lesion",
        description: "Record type.",
        props: [
          { name: "id", type: "string", description: "Stable id; link photos to it." },
          { name: "view", type: '"front" | "back"', description: "View the pin is on." },
          { name: "x / y", type: "number", description: "Normalised 0–1 position on the illustration." },
          { name: "region", type: "string", description: "Body-map region id." },
          { name: "type", type: "LesionType", description: "macule, papule, plaque, nodule, vesicle, pustule, ulcer, wound, scar, naevus, other." },
          { name: "status", type: '"new" | "stable" | "changed" | "resolved"', description: "Drives pin tone." },
          { name: "label, sizeMm, colour, notes, date", type: "optional", description: "Free text; `sizeMm` is the largest diameter, `date` any string (ISO recommended)." },
        ],
      },
    ],
    references: [
      {
        label: "FHIR R4 BodyStructure",
        href: "https://hl7.org/fhir/R4/bodystructure.html",
        description: "Each lesion maps to a `BodyStructure` with `location` (region) and `morphology` (type).",
      },
      {
        label: "FHIR R4 Observation",
        href: "https://hl7.org/fhir/R4/observation.html",
        description: "Size, colour and status changes over time are recorded as Observations focused on the lesion.",
      },
      {
        label: "DermEngine",
        href: "https://www.dermengine.com/",
        description: "Dermatology platform with total body mole mapping and lesion tracking.",
      },
      {
        label: "Canfield VECTRA WB360",
        href: "https://www.canfieldsci.com/imaging-systems/vectra-wb360-imaging-system/",
        description: "Whole-body 3D imaging used for mole mapping and lesion change detection.",
      },
      {
        label: "Swift Medical",
        href: "https://swiftmedical.com/",
        description: "Wound care documentation and measurement platform.",
      },
    ],
  },
  // ───────────────────────────── Assessments ─────────────────────────────
  {
    name: "early-warning-score",
    title: "Early Warning Score",
    description:
      "NEWS2 calculator with per-parameter sub-scores, red-score detection, clinical risk band and RCP monitoring/response guidance.",
    type: "registry:component",
    category: "Assessments",
    references: [
      {
        label: "RCP National Early Warning Score (NEWS) 2",
        href: "https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/",
        description: "Scoring bands follow Chart 1, risk bands Chart 2 and the monitoring frequency and actions Chart 4 (RCP, 2017).",
      },
      {
        label: "NEWS2 Chart 1: The NEWS scoring system (PDF)",
        href: "https://www.rcp.ac.uk/media/alxev00t/news2-chart-1_the-news-scoring-system_0_0.pdf",
        description: "Includes SpO₂ Scale 2: 88–92% or ≥93% on air scores 0; on oxygen 93–94 → 1, 95–96 → 2, ≥97 → 3.",
      },
      {
        label: "NEWS2 Chart 4: Clinical response to NEWS trigger thresholds (PDF)",
        href: "https://www.rcp.ac.uk/media/mrllczrj/news2-chart-4_clinical-response-to-news-trigger-thresholds_0.pdf",
      },
      {
        label: "LOINC 115635-5 Early warning score EWS",
        href: "https://loinc.org/115635-5",
        description: "Generic early warning score total (LOINC 2.83). There is no NEWS2-specific LOINC total; record the method (NEWS2) alongside it. Inputs use the vital-sign codes 9279-1, 2708-6, 8480-6, 8867-4 and 8310-5.",
      },
    ],
    files: [{ path: "components/medicn/early-warning-score.tsx", type: "registry:component" }],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "field", "select", "switch", "table", "toggle-group", "medicn:clinical-status-badge", "medicn:vitals-form"],
    demos: [
      { name: "early-warning-score-demo", title: "Editable · medium risk", description: "SpO₂ scale, air/oxygen and ACVPU are editable; the aggregate of 6 hits the key threshold for urgent response." },
      { name: "early-warning-score-red-demo", title: "Single red parameter", description: "New confusion scores 3 on its own, so an aggregate of 3 is still low–medium risk." },
    ],
    usage: `import { EarlyWarningScore, calculateNews2, toNews2Input } from "@/components/medicn/early-warning-score"
import { VitalsForm, type VitalsFormValues } from "@/components/medicn/vitals-form"

const [vitals, setVitals] = React.useState<VitalsFormValues>({})

<VitalsForm hideSubmit onValuesChange={setVitals} />
<EarlyWarningScore vitals={vitals} editable />

// Or score without UI
const result = calculateNews2(toNews2Input(vitals, { supplementalOxygen: false, consciousness: "A" }))`,
    notes: [
      "NEWS2 is validated for adults aged 16 and over. It is not validated for children under 16 or for pregnant women (use a paediatric or obstetric early warning score).",
      "Your local escalation policy wins. The response text reproduces RCP Chart 4 and should be overridden where your trust or hospital protocol differs.",
      "SpO₂ Scale 2 is only for patients with confirmed hypercapnic respiratory failure and a prescribed 88–92% target, decided and documented by a competent clinician. On Scale 2, saturations of 93% or more score 0 on air but 1–3 on oxygen.",
      "Temperature is in °C, matching VitalsForm output. `toNews2Input` maps `heartRate` to `pulse`.",
      "If any parameter is missing the result is incomplete: `total`, `risk` and `response` are null and `missing` lists what is needed. A red score is still flagged on partial data.",
      "A red score (3 in any single parameter) with an aggregate of 0–4 is low–medium risk; aggregates of 5 or more take the medium/high band.",
    ],
    api: [
      {
        component: "EarlyWarningScore",
        props: [
          { name: "values", type: "Partial<News2Input>", description: "NEWS2 input. Overrides matching fields from `vitals`." },
          { name: "vitals", type: "VitalsFormValues", description: "Vitals from VitalsForm (metric, °C). Combined with the assessment fields." },
          { name: "editable", type: "boolean", default: "false", description: "Show controls for SpO₂ scale, air/oxygen and ACVPU consciousness." },
          { name: "defaultExtra", type: "News2Extra", description: "Initial SpO₂ scale, oxygen and consciousness when editable." },
          { name: "onExtraChange", type: "(extra: News2Extra) => void", description: "Called when an editable control changes." },
          { name: "title", type: "ReactNode", default: '"NEWS2"', description: "Card title." },
          { name: "hideBreakdown", type: "boolean", default: "false", description: "Hide the parameter table." },
        ],
      },
      {
        component: "calculateNews2",
        description: "Pure function: `calculateNews2(input: Partial<News2Input>) => News2Result` with `parameters`, `total`, `partialTotal`, `redScore`, `redParameters`, `risk`, `response`, `missing`, `complete`.",
        props: [
          { name: "respiratoryRate", type: "number", description: "Breaths per minute." },
          { name: "spo2", type: "number", description: "Oxygen saturation, %." },
          { name: "spo2Scale", type: "1 | 2", default: "1", description: "Scale 2 only for confirmed hypercapnic respiratory failure." },
          { name: "supplementalOxygen", type: "boolean", description: "On oxygen (scores 2)." },
          { name: "systolic", type: "number", description: "Systolic blood pressure, mmHg." },
          { name: "pulse", type: "number", description: "Beats per minute." },
          { name: "consciousness", type: '"A" | "C" | "V" | "P" | "U"', description: "ACVPU. Anything other than Alert scores 3." },
          { name: "temperature", type: "number", description: "°C." },
        ],
      },
      {
        component: "toNews2Input",
        description: "`toNews2Input(vitals: VitalsFormValues, extra?: News2Extra) => Partial<News2Input>`.",
        props: [],
      },
    ],
  },
  {
    name: "questionnaire",
    title: "Questionnaire",
    description:
      "Scored patient questionnaire with PHQ-9 and GAD-7 built in: radio-group items, live progress, severity bands, and item-level safety flags.",
    type: "registry:component",
    category: "Assessments",
    references: [
      {
        label: "Kroenke K, Spitzer RL, Williams JBW. The PHQ-9 (J Gen Intern Med, 2001)",
        href: "https://doi.org/10.1046/j.1525-1497.2001.016009606.x",
        description: "Validation paper for the PHQ-9 and the 5/10/15/20 severity cutpoints.",
      },
      {
        label: "Spitzer RL et al. The GAD-7 (Arch Intern Med, 2006)",
        href: "https://doi.org/10.1001/archinte.166.10.1092",
        description: "Validation paper for the GAD-7 and the 5/10/15 severity cutpoints.",
      },
      {
        label: "PHQ and GAD-7 screeners",
        href: "https://www.phqscreeners.com/",
        description: "Official Pfizer site with the forms and instructions. The measures are in the public domain, so no permission is needed to reproduce, translate, display or distribute them.",
      },
      {
        label: "FHIR R4 Questionnaire",
        href: "https://hl7.org/fhir/R4/questionnaire.html",
        description: "`QuestionnaireDefinition` maps onto `Questionnaire.item` with coded `answerOption`s.",
      },
      {
        label: "FHIR R4 QuestionnaireResponse",
        href: "https://hl7.org/fhir/R4/questionnaireresponse.html",
        description: "`toFhirQuestionnaireResponse()` returns a minimal resource with LOINC-coded answers and the total score.",
      },
      {
        label: "LOINC 44249-1 · PHQ-9 panel",
        href: "https://loinc.org/44249-1",
        description: "PHQ-9 quick depression assessment panel. Items 44250-9 … 44260-8, total 44261-6, answers LA6568-5 … LA6571-9.",
      },
      {
        label: "LOINC 69737-5 · GAD-7 panel",
        href: "https://loinc.org/69737-5",
        description: "Generalized anxiety disorder 7 item (GAD-7). Total score 70274-6.",
      },
    ],
    files: [{ path: "components/medicn/questionnaire.tsx", type: "registry:component" }],
    dependencies: ["lucide-react"],
    registryDependencies: ["button", "radio-group", "medicn:clinical-status-badge"],
    demos: [
      { name: "questionnaire-demo" },
      {
        name: "questionnaire-gad7-demo",
        title: "GAD-7, stacked",
        description: "`layout=\"stacked\"` shows one block per question at every width. Good for phones and kiosks.",
      },
      {
        name: "questionnaire-score-demo",
        title: "Score summary",
        description: "`QuestionnaireScore` for a completed PHQ-9. Item 9 is positive, so a critical safety flag is shown whatever the total.",
      },
    ],
    usage: `import { PHQ9, Questionnaire } from "@/components/medicn/questionnaire"

<Questionnaire
  definition={PHQ9}
  onSubmit={(response) => save(response)}
  flagMessages={{
    "phq9-9": "Please speak to a member of staff before you leave today.",
  }}
/>`,
    notes: [
      "The PHQ-9 and GAD-7 are screening and severity tools, not diagnoses. A score needs clinical interpretation.",
      "Any positive answer to PHQ-9 item 9 (thoughts of being better off dead or of self-harm) raises a critical flag whatever the total score. It needs same-day clinician follow-up and suicide risk assessment per your local protocol. Do not rely on the UI alone: route flagged responses to a clinician.",
      "`band` stays `null` until every scored item is answered, so a partial total is never shown as a severity.",
      "The follow-up difficulty question is not scored and does not count towards completion.",
      "`hideScore` hides the total and band from patients, but safety flags always show. Pass patient-appropriate wording with `flagMessages`.",
      "Item wording is taken verbatim from the official forms. Do not edit it: changing it invalidates the scores.",
      "Each item is a radiogroup labelled by its question text. In the table layout the answer labels are visually hidden but still read by screen readers. Bands are shown as text, never by colour alone.",
    ],
    api: [
      {
        component: "Questionnaire",
        props: [
          { name: "definition", type: "QuestionnaireDefinition", description: "Items, options, bands and flags. Use `PHQ9`, `GAD7`, or your own." },
          { name: "value", type: "Record<string, number>", description: "Controlled answers, item id → option value." },
          { name: "defaultValue", type: "Record<string, number>", description: "Initial answers when uncontrolled." },
          { name: "onValueChange", type: "(answers: Record<string, number>) => void", description: "Called on every answer change." },
          { name: "onSubmit", type: "(response: QuestionnaireResponse) => void", description: "Called with the scored response on submit." },
          { name: "readOnly", type: "boolean", default: "false", description: "Show answers without allowing changes; hides the submit button." },
          { name: "hideScore", type: "boolean", default: "false", description: "Hide the running total, band and option scores. Flags still show." },
          { name: "layout", type: '"table" | "stacked"', default: "responsive", description: "Answer columns or one block per question. By default it is stacked below `sm` and a table above." },
          { name: "allowPartial", type: "boolean", default: "false", description: "Enable submit before every scored item is answered." },
          { name: "flagMessages", type: "Record<string, ReactNode>", description: "Override flag messages, keyed by item id (e.g. `\"phq9-9\"`)." },
          { name: "submitLabel", type: "string", default: '"Submit"', description: "Submit button text." },
          { name: "hideCitation", type: "boolean", default: "false", description: "Hide the citation and copyright footer." },
        ],
      },
      {
        component: "QuestionnaireScore",
        props: [
          { name: "response", type: "QuestionnaireResponse", description: "Output of `scoreQuestionnaire()`." },
          { name: "title", type: "string", description: "Label before the score, e.g. \"PHQ-9\"." },
          { name: "hideScore", type: "boolean", default: "false", description: "Show only the flags." },
          { name: "flagMessages", type: "Record<string, ReactNode>", description: "Override flag messages by item id." },
        ],
      },
      {
        component: "QuestionnaireDefinition",
        props: [
          { name: "id / title / instructions", type: "string", description: "Instrument id, title and question stem." },
          { name: "options", type: "{ value: number; label: string; code?: Coding }[]", description: "Shared answer options. `value` is the score." },
          { name: "items", type: "{ id: string; text: string; code?: Coding; flag?: QuestionnaireItemFlag }[]", description: "Scored questions." },
          { name: "items[].flag", type: "{ minScore: number; label: string; message: string; status?: ClinicalStatus }", description: "Raise a flag when the item score is ≥ `minScore`, regardless of total. Status defaults to critical." },
          { name: "bands", type: "{ min: number; max: number; label: string; status: ClinicalStatus }[]", description: "Severity bands over the total score." },
          { name: "followUp", type: "{ id: string; text: string; options: QuestionnaireOption[] }", description: "Optional unscored question, e.g. functional difficulty." },
          { name: "code / totalCode", type: "Coding", description: "Panel and total-score codes (LOINC) used for FHIR output." },
          { name: "citation / copyright", type: "string", description: "Shown in the footer." },
        ],
      },
      {
        component: "QuestionnaireResponse",
        props: [
          { name: "answers", type: "Record<string, number>", description: "Answers including the follow-up." },
          { name: "total / maxScore", type: "number", description: "Sum of answered scored items, and the maximum possible." },
          { name: "band", type: "QuestionnaireBand | null", description: "Severity band; `null` until complete." },
          { name: "flags", type: "QuestionnaireFlag[]", description: "Raised item flags with item number, score, label, message and status." },
          { name: "complete", type: "boolean", description: "Every scored item answered." },
          { name: "answeredCount / itemCount", type: "number", description: "Progress." },
        ],
      },
      {
        component: "scoreQuestionnaire / toFhirQuestionnaireResponse",
        description: "Pure helpers.",
        props: [
          { name: "scoreQuestionnaire(definition, answers)", type: "QuestionnaireResponse", description: "Score answers without rendering." },
          { name: "toFhirQuestionnaireResponse(definition, answers, extra?)", type: "FHIR R4 QuestionnaireResponse", description: "LOINC codes as `linkId`s, `valueCoding` answers and the total score. `extra` takes `questionnaire`, `subject` and `authored`." },
        ],
      },
    ],
  },
  {
    name: "glasgow-coma-scale",
    title: "Glasgow Coma Scale",
    description:
      "Structured GCS assessment with eye, verbal and motor radiogroups, not-testable handling, severity band and optional GCS-P.",
    type: "registry:component",
    category: "Assessments",
    references: [
      {
        label: "Glasgow Coma Scale: Do it this way",
        href: "https://www.glasgowcomascale.org/download-aid/",
        description: "Ratings, criteria and the Not testable (NT) option are taken from the official assessment aid (Teasdale, 2015).",
      },
      {
        label: "What is the GCS-P?",
        href: "https://www.glasgowcomascale.org/what-is-gcs-p/",
        description: "GCS-P = GCS − Pupil Reactivity Score (both pupils unreactive 2, one 1, neither 0). Brennan, Murray & Teasdale, J Neurosurg 2018;128:1612–1620.",
      },
      {
        label: "Teasdale G, Jennett B. Assessment of coma and impaired consciousness. Lancet 1974",
        href: "https://doi.org/10.1016/S0140-6736(74)91639-0",
      },
      {
        label: "LOINC 9269-2 Glasgow coma score total",
        href: "https://loinc.org/9269-2",
        description: "Components: 9267-6 eye opening, 9270-0 verbal, 9268-4 motor; panel 35088-4.",
      },
    ],
    files: [{ path: "components/medicn/glasgow-coma-scale.tsx", type: "registry:component" }],
    registryDependencies: ["field", "radio-group", "medicn:clinical-status-badge"],
    demos: [
      { name: "glasgow-coma-scale-demo", title: "With pupils (GCS-P)" },
      {
        name: "glasgow-coma-scale-intubated-demo",
        title: "Intubated",
        description: "Verbal is not testable, so the total is not computed and the score is charted as E3 VT M5.",
      },
    ],
    usage: `import { GlasgowComaScale, formatGcs, type GcsValue } from "@/components/medicn/glasgow-coma-scale"

const [gcs, setGcs] = React.useState<GcsValue>({ eye: null, verbal: null, motor: null })

<GlasgowComaScale value={gcs} onValueChange={setGcs} showPupils />
formatGcs(gcs) // "GCS 13 (E3 V4 M6)"`,
    notes: [
      "Always report the three components, not just the total. When any component is not testable (NT) the total is not computed and the notation uses a T suffix, e.g. “E3 VT M5”.",
      "Severity bands (13–15 mild, 9–12 moderate, 3–8 severe) are the conventional traumatic brain injury classification and are not part of the GCS itself.",
      "GCS-P (Brennan et al. 2018) extends the total with pupil reactivity: subtract 2 if neither pupil reacts to light, 1 if one does not, 0 if both react. Range 1–15. It summarises severity and does not replace reporting each component and the pupils.",
      "Use the paediatric GCS for young children who cannot yet talk; this component implements the adult scale.",
      "Your local escalation policy wins: a fall of 2 or more points, or of 1 in motor, usually needs urgent review.",
    ],
    api: [
      {
        component: "GlasgowComaScale",
        props: [
          { name: "value", type: "GcsValue", description: "Controlled value: `{ eye, verbal, motor, pupils? }`, each a score, `\"NT\"` or `null`." },
          { name: "defaultValue", type: "Partial<GcsValue>", description: "Initial value when uncontrolled." },
          { name: "onValueChange", type: "(value: GcsValue) => void", description: "Called when any component changes." },
          { name: "showPupils", type: "boolean", default: "false", description: "Ask pupil reactivity and show the GCS-P." },
          { name: "showCriteria", type: "boolean", default: "true", description: "Show the criterion under each rating." },
          { name: "disabled", type: "boolean", default: "false", description: "Disable all inputs." },
        ],
      },
      {
        component: "scoreGcs",
        description: "`scoreGcs(value) => { total, notation, severity, notTestable, missing, complete, pupilReactivityScore, gcsP }`. `formatGcs(value)` returns the charting string.",
        props: [],
      },
    ],
  },
  {
    name: "fall-risk-score",
    title: "Fall Risk Score",
    description: "Morse Fall Scale form with live total, configurable risk thresholds and an intervention checklist per risk level.",
    type: "registry:component",
    category: "Assessments",
    references: [
      {
        label: "Morse JM, Morse RM, Tylko SJ. Development of a scale to identify the fall-prone patient. Can J Aging 1989;8(4):366–377",
        href: "https://doi.org/10.1017/S0714980800008576",
        description: "Original six items and weights (0–125).",
      },
      {
        label: "AHRQ Preventing Falls in Hospitals toolkit",
        href: "https://www.ahrq.gov/patient-safety/settings/hospital/fall-prevention/toolkit/index.html",
        description: "Tool 3H covers the Morse Fall Scale and notes that cut-offs should be set per setting.",
      },
      {
        label: "LOINC 59460-6 Fall risk total [Morse Fall Scale]",
        href: "https://loinc.org/59460-6",
        description: "Panel 59453-1; items 59454-9, 59455-6, 59456-4, 59457-2, 59458-0, 59459-8; risk level 59461-4.",
      },
    ],
    files: [{ path: "components/medicn/fall-risk-score.tsx", type: "registry:component" }],
    registryDependencies: ["checkbox", "field", "radio-group", "medicn:clinical-status-badge"],
    demos: [{ name: "fall-risk-score-demo", title: "High risk with interventions" }],
    usage: `import { FallRiskScore } from "@/components/medicn/fall-risk-score"

<FallRiskScore
  thresholds={{ moderate: 25, high: 51 }}
  interventions={{ high: ["Bed exit alarm on", "Supervised toileting"] }}
  onValueChange={(answers) => save(answers)}
/>`,
    notes: [
      "Risk cut-offs vary by institution and setting. Defaults are low 0–24, moderate 25–44, high ≥45; another common set is 0–24 / 25–50 / ≥51. Pass `thresholds` to match local policy, which always wins.",
      "The total is only shown once all six items are answered.",
      "Interventions are shown for the current risk level only. Repeat lower-level items in higher levels if your protocol is cumulative.",
      "The Morse Fall Scale was developed for adult inpatients. It is not validated for children.",
    ],
    api: [
      {
        component: "FallRiskScore",
        props: [
          { name: "value", type: "MorseAnswers", description: "Controlled answers keyed by item (e.g. `{ ambulatoryAid: \"furniture\" }`)." },
          { name: "defaultValue", type: "MorseAnswers", description: "Initial answers when uncontrolled." },
          { name: "onValueChange", type: "(value: MorseAnswers) => void", description: "Called when an answer changes." },
          { name: "thresholds", type: "{ moderate: number; high: number }", default: "{ moderate: 25, high: 45 }", description: "Lowest total for each risk level." },
          { name: "interventions", type: "Partial<Record<\"low\" | \"moderate\" | \"high\", string[]>>", description: "Checklist shown for the current risk level." },
          { name: "completedInterventions", type: "string[]", description: "Controlled checked interventions." },
          { name: "onCompletedInterventionsChange", type: "(completed: string[]) => void", description: "Called when an intervention is checked." },
          { name: "disabled", type: "boolean", default: "false", description: "Disable all inputs." },
        ],
      },
      {
        component: "scoreMorse",
        description: "`scoreMorse(answers, thresholds?) => { items, total, partialTotal, missing, complete, risk }`.",
        props: [],
      },
    ],
  },
  {
    name: "faces-pain-scale",
    title: "Faces Pain Scale",
    description:
      "Paediatric self-report pain scale: six original faces scored 0–10 in steps of 2, with child-friendly labels, colour ramp and radio-group keyboard support.",
    type: "registry:component",
    category: "Assessments",
    references: [
      {
        label: "IASP: Faces Pain Scale – Revised (FPS-R)",
        href: "https://www.iasp-pain.org/resources/faces-pain-scale-revised/",
        description:
          "The validated faces instrument this layout follows (six faces scored 0, 2, 4, 6, 8, 10; validated for ages 4–16). Free for clinical use if unmodified; use in web pages or commercial products needs permission via Mapi Research Trust.",
      },
      {
        label: "Wong-Baker FACES Foundation: licensing",
        href: "https://wongbakerfaces.org/licensing-dashboard/professional-use/",
        description: "Wong-Baker FACES artwork is copyrighted; digital and EHR use requires a license from the foundation.",
      },
      {
        label: "Wong-Baker FACES: instructions for use",
        href: "https://wongbakerfaces.org/instructions-use/",
        description: "How faces scales are administered: the child, not the clinician, chooses the face.",
      },
    ],
    files: [{ path: "components/medicn/faces-pain-scale.tsx", type: "registry:component" }],
    demos: [
      { name: "faces-pain-scale-demo" },
      {
        name: "faces-pain-scale-readonly-demo",
        title: "Read-only",
        description: "`readOnly` shows a recorded score, dims the other faces and ignores input. Here with `size=\"sm\"` and no numbers.",
      },
    ],
    usage: `import { FacesPainScale } from "@/components/medicn/faces-pain-scale"

const [pain, setPain] = React.useState<number | null>(null)

<FacesPainScale value={pain} onValueChange={setPain} />

// Licensed artwork (e.g. FPS-R or Wong-Baker) instead of the built-in faces
<FacesPainScale
  value={pain}
  onValueChange={setPain}
  renderFace={(score, selected) => <img src={\`/faces/\${score}.png\`} alt="" className="size-14" />}
/>`,
    notes: [
      "The built-in faces are original drawings made for medicn. They are not the Wong-Baker FACES or FPS-R artwork, and this component is not a validated instrument.",
      "For a validated scale, license FPS-R (IASP; free for clinical use if unmodified, permission needed for web or commercial use) or Wong-Baker FACES, and pass that artwork through `renderFace`. Use the instrument's own wording in `labels` too.",
      "Scores are 0, 2, 4, 6, 8 and 10, the same 0–10 metric as the numeric Pain Scale, so results can be charted together. Faces scales are typically used from about age 4; older children can use the numeric scale.",
      "Colours follow the same normal → watch → abnormal → critical ramp as Pain Scale. `PainFace` is exported for use in summaries and tables.",
      "Implements the WAI-ARIA radio group pattern: arrow keys, Home and End move and select. In `readOnly` mode the keys only move focus.",
    ],
    api: [
      {
        component: "FacesPainScale",
        description: "Other div props are passed to the radiogroup root.",
        props: [
          { name: "value", type: "number | null", description: "Controlled score (0, 2, 4, 6, 8 or 10)." },
          { name: "defaultValue", type: "number | null", default: "null", description: "Uncontrolled initial score." },
          { name: "onValueChange", type: "(value: number) => void", description: "Called when the child picks a face." },
          { name: "labels", type: "string[]", default: "FACES_PAIN_LABELS", description: "Six descriptors, for scores 0 to 10." },
          { name: "showNumbers", type: "boolean", default: "true", description: "Show the score under each face." },
          { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Face size." },
          { name: "readOnly", type: "boolean", default: "false", description: "Show the selection without allowing changes." },
          { name: "disabled", type: "boolean", default: "false", description: "Disable input." },
          { name: "renderFace", type: "(value: number, selected: boolean) => ReactNode", description: "Replace the built-in faces, e.g. with licensed artwork." },
          { name: "label", type: "string", default: '"How much does it hurt? Faces scale from 0 to 10"', description: "Accessible name of the radio group." },
        ],
      },
      {
        component: "PainFace",
        description: "The built-in face as a standalone SVG. Other svg props are passed through.",
        props: [{ name: "score", type: "number", description: "0–10; rounded to the nearest even face." }],
      },
    ],
  },
  // ───────────────────────────── Charting ─────────────────────────────
  {
    name: "growth-chart",
    title: "Growth Chart",
    description:
      "Paediatric weight- and length-for-age chart with WHO percentile curves (0–24 months), plotted measurements, percentile and z-score tooltips, and flags outside the 3rd–97th percentiles.",
    type: "registry:component",
    category: "Charting",
    references: [
      {
        label: "WHO Child Growth Standards",
        href: "https://www.who.int/tools/child-growth-standards/standards",
        description: "Source of the bundled LMS parameters (weight-for-age and length-for-age, boys and girls, monthly 0–24 months). WHO's own percentile charts draw the 3rd, 15th, 50th, 85th and 97th.",
      },
      {
        label: "CDC (MMWR 2010): Use of WHO growth charts for children aged 0–59 months",
        href: "https://www.cdc.gov/mmwr/preview/mmwrhtml/rr5909a1.htm",
        description: "Recommends the WHO standards for all children under 24 months, with the 2.3rd/97.7th percentiles (±2 SD) as screening cut-offs.",
      },
      {
        label: "FHIR R4 Vital Signs profile",
        href: "https://hl7.org/fhir/R4/observation-vitalsigns.html",
        description: "Measurements map to body weight (LOINC 29463-7) and body length, lying (LOINC 8306-3) Observations.",
      },
      { label: "LOINC 29463-7 Body weight", href: "https://loinc.org/29463-7" },
      { label: "LOINC 8306-3 Body height --lying", href: "https://loinc.org/8306-3" },
    ],
    files: [
      { path: "components/medicn/growth-chart.tsx", type: "registry:component" },
      { path: "components/medicn/growth-chart-data.ts", type: "registry:lib" },
    ],
    dependencies: ["recharts"],
    registryDependencies: ["chart", "table", "medicn:clinical-status-badge"],
    demos: [
      {
        name: "growth-chart-demo",
        description: "Weight-for-age for a girl whose gain slows after 9 months; the 18-month weight falls below the 3rd percentile and is flagged.",
      },
      { name: "growth-chart-length-demo", title: "Length-for-age", description: "A boy tracking steadily along the 60th percentile." },
    ],
    usage: `import { GrowthChart, getGrowthPercentile } from "@/components/medicn/growth-chart"

<GrowthChart
  sex="female"
  measure="weight"
  measurements={[
    { ageMonths: 0, value: 3.3, label: "Birth" },
    { ageMonths: 6, value: 7.1 },
    { ageMonths: 12, value: 7.9 },
  ]}
/>

// Without the chart
getGrowthPercentile({ sex: "male", measure: "length", ageMonths: 12, value: 76.3 })
// → { z: 0.23, percentile: 59.2, lms: { L: 1, M: 75.7488, S: 0.03137 } }`,
    notes: [
      "Reference data are the WHO Child Growth Standards LMS parameters for 0–24 months, transcribed verbatim from WHO's Excel tables (source URLs in `growth-chart-data.ts`). Curves computed from them match WHO's published 3rd–97th percentile tables to 0.1 kg/cm.",
      "Values must be in kg (weight) and cm (recumbent length). Ages are in months and may be fractional; LMS is interpolated linearly between months. Measurements outside the reference age range are reported and not plotted.",
      "For weight, z-scores beyond ±3 use WHO's restricted method (linear extrapolation using the 2–3 SD distance), as in WHO Anthro.",
      "For children 2 years and older, pass a CDC 2000 (or national) LMS table as `reference` (`[ageMonths, L, M, S][]`) with `ageRange` and `referenceLabel`. The x-axis switches to years beyond 36 months.",
      "Points below `lowPercentile` (3rd) or above `highPercentile` (97th) are drawn in the abnormal tone and listed under the chart. CDC recommends the 2.3rd/97.7th (±2 SD) as screening cut-offs with WHO charts; pass those if your protocol follows CDC.",
      "Exported helpers: `lmsZScore`, `lmsZScoreRestricted`, `lmsValueAtZ`, `zToPercentile` (Abramowitz–Stegun normal CDF), `percentileToZ`, `interpolateLms`, `getGrowthPercentile`, `getWhoReference`.",
      "The chart is aria-hidden; a visually hidden table lists each measurement with its percentile and z-score.",
      "A screening aid, not a diagnosis: interpret trends and single measurements in clinical context. Correct for gestational age in preterm infants before plotting.",
    ],
    api: [
      {
        component: "GrowthChart",
        description: "Other div props are passed to the root.",
        props: [
          { name: "sex", type: '"male" | "female"', description: "Selects the WHO boys or girls table." },
          { name: "measure", type: '"weight" | "length"', description: "Weight-for-age or length-for-age." },
          { name: "measurements", type: "{ ageMonths: number; value: number; label?: string }[]", description: "Patient measurements in the reference unit." },
          { name: "percentiles", type: "number[]", default: "[3, 15, 50, 85, 97]", description: "Percentile curves to draw. The one closest to 50 is emphasised." },
          { name: "unit", type: "string", default: '"kg" | "cm"', description: "Unit label." },
          { name: "title", type: "string", default: '"Weight-for-age" | "Length-for-age"', description: "Chart title." },
          { name: "height", type: "number", default: "320", description: "Chart height in px." },
          { name: "reference", type: "[ageMonths, L, M, S][]", description: "Custom LMS table (e.g. CDC 2–20 years). Replaces the WHO data." },
          { name: "referenceLabel", type: "string", description: "Name of the reference shown under the title." },
          { name: "ageRange", type: "[number, number]", description: "Visible age range in months. Defaults to the reference table's range." },
          { name: "lowPercentile", type: "number", default: "3", description: "Flag measurements below this percentile." },
          { name: "highPercentile", type: "number", default: "97", description: "Flag measurements above this percentile." },
        ],
      },
    ],
  },
  {
    name: "fluid-balance",
    title: "Fluid Balance",
    description:
      "Hourly intake and output (I&O) flowsheet with shift subtotals, 24 h totals, running balance and a weight-based urine output check.",
    type: "registry:component",
    category: "Charting",
    references: [
      {
        label: "FHIR R4 Observation",
        href: "https://hl7.org/fhir/R4/observation.html",
        description: "Each entry maps to an `Observation` with `valueQuantity` in mL (UCUM `mL`) and `effectiveDateTime`.",
      },
      {
        label: "LOINC 9187-6 Urine output",
        href: "https://loinc.org/9187-6",
        description:
          "Also used: 9188-4 Urine output 1 hour, 9192-6 Urine output 24 hour, 9000-1 Fluid intake oral Measured, 8975-5 Fluid intake intravascular Measured, 9137-1 Fluid output emesis, 73704-9 Fluid output.nasogastric tube Measured, 9108-2 Fluid intake total 24 hour, 9262-7 Fluid output total 24 hour, 9097-7 Fluid balance 24 hour.",
      },
      {
        label: "KDIGO Clinical Practice Guideline for Acute Kidney Injury (2012)",
        href: "https://kdigo.org/guidelines/acute-kidney-injury/",
        description: "Recommendation 2.1.1: AKI includes urine volume < 0.5 mL/kg/h for 6 hours. Basis for the oliguria flag.",
      },
    ],
    files: [{ path: "components/medicn/fluid-balance.tsx", type: "registry:component" }],
    dependencies: ["date-fns", "lucide-react"],
    registryDependencies: ["button", "dialog", "field", "input", "select", "table", "tooltip", "medicn:clinical-status-badge"],
    demos: [
      {
        name: "fluid-balance-demo",
        title: "24 h flowsheet",
        description:
          "Weight 70 kg, so the oliguria threshold is 35 mL/h. Four hours of low catheter output are flagged, and the running balance turns to watch past +1,000 mL. Add an entry from the header.",
      },
      {
        name: "fluid-balance-form-demo",
        title: "Entry form",
        description: "`FluidEntryForm` on its own. Volume must be a whole number of mL greater than 0, and the time must be inside the period.",
      },
    ],
    usage: `import { FluidBalance, summarizeFluidBalance, type FluidEntry } from "@/components/medicn/fluid-balance"

const entries: FluidEntry[] = [
  { id: "1", time: "2026-10-28T08:15", kind: "intake", category: "oral", volumeMl: 200 },
  { id: "2", time: "2026-10-28T08:58", kind: "output", category: "urine", volumeMl: 60 },
]

<FluidBalance
  entries={entries}
  periodStart="2026-10-28T07:00"
  now="2026-10-28T15:00"
  weightKg={70}
  onAddEntry={(entry) => save({ ...entry, id: crypto.randomUUID() })}
/>

// Same numbers without the UI, e.g. for a handover summary
const { totals, shifts, urine } = summarizeFluidBalance(entries, { periodStart: "2026-10-28T07:00", weightKg: 70 })`,
    notes: [
      "Rows are categories grouped into Intake and Output; columns are the 24 hours from `periodStart`, with a subtotal after each shift (default 3 × 8 h: Day, Evening, Night) and a 24 h total. A date-only `periodStart` starts at `dayStartHour` (default 7).",
      "Net (I − O) and running balance are signed (+ / −). Values beyond ±`balanceWatchMl` (default 1,000 mL) get the watch tone and a warning icon. The 1,000 mL default is not a clinical standard; set it per unit policy.",
      "With `weightKg`, a Urine mL/kg/h row is added. Each urine measurement is spread over the time since the previous one (or the period start), so hourly catheter readings and intermittent voids both work. Hours below `oliguriaThreshold` (default 0.5 mL/kg/h, KDIGO) are flagged; 6 or more consecutive flagged hours show an abnormal badge. This is a prompt to review, not a diagnosis of AKI.",
      "Pass `now` so hours after it are shaded and excluded from the running balance and urine check. Nothing reads the clock during render.",
      "`categories` is configurable. Unknown category ids on entries get their own row so no volume is dropped. Default categories carry LOINC codes where one fits.",
      "The sticky first column and fixed column widths let the grid scroll horizontally on small screens. Cells with a note are underlined and focusable; the note is in a tooltip and in screen-reader text.",
      "`FluidEntryForm` validates time (required, inside `minTime`/`maxTime`), category, and volume (a positive whole number of mL, at most `maxVolumeMl`, default 5,000). `validateFluidVolume` is exported.",
    ],
    api: [
      {
        component: "FluidBalance",
        description: "Other div props are passed to the root element.",
        props: [
          { name: "entries", type: "FluidEntry[]", description: "Intake and output entries. Entries outside the 24 h period are ignored." },
          { name: "periodStart", type: "string", description: 'ISO start of the period, e.g. "2026-10-28T07:00", or a date alone.' },
          { name: "dayStartHour", type: "number", default: "7", description: "Start hour when `periodStart` is a date only." },
          { name: "categories", type: "FluidCategory[]", default: "DEFAULT_FLUID_CATEGORIES", description: "Rows: { id, label, kind, loinc? }." },
          { name: "shifts", type: "{ label: string; hours: number }[]", default: "3 × 8 h", description: "Back-to-back shifts from the period start." },
          { name: "weightKg", type: "number", description: "Enables the urine mL/kg/h row and oliguria flags." },
          { name: "oliguriaThreshold", type: "number", default: "0.5", description: "mL/kg/h below which an hour is flagged (KDIGO)." },
          { name: "balanceWatchMl", type: "number", default: "1000", description: "Running balance beyond ± this gets the watch tone." },
          { name: "now", type: "string | Date", description: "Hours ending after it are shaded and excluded from checks." },
          { name: "title", type: "ReactNode", default: '"Intake & output"', description: "Heading." },
          { name: "onAddEntry", type: "(entry: NewFluidEntry) => void", description: "Shows an Add entry button with a form dialog." },
          { name: "hideEmptyCategories", type: "boolean", default: "false", description: "Hide category rows with no entries." },
        ],
      },
      {
        component: "FluidEntry",
        props: [
          { name: "id", type: "string", description: "Unique id." },
          { name: "time", type: "string", description: "ISO date-time of the measurement." },
          { name: "kind", type: '"intake" | "output"', description: "Side of the balance." },
          { name: "category", type: "string", description: 'Category id, e.g. "oral", "iv", "enteral", "blood", "urine", "drain", "emesis", "stool", "ng-aspirate".' },
          { name: "volumeMl", type: "number", description: "Volume in mL." },
          { name: "note", type: "string", description: "Shown in a tooltip on the cell." },
        ],
      },
      {
        component: "FluidEntryForm",
        description: "Extends the native form props.",
        props: [
          { name: "onSubmit", type: "(entry: NewFluidEntry) => void", description: "Called with a valid entry (no id)." },
          { name: "defaultValue", type: "Partial<NewFluidEntry>", description: "Initial time, kind, category, volume or note." },
          { name: "categories", type: "FluidCategory[]", default: "DEFAULT_FLUID_CATEGORIES", description: "Options, filtered by kind." },
          { name: "minTime / maxTime", type: "string", description: '"yyyy-MM-ddTHH:mm" bounds for the time.' },
          { name: "maxVolumeMl", type: "number", default: "5000", description: "Largest single entry accepted." },
          { name: "onCancel", type: "() => void", description: "Shows a Cancel button." },
          { name: "submitLabel", type: "string", default: '"Add entry"', description: "Submit button text." },
          { name: "resetOnSubmit", type: "boolean", default: "true", description: "Clear volume and note after submit." },
        ],
      },
      {
        component: "summarizeFluidBalance",
        description: "Pure helper used by the component: summarizeFluidBalance(entries, options) → FluidBalanceSummary.",
        props: [
          { name: "options", type: "{ periodStart, dayStartHour?, categories?, shifts?, weightKg?, oliguriaThreshold?, balanceWatchMl?, now? }", description: "Same meaning as the component props." },
          { name: "returns", type: "FluidBalanceSummary", description: "hours, intakeRows/outputRows (hourly cells), hourlyIntake/Output/Net, runningBalance + runningTone, shifts (intake, output, net, byCategory), totals, balanceTone, urine (rate, oliguric, longestOliguricRun, meetsKdigoCriterion)." },
        ],
      },
    ],
  },
  {
    name: "medication-administration-record",
    title: "Medication Administration Record",
    description:
      "eMAR grid of medication orders by day and scheduled time, with given, held, refused, missed, due and overdue status, PRN doses, high-alert flags and a documentation dialog.",
    type: "registry:component",
    category: "Charting",
    references: [
      {
        label: "FHIR R4 MedicationAdministration",
        href: "https://hl7.org/fhir/R4/medicationadministration.html",
        description:
          "Each documented dose is a `MedicationAdministration`: given → `completed`; held, refused and missed → `not-done` with `statusReason`. Due, overdue and not due come from the order's timing and have no resource.",
      },
      {
        label: "FHIR R4 MedicationAdministration status codes",
        href: "https://hl7.org/fhir/R4/valueset-medication-admin-status.html",
        description: "in-progress, not-done, on-hold, completed, entered-in-error, stopped, unknown.",
      },
      {
        label: "ISMP Acute Care Guidelines for Timely Administration of Scheduled Medications (2011)",
        href: "https://www.ismp.org/sites/default/files/attachments/2018-02/tasm.pdf",
        description:
          "Table 1: time-critical medications within 30 minutes; scheduled more often than daily (up to every 4 hours) within 1 hour; daily, weekly or monthly within 2 hours, before or after the scheduled time. PRN doses are excluded.",
      },
      {
        label: "ISMP list of high-alert medications in acute care settings",
        href: "https://home.ecri.org/blogs/ismp-resources/high-alert-medications-in-acute-care-settings",
        description: "Basis for the high-alert flag and the double-check prompt (e.g. insulin, anticoagulants, opioids).",
      },
    ],
    files: [{ path: "components/medicn/medication-administration-record.tsx", type: "registry:component" }],
    dependencies: ["date-fns", "lucide-react"],
    registryDependencies: [
      "button",
      "dialog",
      "field",
      "input",
      "select",
      "table",
      "tooltip",
      "medicn:clinical-status-badge",
      "medicn:medication-list",
    ],
    demos: [
      {
        name: "medication-administration-record-demo",
        title: "3-day MAR",
        description:
          "`now` is fixed at Oct 29, 10:30. Metoprolol 08:00 is overdue, ceftriaxone 12:00 (2 h window) is due, and insulin lispro is high-alert and time-critical (30 min window), so yesterday's 12:42 dose shows as late. Click a due or overdue cell, or Record on the PRN row, to document a dose.",
      },
    ],
    usage: `import {
  AdministrationDialog,
  MedicationAdministrationRecord,
  type AdministrationRecord,
  type MarOrder,
  type MarSlot,
} from "@/components/medicn/medication-administration-record"

const orders: MarOrder[] = [
  { id: "lispro", name: "Insulin lispro", dose: "6 units", route: "Subcutaneous", scheduleTimes: ["08:00", "12:00", "18:00"], highAlert: true, timeCritical: true },
  { id: "apap", name: "Acetaminophen", dose: "650 mg", route: "Oral", prn: true, indication: "pain" },
]

const [records, setRecords] = useState<AdministrationRecord[]>([])
const [slot, setSlot] = useState<MarSlot | null>(null)

<MedicationAdministrationRecord
  orders={orders}
  administrations={records}
  startDate="2026-10-28"
  days={3}
  now={now}
  onRecord={setSlot}
/>
<AdministrationDialog
  open={slot !== null}
  onOpenChange={(open) => !open && setSlot(null)}
  order={orders.find((o) => o.id === slot?.orderId)}
  scheduledTime={slot?.scheduledTime}
  defaultTime={now}
  onSubmit={(record) => setRecords((prev) => [...prev, { ...record, id: crypto.randomUUID() }])}
/>`,
    notes: [
      "Rows are orders (`MarOrder` extends `Medication` from medication-list with `dose`, `scheduleTimes`, `timeCritical`, `windowMinutes`, `orderStart`/`orderStop`). Columns are days (1–7 from `startDate`) × the scheduled times used by any order.",
      "Every status shows an icon and a text label as well as a colour: Given (time · initials, plus \"late\"/\"early\" outside the window), Held and Refused (reason), Missed, Overdue (how late), Due (window), Not due.",
      "`getAdministrationStatus({ scheduledTime, record, now, windowMinutes })` is pure. A record wins; otherwise a slot is due from `windowMinutes` before to `windowMinutes` after the scheduled time, overdue after that, and not due before. Without `now` nothing is derived from the clock.",
      "Default window is 60 minutes (ISMP: medications given more often than daily). `timeCritical` orders use 30 minutes; set `windowMinutes: 120` for daily, weekly or monthly medications. `ISMP_TIMELY_WINDOWS` and `getAdministrationWindow(order)` are exported.",
      "PRN orders have no scheduled slots; each day shows the PRN doses given (time · initials, dose and reason in a tooltip) and a Record button.",
      "High-alert orders get a labelled badge, and the dialog shows a double-check reminder with an optional second initials field. The component does not enforce a double check; follow local policy.",
      "Due and overdue cells are buttons that call `onRecord({ orderId, scheduledTime })`. `AdministrationDialog` documents given (time, dose given, initials), held or refused (reason required). Initials must be 2–4 letters.",
      "`ADMINISTRATION_FHIR_STATUS` maps documented statuses to FHIR `MedicationAdministration.status`.",
      "The medication column is sticky and the grid scrolls horizontally. Today's column is shaded when `now` is set.",
    ],
    api: [
      {
        component: "MedicationAdministrationRecord",
        description: "Other div props are passed to the root element.",
        props: [
          { name: "orders", type: "MarOrder[]", description: "Medication orders (rows)." },
          { name: "administrations", type: "AdministrationRecord[]", default: "[]", description: "Documented doses: { id, orderId, scheduledTime?, status, time?, dose?, reason?, initials?, witnessInitials? }." },
          { name: "startDate", type: "string", description: 'First day, "yyyy-MM-dd".' },
          { name: "days", type: "number", default: "3", description: "Days shown, 1–7." },
          { name: "now", type: "string | Date", description: "Current time for due/overdue. Pass it so server and client match." },
          { name: "windowMinutes", type: "number", default: "60", description: "Window before/after the scheduled time for orders that are not time-critical." },
          { name: "onRecord", type: "(slot: { orderId: string; scheduledTime?: string }) => void", description: "Called from a due/overdue cell or a PRN Record button." },
          { name: "title", type: "ReactNode", default: '"Medication administration record"', description: "Heading." },
          { name: "hideLegend", type: "boolean", default: "false", description: "Hide the legend." },
        ],
      },
      {
        component: "MarOrder",
        description: "Extends `Medication` (id, name, strength, route, frequency, prn, indication, highAlert).",
        props: [
          { name: "dose", type: "string", description: 'Dose per administration, e.g. "6 units". Pre-fills the dialog.' },
          { name: "scheduleTimes", type: "string[]", description: '"HH:mm" times, e.g. ["08:00", "20:00"].' },
          { name: "timeCritical", type: "boolean", description: "Use the 30 minute ISMP window." },
          { name: "windowMinutes", type: "number", description: "Window override for this order." },
          { name: "orderStart / orderStop", type: "string", description: "ISO bounds; slots outside are blank." },
        ],
      },
      {
        component: "AdministrationDialog",
        props: [
          { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", description: "Controlled dialog." },
          { name: "order", type: "MarOrder", description: "Order being documented." },
          { name: "scheduledTime", type: "string", description: "Slot being documented; omit for a PRN dose." },
          { name: "defaultTime", type: "string", description: 'Initial time, "yyyy-MM-ddTHH:mm".' },
          { name: "defaultInitials", type: "string", description: "Pre-filled initials." },
          { name: "onSubmit", type: "(record: NewAdministrationRecord) => void", description: "Called with a valid record; the dialog then closes." },
        ],
      },
      {
        component: "getAdministrationStatus",
        description: "Pure helper.",
        props: [
          { name: "args", type: "{ scheduledTime: string | Date; record?; now?: string | Date; windowMinutes?: number }", description: "Slot, its record if any, current time and window (default 60)." },
          { name: "returns", type: "{ status; minutesFromScheduled?; timing?: \"early\" | \"on-time\" | \"late\" }", description: "Status is given | held | refused | missed | overdue | due | not-due." },
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
    registryDependencies: ["button", "card", "dialog", "field", "tabs", "textarea", "medicn:allergy-list", "medicn:clinical-timeline", "medicn:early-warning-score", "medicn:lab-results", "medicn:medication-form", "medicn:medication-list", "medicn:patient-header", "medicn:problem-list", "medicn:vital-signs", "medicn:vitals-chart", "medicn:vitals-form"],
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

export const categoryOrder: RegistryCategory[] = [
  "Scheduling",
  "Anatomy",
  "Forms",
  "Assessments",
  "Charting",
  "Clinical data",
  "Patient",
  "Blocks",
]
