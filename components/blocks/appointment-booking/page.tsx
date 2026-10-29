"use client"

import * as React from "react"
import { format } from "date-fns"
import { ArrowLeft, CalendarCheck2, CheckCircle2, Clock, MapPin, Stethoscope, Video } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { AppointmentSlotPicker, type TimeSlot } from "@/components/medicn/appointment-slot-picker"

const visitTypes = [
  { id: "in-person", title: "In-person visit", description: "Exam room at Riverside Clinic", minutes: 30, icon: Stethoscope },
  { id: "telehealth", title: "Video visit", description: "From your phone or computer", minutes: 20, icon: Video },
]

// Replace with your availability API.
function getSlots(date: Date): TimeSlot[] {
  const day = date.getDay()
  if (day === 0 || day === 6) return []
  const slots: TimeSlot[] = []
  for (let minutes = 8 * 60; minutes < 17 * 60; minutes += 30) {
    const hour = Math.floor(minutes / 60)
    if (hour === 12) continue
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minutes % 60)
    slots.push({ start, available: (date.getDate() * 3 + minutes / 30) % 5 !== 0 })
  }
  return slots
}

const TODAY = new Date(2026, 10, 2)
const steps = ["Visit", "Time", "Details"] as const

export default function AppointmentBookingPage() {
  const [step, setStep] = React.useState(0)
  const [visitType, setVisitType] = React.useState("in-person")
  const [slot, setSlot] = React.useState<Date | null>(null)
  const [done, setDone] = React.useState(false)
  const visit = visitTypes.find((v) => v.id === visitType)!

  if (done && slot) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="items-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-clinical-normal/10 text-clinical-normal-foreground">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle className="text-xl">You&apos;re booked</CardTitle>
            <CardDescription>A confirmation was sent to your email.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="font-medium">{format(slot, "EEEE, MMMM d · h:mm a")}</p>
            <p className="text-muted-foreground">
              {visit.title} with Dr. Priya Patel · {visit.minutes} min
            </p>
          </CardContent>
          <CardFooter className="justify-center gap-2">
            <Button variant="outline" onClick={() => { setDone(false); setStep(0); setSlot(null) }}>
              Book another
            </Button>
            <Button>
              <CalendarCheck2 /> Add to calendar
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-muted/40 p-4 sm:p-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">PP</div>
            <div>
              <p className="font-semibold">Dr. Priya Patel</p>
              <p className="text-sm text-muted-foreground">Family medicine</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Clock className="size-4" /> {visit.minutes} minutes
            </li>
            <li className="flex items-center gap-2">
              {visitType === "telehealth" ? <Video className="size-4" /> : <MapPin className="size-4" />}
              {visit.description}
            </li>
            {slot && (
              <li className="flex items-center gap-2 font-medium text-foreground">
                <CalendarCheck2 className="size-4" /> {format(slot, "EEE, MMM d · h:mm a")}
              </li>
            )}
          </ul>
          <ol className="mt-2 hidden flex-col gap-1 lg:flex" aria-label="Booking steps">
            {steps.map((label, i) => (
              <li
                key={label}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm",
                  i === step ? "bg-background font-medium shadow-xs" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border text-[11px] tabular-nums",
                    i < step && "border-primary bg-primary text-primary-foreground"
                  )}
                >
                  {i + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </aside>

        <Card className="min-w-0">
          <CardHeader>
            <p className="text-xs font-medium text-muted-foreground lg:hidden">
              Step {step + 1} of {steps.length}
            </p>
            <CardTitle className="text-xl">
              {step === 0 ? "What kind of visit?" : step === 1 ? "Pick a time" : "Your details"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <RadioGroup value={visitType} onValueChange={setVisitType} className="grid gap-3 sm:grid-cols-2">
                {visitTypes.map((v) => (
                  <FieldLabel key={v.id} htmlFor={`visit-${v.id}`}>
                    <Field orientation="horizontal">
                      <v.icon className="size-5 text-primary" />
                      <div className="flex flex-1 flex-col gap-0.5">
                        <span className="font-medium">{v.title}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          {v.description} · {v.minutes} min
                        </span>
                      </div>
                      <RadioGroupItem value={v.id} id={`visit-${v.id}`} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            )}

            {step === 1 && (
              <AppointmentSlotPicker
                getSlots={getSlots}
                defaultDate={new Date(2026, 10, 4)}
                today={TODAY}
                value={slot}
                onValueChange={setSlot}
                disabledDates={(d) => d < TODAY || d.getDay() === 0 || d.getDay() === 6}
                timeZoneLabel="Eastern Time (ET)"
              />
            )}

            {step === 2 && (
              <form
                id="booking-details"
                onSubmit={(e) => {
                  e.preventDefault()
                  setDone(true)
                }}
              >
                <FieldGroup className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="first-name">First name</FieldLabel>
                    <Input id="first-name" autoComplete="given-name" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                    <Input id="last-name" autoComplete="family-name" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
                    <Input id="dob" type="date" autoComplete="bday" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Mobile phone</FieldLabel>
                    <Input id="phone" type="tel" autoComplete="tel" required />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" autoComplete="email" required />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="reason">Reason for visit</FieldLabel>
                    <Textarea id="reason" placeholder="Briefly describe your symptoms or what you'd like to discuss" />
                    <FieldDescription>Don&apos;t use this form for emergencies — call your local emergency number.</FieldDescription>
                  </Field>
                  <Field orientation="horizontal" className="sm:col-span-2">
                    <Checkbox id="consent" required />
                    <FieldLabel htmlFor="consent" className="font-normal">
                      I agree to receive appointment reminders by text message.
                    </FieldLabel>
                  </Field>
                </FieldGroup>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-between border-t">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft /> Back
            </Button>
            {step < 2 ? (
              <Button disabled={step === 1 && !slot} onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="submit" form="booking-details">
                Confirm booking
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
