"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Bell,
  CalendarDays,
  ChevronsUpDown,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Stethoscope,
  Timer,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  AppointmentCalendar,
  AppointmentStatusBadge,
  type Appointment,
  type CalendarProvider,
} from "@/components/medicn/appointment-calendar"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

// Replace the sample data below with your scheduling and results APIs.
const TODAY = new Date(2026, 10, 4)
const NOW = new Date(2026, 10, 4, 10, 40)
const at = (h: number, m = 0) => new Date(2026, 10, 4, h, m)

const providers: CalendarProvider[] = [
  { id: "patel", name: "Dr. Priya Patel", specialty: "Family medicine" },
  { id: "okafor", name: "Dr. Chidi Okafor", specialty: "Cardiology" },
  { id: "lindqvist", name: "Dr. Sara Lindqvist", specialty: "Pediatrics" },
]

const appointments: Appointment[] = [
  {
    id: "a1",
    title: "Amelia Hart",
    type: "Follow-up",
    start: at(8),
    end: at(8, 30),
    status: "completed",
    providerId: "patel",
  },
  {
    id: "a2",
    title: "Rahul Mehta",
    type: "Lab review",
    start: at(8, 45),
    end: at(9, 15),
    status: "completed",
    providerId: "okafor",
  },
  {
    id: "a3",
    title: "Noah Kim",
    type: "Well-child",
    start: at(9),
    end: at(9, 45),
    status: "completed",
    providerId: "lindqvist",
  },
  {
    id: "a4",
    title: "Grace Liu",
    type: "Annual physical",
    start: at(9, 30),
    end: at(10, 30),
    status: "in-progress",
    providerId: "patel",
  },
  {
    id: "a5",
    title: "Mateo Garcia",
    type: "Echo review",
    start: at(10),
    end: at(10, 45),
    status: "in-progress",
    providerId: "okafor",
  },
  {
    id: "a6",
    title: "Fatima Noor",
    type: "Telehealth",
    start: at(10, 45),
    end: at(11, 15),
    status: "checked-in",
    providerId: "patel",
    telehealth: true,
  },
  {
    id: "a7",
    title: "Leo Rossi",
    type: "Vaccination",
    start: at(11),
    end: at(11, 15),
    status: "checked-in",
    providerId: "lindqvist",
  },
  {
    id: "a8",
    title: "Hannah Becker",
    type: "New patient",
    start: at(11, 15),
    end: at(12),
    status: "confirmed",
    providerId: "okafor",
  },
  {
    id: "a9",
    title: "Owen Brooks",
    type: "Follow-up",
    start: at(13),
    end: at(13, 30),
    status: "confirmed",
    providerId: "patel",
  },
  {
    id: "a10",
    title: "Isla Murphy",
    type: "Sick visit",
    start: at(13, 30),
    end: at(14),
    status: "scheduled",
    providerId: "lindqvist",
  },
  {
    id: "a11",
    title: "Daniel Cohen",
    type: "Stress test",
    start: at(14),
    end: at(15),
    status: "scheduled",
    providerId: "okafor",
  },
  {
    id: "a12",
    title: "Mia Novak",
    type: "Follow-up",
    start: at(8, 15),
    end: at(8, 45),
    status: "no-show",
    providerId: "lindqvist",
  },
  {
    id: "a13",
    title: "Ethan Walsh",
    type: "Telehealth",
    start: at(15),
    end: at(15, 30),
    status: "cancelled",
    providerId: "patel",
    telehealth: true,
  },
]

const waitingRoom: { name: string; reason: string; waited: string; triage: ClinicalStatus; triageLabel: string }[] = [
  { name: "Fatima Noor", reason: "Shortness of breath", waited: "18 min", triage: "abnormal", triageLabel: "Urgent" },
  { name: "Leo Rossi", reason: "Routine vaccination", waited: "6 min", triage: "normal", triageLabel: "Routine" },
  { name: "Hannah Becker", reason: "Palpitations", waited: "2 min", triage: "watch", triageLabel: "Semi-urgent" },
]

