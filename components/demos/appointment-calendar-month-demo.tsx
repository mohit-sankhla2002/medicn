"use client"

import {
  AppointmentCalendar,
  type Appointment,
  type AppointmentStatus,
} from "@/components/medicn/appointment-calendar"

const patients = [
  "Maria Gonzalez", "James Whitaker", "Aisha Rahman", "Robert Kim",
  "Linda Okafor", "Daniel Novak", "Priya Shah", "Thomas Reed",
  "Emily Carter", "Grace Liu", "Samuel Brooks", "Hannah Weiss",
]
const types = ["Follow-up", "New patient", "Telehealth", "Lab review", "Annual physical"]
const statuses: AppointmentStatus[] = [
  "completed", "completed", "confirmed", "scheduled", "cancelled", "no-show", "confirmed",
]

// Deterministic sample data (no Math.random) so server and client match.
const appointments: Appointment[] = []
for (let day = 2; day <= 27; day++) {
  const date = new Date(2026, 10, day)
  if (date.getDay() === 0 || date.getDay() === 6) continue
  const count = ((day * 7) % 5) + 1
  for (let i = 0; i < count; i++) {
    const n = day * 3 + i
    const type = types[n % types.length]
    const hour = 8 + ((i * 2 + day) % 9)
    appointments.push({
      id: `m-${day}-${i}`,
      title: patients[n % patients.length],
      type,
      telehealth: type === "Telehealth",
      start: new Date(2026, 10, day, hour, i % 2 ? 30 : 0),
      end: new Date(2026, 10, day, hour, i % 2 ? 60 : 30),
      status: day < 4 ? "completed" : statuses[n % statuses.length],
    })
  }
}
appointments.sort((a, b) => a.start.getTime() - b.start.getTime())

export default function AppointmentCalendarMonthDemo() {
  return (
    <AppointmentCalendar
      appointments={appointments}
      defaultView="month"
      defaultDate={new Date(2026, 10, 1)}
      now={new Date(2026, 10, 4, 11, 20)}
    />
  )
}
