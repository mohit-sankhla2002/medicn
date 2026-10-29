"use client"

import * as React from "react"

import {
  AdministrationDialog,
  MedicationAdministrationRecord,
  type AdministrationRecord,
  type MarOrder,
  type MarSlot,
} from "@/components/medicn/medication-administration-record"

const NOW = "2026-10-29T10:30"

const orders: MarOrder[] = [
  {
    id: "lispro",
    name: "Insulin lispro",
    strength: "100 units/mL",
    dose: "6 units",
    route: "Subcutaneous",
    frequency: "Three times daily with meals",
    scheduleTimes: ["08:00", "12:00", "18:00"],
    highAlert: true,
    timeCritical: true,
  },
  {
    id: "metoprolol",
    name: "Metoprolol tartrate",
    strength: "25 mg",
    dose: "25 mg",
    route: "Oral",
    frequency: "Twice daily",
    scheduleTimes: ["08:00", "20:00"],
  },
  {
    id: "furosemide",
    name: "Furosemide",
    strength: "10 mg/mL",
    dose: "40 mg",
    route: "IV",
    frequency: "Twice daily",
    scheduleTimes: ["08:00", "18:00"],
  },
  {
    id: "ceftriaxone",
    name: "Ceftriaxone",
    strength: "1 g",
    dose: "1 g",
    route: "IV",
    frequency: "Every 24 hours",
    scheduleTimes: ["12:00"],
    windowMinutes: 120,
  },
  {
    id: "enoxaparin",
    name: "Enoxaparin",
    strength: "40 mg/0.4 mL",
    dose: "40 mg",
    route: "Subcutaneous",
    frequency: "Once daily",
    scheduleTimes: ["22:00"],
    highAlert: true,
    windowMinutes: 120,
  },
  {
    id: "acetaminophen",
    name: "Acetaminophen",
    strength: "325 mg",
    dose: "650 mg",
    route: "Oral",
    prn: true,
    indication: "pain or fever",
  },
]

const initialRecords: AdministrationRecord[] = [
  { id: "1", orderId: "lispro", scheduledTime: "2026-10-28T08:00", status: "given", time: "2026-10-28T08:05", dose: "6 units", initials: "AB", witnessInitials: "CK" },
  { id: "2", orderId: "lispro", scheduledTime: "2026-10-28T12:00", status: "given", time: "2026-10-28T12:42", dose: "6 units", initials: "AB", witnessInitials: "CK" },
  { id: "3", orderId: "lispro", scheduledTime: "2026-10-28T18:00", status: "given", time: "2026-10-28T17:55", dose: "6 units", initials: "RM", witnessInitials: "JT" },
  { id: "4", orderId: "metoprolol", scheduledTime: "2026-10-28T08:00", status: "given", time: "2026-10-28T08:20", dose: "25 mg", initials: "AB" },
  { id: "5", orderId: "metoprolol", scheduledTime: "2026-10-28T20:00", status: "held", time: "2026-10-28T20:05", reason: "Heart rate 52", initials: "RM" },
  { id: "6", orderId: "furosemide", scheduledTime: "2026-10-28T08:00", status: "given", time: "2026-10-28T08:15", dose: "40 mg", initials: "AB" },
  { id: "7", orderId: "furosemide", scheduledTime: "2026-10-28T18:00", status: "missed", time: "2026-10-28T19:30", reason: "Off unit for CT", initials: "RM" },
  { id: "8", orderId: "ceftriaxone", scheduledTime: "2026-10-28T12:00", status: "given", time: "2026-10-28T12:10", dose: "1 g", initials: "AB" },
  { id: "9", orderId: "enoxaparin", scheduledTime: "2026-10-28T22:00", status: "refused", time: "2026-10-28T22:10", reason: "Declined, wants to speak to physician", initials: "RM" },
  { id: "10", orderId: "acetaminophen", status: "given", time: "2026-10-28T14:10", dose: "650 mg", reason: "Pain 6/10", initials: "AB" },
  { id: "11", orderId: "acetaminophen", status: "given", time: "2026-10-28T22:30", dose: "650 mg", reason: "Temp 38.4 °C", initials: "RM" },
  { id: "12", orderId: "acetaminophen", status: "given", time: "2026-10-29T06:15", dose: "650 mg", reason: "Pain 5/10", initials: "JT" },
  { id: "13", orderId: "lispro", scheduledTime: "2026-10-29T08:00", status: "given", time: "2026-10-29T08:10", dose: "6 units", initials: "SL", witnessInitials: "PW" },
  { id: "14", orderId: "furosemide", scheduledTime: "2026-10-29T08:00", status: "held", time: "2026-10-29T08:05", reason: "Systolic BP 88", initials: "SL" },
]

export default function MedicationAdministrationRecordDemo() {
  const [records, setRecords] = React.useState(initialRecords)
  const [slot, setSlot] = React.useState<MarSlot | null>(null)
  const nextId = React.useRef(100)
  const order = orders.find((o) => o.id === slot?.orderId)

  return (
    <>
      <MedicationAdministrationRecord
        className="w-full"
        orders={orders}
        administrations={records}
        startDate="2026-10-28"
        days={3}
        now={NOW}
        onRecord={setSlot}
      />
      <AdministrationDialog
        open={slot !== null}
        onOpenChange={(open) => !open && setSlot(null)}
        order={order}
        scheduledTime={slot?.scheduledTime}
        defaultTime={NOW}
        defaultInitials="SL"
        onSubmit={(record) => setRecords((prev) => [...prev, { ...record, id: String(nextId.current++) }])}
      />
    </>
  )
}
