"use client"

import * as React from "react"

import {
  AppointmentSlotPicker,
  type TimeSlot,
} from "@/components/medicn/appointment-slot-picker"

const BOOKED = new Set(["9:30", "11:0", "14:30", "16:0", "17:30"])

// Deterministic availability: weekdays 8:30 AM – 6:30 PM, 30-minute slots,
// lunch break at noon, and no availability on Fridays after 3 PM.
function getSlots(date: Date): TimeSlot[] {
  const day = date.getDay()
  if (day === 0 || day === 6) return []
  const slots: TimeSlot[] = []
  for (let minutes = 8 * 60 + 30; minutes < 18 * 60 + 30; minutes += 30) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    if (hour === 12) continue
    if (day === 5 && hour >= 15) continue
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute)
    const key = `${hour}:${minute}`
    const available = !BOOKED.has(key) && (date.getDate() + hour) % 7 !== 0
    slots.push({ start, end: new Date(start.getTime() + 30 * 60000), available })
  }
  return slots
}

const today = new Date(2026, 10, 2)

export default function AppointmentSlotPickerDemo() {
  const [value, setValue] = React.useState<Date | null>(null)

  return (
    <AppointmentSlotPicker
      className="max-w-3xl"
      getSlots={getSlots}
      defaultDate={new Date(2026, 10, 4)}
      value={value}
      onValueChange={setValue}
      disabledDates={(date) =>
        date < today || date.getDay() === 0 || date.getDay() === 6
      }
      today={today}
      timeZoneLabel="Eastern Time (ET)"
    />
  )
}
