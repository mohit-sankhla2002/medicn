"use client"

import * as React from "react"
import { format } from "date-fns"

import {
  AppointmentCalendar,
  AppointmentStatusBadge,
  type Appointment,
} from "@/components/medicn/appointment-calendar"

const d = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute)

const appointments: Appointment[] = [
  { id: "1", title: "Maria Gonzalez", type: "Follow-up", start: d(2, 8, 30), end: d(2, 9), status: "completed", providerId: "patel", location: "Room 2" },
  { id: "2", title: "James Whitaker", type: "New patient", start: d(2, 9, 30), end: d(2, 10, 30), status: "completed", providerId: "patel", location: "Room 1" },
  { id: "3", title: "Aisha Rahman", type: "Telehealth", start: d(2, 13), end: d(2, 13, 30), status: "no-show", telehealth: true, providerId: "chen" },
  { id: "4", title: "Robert Kim", type: "Annual physical", start: d(3, 9), end: d(3, 10), status: "completed", providerId: "patel", location: "Room 3" },
  { id: "5", title: "Linda Okafor", type: "Lab review", start: d(3, 9, 30), end: d(3, 10), status: "cancelled", providerId: "chen" },
  { id: "6", title: "Daniel Novak", type: "Follow-up", start: d(4, 9), end: d(4, 9, 30), status: "completed", providerId: "patel", location: "Room 2" },
  { id: "7", title: "Priya Shah", type: "New patient", start: d(4, 10, 30), end: d(4, 11, 30), status: "in-progress", providerId: "patel", location: "Room 1" },
  { id: "8", title: "Thomas Reed", type: "Lab review", start: d(4, 11), end: d(4, 11, 30), status: "checked-in", providerId: "chen", location: "Room 4" },
  { id: "9", title: "Emily Carter", type: "Telehealth", start: d(4, 11, 15), end: d(4, 11, 45), status: "confirmed", telehealth: true, providerId: "lopez" },
  { id: "10", title: "Grace Liu", type: "Annual physical", start: d(5, 14), end: d(5, 15), status: "confirmed", providerId: "patel", location: "Room 3" },
  { id: "11", title: "Samuel Brooks", type: "Follow-up", start: d(5, 15, 30), end: d(5, 16), status: "scheduled", providerId: "chen", location: "Room 2" },
  { id: "12", title: "Hannah Weiss", type: "Telehealth", start: d(6, 8), end: d(6, 8, 30), status: "scheduled", telehealth: true, providerId: "lopez" },
  { id: "13", title: "Oliver Grant", type: "New patient", start: d(6, 16), end: d(6, 17), status: "confirmed", providerId: "patel", location: "Room 1" },
]

export default function AppointmentCalendarDemo() {
  const [selected, setSelected] = React.useState<Appointment | null>(null)
  const [slot, setSlot] = React.useState<Date | null>(null)

  return (
    <div className="flex w-full flex-col gap-3">
      <AppointmentCalendar
        appointments={appointments}
        defaultView="week"
        defaultDate={new Date(2026, 10, 2)}
        now={new Date(2026, 10, 4, 11, 20)}
        startHour={8}
        endHour={18}
        onAppointmentClick={(appt) => {
          setSelected(appt)
          setSlot(null)
        }}
        onSlotClick={({ start }) => {
          setSlot(start)
          setSelected(null)
        }}
      />
      <div className="flex min-h-6 flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {selected ? (
          <>
            <span className="font-medium text-foreground">{selected.title}</span>
            <span>· {selected.type}</span>
            {selected.status && <AppointmentStatusBadge status={selected.status} />}
          </>
        ) : slot ? (
          <span>
            New appointment at{" "}
            <span className="font-medium text-foreground">
              {format(slot, "EEE, MMM d 'at' h:mm a")}
            </span>
          </span>
        ) : (
          "Select an appointment or an empty slot."
        )}
      </div>
    </div>
  )
}
