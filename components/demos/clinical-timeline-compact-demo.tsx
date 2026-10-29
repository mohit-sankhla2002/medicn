import { ClinicalTimeline, type TimelineEvent } from "@/components/medicn/clinical-timeline"

const events: TimelineEvent[] = [
  { id: "1", type: "encounter", title: "Office visit — hypertension", date: "2026-10-20T10:30:00", author: "Dr. Priya Patel" },
  { id: "2", type: "lab", title: "Hemoglobin A1c 8.1 %", date: "2026-10-24T07:15:00", status: "abnormal", statusLabel: "High" },
  { id: "3", type: "medication", title: "Lisinopril 10 mg started", date: "2026-10-20T10:58:00" },
  { id: "4", type: "immunization", title: "Influenza vaccine", date: "2026-10-03T14:05:00" },
  { id: "5", type: "imaging", title: "Chest X-ray", date: "2026-09-18T16:20:00", status: "normal" },
  { id: "6", type: "message", title: "Portal message: appointment request", date: "2026-09-10T08:00:00" },
  { id: "7", type: "lab", title: "Lipid panel", date: "2026-08-14T07:30:00", status: "abnormal", statusLabel: "High LDL" },
  { id: "8", type: "encounter", title: "Annual wellness visit", date: "2026-08-04T09:00:00" },
  { id: "9", type: "procedure", title: "Colonoscopy", date: "2026-07-22", status: "normal" },
]

export default function ClinicalTimelineCompactDemo() {
  return <ClinicalTimeline className="w-full max-w-xl" events={events} groupBy="month" searchable={false} pageSize={5} />
}