const results: { patient: string; test: string; value: string; status: ClinicalStatus; time: string }[] = [
  { patient: "Rahul Mehta", test: "Potassium", value: "6.1 mmol/L", status: "critical", time: "09:58" },
  { patient: "Grace Liu", test: "HbA1c", value: "6.8 %", status: "abnormal", time: "09:31" },
  { patient: "Amelia Hart", test: "TSH", value: "4.6 mIU/L", status: "watch", time: "08:47" },
  { patient: "Noah Kim", test: "Hemoglobin", value: "12.9 g/dL", status: "normal", time: "08:12" },
]

const nav = [
  { title: "Dashboard", icon: LayoutDashboard, active: true },
  { title: "Schedule", icon: CalendarDays, badge: "24" },
  { title: "Patients", icon: Users },
  { title: "Inbox", icon: MessageSquare, badge: "5" },
  { title: "Results", icon: FlaskConical, badge: "1" },
  { title: "Orders", icon: ClipboardList },
]

function ClinicSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Stethoscope className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Riverside Clinic</span>
                <span className="truncate text-xs text-muted-foreground">Outpatient · Main St</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clinic</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton isActive={item.active} tooltip={item.title}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">PP</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Dr. Priya Patel</span>
                <span className="truncate text-xs text-muted-foreground">Family medicine</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

const stats = [
  { label: "Appointments today", value: "24", hint: "3 remaining this hour", icon: CalendarDays },
  { label: "Checked in", value: "7", hint: "2 in rooms", icon: Users },
  { label: "Avg. wait", value: "9 min", hint: "−4 min vs. last week", icon: Timer },
  { label: "Results to review", value: "5", hint: "1 critical", icon: FlaskConical },
]

export default function ClinicDashboardPage() {
  const [selected, setSelected] = React.useState<Appointment | null>(appointments[5])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <ClinicSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4" />
            <h1 className="text-sm font-medium">Today · Wed, Nov 4</h1>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search patients, MRN…" className="w-64 pl-8" />
              </div>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell />
              </Button>
              <Button>
                <Plus /> New appointment
              </Button>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} size="sm">
                  <CardHeader>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
                    <CardAction>
                      <stat.icon className="size-4 text-muted-foreground" />
                    </CardAction>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">{stat.hint}</CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>All providers · click an appointment to preview</CardDescription>
                </CardHeader>
                <CardContent>
                  <AppointmentCalendar
                    appointments={appointments}
                    providers={providers}
                    defaultView="day"
                    defaultDate={TODAY}
                    now={NOW}
                    startHour={8}
                    endHour={16}
                    slotMinutes={15}
                    hourHeight={88}
                    maxHeight={520}
                    onAppointmentClick={setSelected}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                {selected && (
                  <Card size="sm">
                    <CardHeader>
                      <CardDescription>Selected appointment</CardDescription>
                      <CardTitle>{selected.title}</CardTitle>
                      <CardAction>
                        <AppointmentStatusBadge status={selected.status ?? "scheduled"} />
                      </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 text-sm">
                      <p className="text-muted-foreground">
                        {selected.type} · {format(selected.start, "h:mm a")} with{" "}
                        {providers.find((p) => p.id === selected.providerId)?.name}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          Open chart
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Reschedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Waiting room</CardTitle>
                    <CardDescription>{waitingRoom.length} patients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col divide-y">
                      {waitingRoom.map((p) => (
                        <li key={p.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {p.reason} · {p.waited}
                            </p>
                          </div>
                          <ClinicalStatusBadge status={p.triage}>{p.triageLabel}</ClinicalStatusBadge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card size="sm">
                  <CardHeader>
                    <CardTitle>New results</CardTitle>
                    <CardDescription>Since 07:00</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col divide-y">
                      {results.map((r) => (
                        <li key={r.patient + r.test} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {r.test} <span className="font-normal text-muted-foreground">· {r.patient}</span>
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {r.value} · {r.time}
                            </p>
                          </div>
                          <ClinicalStatusBadge status={r.status} />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
