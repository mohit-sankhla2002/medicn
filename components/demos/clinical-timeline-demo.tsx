"use client"

import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ClinicalTimeline, type TimelineEvent } from "@/components/medicn/clinical-timeline"

const timelineEvents: TimelineEvent[] = [
  {
    id: "e1",
    type: "message",
    title: "Message from patient: refill question",
    date: "2026-10-27T08:42:00",
    description: "Asked whether metformin can be taken at night instead of with breakfast.",
    author: "Amelia Hart",
    tags: ["Portal"],
  },
  {
    id: "e2",
    type: "lab",
    title: "Hemoglobin A1c",
    date: "2026-10-24T07:15:00",
    description: "8.1 % (reference 4.0–5.6 %). Up from 7.4 % in July.",
    author: "Quest Diagnostics",
    status: "abnormal",
    statusLabel: "High",
    href: "#lab-a1c",
  },
  {
    id: "e3",
    type: "lab",
    title: "Basic metabolic panel",
    date: "2026-10-24T07:15:00",
    description: "All values within reference range. eGFR 78 mL/min/1.73m².",
    author: "Quest Diagnostics",
    status: "normal",
    href: "#lab-bmp",
  },
  {
    id: "e4",
    type: "encounter",
    title: "Office visit — diabetes follow-up",
    date: "2026-10-20T10:30:00",
    description: "Discussed rising A1c. Plan: start metformin, repeat labs in 3 months.",
    author: "Dr. Priya Patel",
    location: "Riverside Family Medicine",
    tags: ["Follow-up"],
    href: "#visit-1020",
  },
  {
    id: "e5",
    type: "medication",
    title: "Metformin 500 mg started",
    date: "2026-10-20T10:58:00",
    description: "Take 1 tablet by mouth twice daily with food.",
    author: "Dr. Priya Patel",
    status: "info",
    statusLabel: "New",
  },
  {
    id: "e6",
    type: "vitals",
    title: "Vital signs",
    date: "2026-10-20T10:12:00",
    description: "BP 142/88 · HR 76 · SpO₂ 98% · BMI 31.2",
    author: "Jordan Lee, MA",
    status: "watch",
    statusLabel: "BP elevated",
  },
  {
    id: "e7",
    type: "immunization",
    title: "Influenza vaccine (quadrivalent)",
    date: "2026-10-03T14:05:00",
    description: "0.5 mL intramuscular, left deltoid. Lot FL2291.",
    author: "Sam Rivera, RN",
    location: "Riverside Family Medicine",
  },
  {
    id: "e8",
    type: "imaging",
    title: "Chest X-ray, 2 views",
    date: "2026-09-18T16:20:00",
    description: "No acute cardiopulmonary process.",
    author: "Dr. Elena Novak (Radiology)",
    location: "Mercy Imaging Center",
    status: "normal",
    href: "#imaging-cxr",
  },
  {
    id: "e9",
    type: "encounter",
    title: "Urgent care visit — cough",
    date: "2026-09-18T15:40:00",
    description: "10 days of productive cough. Chest X-ray ordered.",
    author: "Dr. Marcus Chen",
    location: "Mercy Urgent Care",
  },
  {
    id: "e10",
    type: "note",
    title: "Telephone encounter",
    date: "2026-09-02T11:00:00",
    description: "Patient reports home BP readings averaging 138/86.",
    author: "Sam Rivera, RN",
  },
  {
    id: "e11",
    type: "lab",
    title: "Lipid panel",
    date: "2026-08-14T07:30:00",
    description: "LDL 162 mg/dL (reference < 100 mg/dL).",
    author: "Quest Diagnostics",
    status: "abnormal",
    statusLabel: "High",
  },
  {
    id: "e12",
    type: "lab",
    title: "Potassium",
    date: "2026-08-14T07:30:00",
    description: "6.4 mmol/L — called to provider, repeat sample not hemolyzed.",
    author: "Quest Diagnostics",
    status: "critical",
  },
  {
    id: "e13",
    type: "document",
    title: "Outside records received",
    date: "2026-08-05",
    description: "Cardiology consult note from Lakeside Heart Clinic.",
    tags: ["Scanned"],
  },
  {
    id: "e14",
    type: "encounter",
    title: "Annual wellness visit",
    date: "2026-08-04T09:00:00",
    author: "Dr. Priya Patel",
    location: "Riverside Family Medicine",
    tags: ["Preventive"],
  },
]

export default function ClinicalTimelineDemo() {
  return (
    <ClinicalTimeline
      className="w-full max-w-2xl"
      events={timelineEvents}
      renderActions={(event) => (
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${event.title}`}>
          <MoreHorizontal />
        </Button>
      )}
    />
  )
}
