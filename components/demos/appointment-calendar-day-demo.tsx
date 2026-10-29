"use client"

import {
  AppointmentCalendar,
  type Appointment,
  type CalendarProvider,
} from "@/components/medicn/appointment-calendar"

const providers: CalendarProvider[] = [
  { id: "patel", name: "Dr. Anika Patel", specialty: "Family medicine" },
  { id: "chen", name: "Dr. Michael Chen", specialty: "Internal medicine" },
  { id: "lopez", name: "Dr. Sofia Lopez", specialty: "Pediatrics" },
]

const d = (hour: number, minute = 0) => new Date(2026, 10, 4, hour, minute)

const appointments: Appointment[] = [
  { id: "p1", title: "Daniel Novak", type: "Follow-up", start: d(8, 30), end: d(9), status: "completed", providerId: "patel", location: "Room 2" },
  { id: "p2", title: "Priya Shah", type: "New patient", start: d(9), end: d(10), status: "completed", providerId: "patel", location: "Room 1" },
  { id: "p3", title: "Walter Hughes", type: "Lab review", start: d(10, 30), end: d(11), status: "in-progress", providerId: "patel", location: "Room 2" },
  { id: "p4", title: "Nina Petrova", type: "Annual physical", start: d(13), end: d(14), status: "confirmed", providerId: "patel", location: "Room 3" },
  { id: "c1", title: "Thomas Reed", type: "Lab review", start: d(9, 30), end: d(10), status: "completed", providerId: "chen", location: "Room 4" },
  { id: "c2", title: "Linda Okafor", type: "Follow-up", start: d(10), end: d(10, 30), status: "no-show", providerId: "chen", location: "Room 4" },
  { id: "c3", title: "Marcus Bell", type: "New patient", start: d(10, 45), end: d(11, 45), status: "checked-in", providerId: "chen", location: "Room 5" },
  { id: "c4", title: "Ruth Adler", type: "Telehealth", start: d(11), end: d(11, 30), status: "confirmed", telehealth: true, providerId: "chen" },
  { id: "c5", title: "Kevin Murphy", type: "Follow-up", start: d(15), end: d(15, 30), status: "cancelled", providerId: "chen" },
  { id: "l1", title: "Ava Johnson", type: "Well-child visit", start: d(8), end: d(8, 45), status: "completed", providerId: "lopez", location: "Peds 1" },
  { id: "l2", title: "Noah Williams", type: "Telehealth", start: d(9, 15), end: d(9, 45), status: "completed", telehealth: true, providerId: "lopez" },
  { id: "l3", title: "Mia Torres", type: "Vaccination", start: d(11, 30), end: d(11, 45), status: "scheduled", providerId: "lopez", location: "Peds 2" },
  { id: "l4", title: "Lucas Brown", type: "New patient", start: d(14), end: d(15), status: "scheduled", providerId: "lopez", location: "Peds 1" },
]

export default function AppointmentCalendarDayDemo() {
  return (
    <AppointmentCalendar
      appointments={appointments}
      providers={providers}
      defaultView="day"
      defaultDate={new Date(2026, 10, 4)}
      now={new Date(2026, 10, 4, 11, 20)}
      startHour={8}
      endHour={17}
      slotMinutes={15}
      onSlotClick={(slot) => console.log("Book", slot)}
      onAppointmentClick={(appt) => console.log("Open", appt)}
    />
  )
}
