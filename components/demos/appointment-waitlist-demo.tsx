"use client"

import * as React from "react"
import { AppointmentWaitlist, type WaitlistEntry } from "@/components/medicn/appointment-waitlist"

const initialEntries: WaitlistEntry[] = [
  { id: "request-1", patientName: "Alex Morgan", service: "Follow-up · 30 minutes", provider: "Dr. Chen", preferences: "Weekdays after 14:00 · Downtown clinic", requestedAt: "Requested Nov 3", status: "waiting" },
  { id: "request-2", patientName: "Jamie Patel", service: "New patient · 45 minutes", preferences: "Any provider · Morning appointments", status: "offered", offeredSlot: "Nov 6 · 09:00–09:45 IST", offerExpiresAt: "Nov 5 at 18:00 IST" },
]

export default function AppointmentWaitlistDemo() {
  const [entries, setEntries] = React.useState(initialEntries)
  const update = (id: string, patch: Partial<WaitlistEntry>) => setEntries((previous) => previous.map((entry) => entry.id === id ? { ...entry, ...patch } : entry))
  return <div className="w-full max-w-xl"><AppointmentWaitlist entries={entries} description="Match requests with available appointments." onOffer={(entry) => update(entry.id, { status: "offered", offeredSlot: "Nov 6 · 14:30–15:00 IST", offerExpiresAt: "Nov 5 at 18:00 IST" })} onBook={(entry) => update(entry.id, { status: "booked" })} onCancel={(entry) => update(entry.id, { status: "cancelled" })} /></div>
}
