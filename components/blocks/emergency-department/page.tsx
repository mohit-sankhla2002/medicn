"use client"

import * as React from "react"
import {
  Activity,
  AlertCircle,
  Bed,
  CheckCircle2,
  Clock,
  Filter,
  FlaskConical,
  Plus,
  RefreshCw,
  Scan,
  Search,
  Siren,
  Timer,
  User,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"
import { ESI_LEVELS, type EsiLevel } from "@/components/medicn/triage-assessment"

export interface EdPatient {
  id: string
  bed: string
  zone: "resuscitation" | "acute" | "fast-track" | "waiting"
  name: string
  age: number
  sex: "M" | "F"
  mrn: string
  esiLevel: EsiLevel
  chiefComplaint: string
  timeInDept: string
  attending: string
  nurse: string
  status: "Waiting" | "In Exam" | "Workup Pending" | "Admit Pending" | "Discharged"
  ordersCount: { labs: number; imaging: number }
}

const initialEdPatients: EdPatient[] = [
  {
    id: "ed-1",
    bed: "Trauma Bay 1",
    zone: "resuscitation",
    name: "Arthur Dent",
    age: 54,
    sex: "M",
    mrn: "ED-8901",
    esiLevel: 1,
    chiefComplaint: "Acute STEMI, severe substernal chest pain, diaphoresis",
    timeInDept: "0h 18m",
    attending: "Dr. House",
    nurse: "S. Jenkins, RN",
    status: "In Exam",
    ordersCount: { labs: 4, imaging: 2 },
  },
  {
    id: "ed-2",
    bed: "Bed 01",
    zone: "acute",
    name: "Eleanor Vance",
    age: 68,
    sex: "F",
    mrn: "ED-8902",
    esiLevel: 2,
    chiefComplaint: "Acute abdominal pain with rebound tenderness",
    timeInDept: "1h 12m",
    attending: "Dr. House",
    nurse: "M. Taylor, RN",
    status: "Workup Pending",
    ordersCount: { labs: 3, imaging: 1 },
  },
  {
    id: "ed-3",
    bed: "Bed 04",
    zone: "acute",
    name: "Robert Davis",
    age: 42,
    sex: "M",
    mrn: "ED-8903",
    esiLevel: 3,
    chiefComplaint: "Right flank pain radiating to groin, suspected renal colic",
    timeInDept: "1h 45m",
    attending: "Dr. Cuddy",
    nurse: "M. Taylor, RN",
    status: "Workup Pending",
    ordersCount: { labs: 2, imaging: 1 },
  },
  {
    id: "ed-4",
    bed: "Fast Track 2",
    zone: "fast-track",
    name: "Chloe Miller",
    age: 26,
    sex: "F",
    mrn: "ED-8904",
    esiLevel: 4,
    chiefComplaint: "Left forearm laceration from broken glass, active bleeding stopped",
    timeInDept: "0h 40m",
    attending: "Dr. Chase",
    nurse: "K. Adams, RN",
    status: "Waiting",
    ordersCount: { labs: 0, imaging: 1 },
  },
  {
    id: "ed-5",
    bed: "Waiting Room 4",
    zone: "waiting",
    name: "James Wilson",
    age: 38,
    sex: "M",
    mrn: "ED-8905",
    esiLevel: 5,
    chiefComplaint: "Medication refill request and routine blood pressure re-check",
    timeInDept: "0h 25m",
    attending: "Triage Team",
    nurse: "R. Davis, RN",
    status: "Waiting",
    ordersCount: { labs: 0, imaging: 0 },
  },
]

export default function EmergencyDepartmentPage() {
  const [patients, setPatients] = React.useState<EdPatient[]>(initialEdPatients)
  const [search, setSearch] = React.useState("")
  const [zoneFilter, setZoneFilter] = React.useState<string>("all")

  const filtered = React.useMemo(() => {
    return patients.filter((p) => {
      const matchesZone = zoneFilter === "all" || p.zone === zoneFilter
      const q = search.trim().toLowerCase()
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.chiefComplaint.toLowerCase().includes(q) ||
        p.bed.toLowerCase().includes(q)
      return matchesZone && matchesQuery
    })
  }, [patients, zoneFilter, search])

  const census = patients.length
  const inExamCount = patients.filter((p) => p.status === "In Exam" || p.status === "Workup Pending").length
  const waitingCount = patients.filter((p) => p.status === "Waiting").length

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/10 p-4 md:p-8 space-y-6">
      {/* Top command bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive shadow-xs">
            <Siren className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Emergency Department Tracking Board
            </h1>
            <p className="text-xs text-muted-foreground">
              St. Jude Regional Trauma Center · Real-Time ED Command & Bed Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-1.5 size-3.5" /> Refresh Board
          </Button>
          <Button size="sm" className="h-8 text-xs bg-destructive text-white hover:bg-destructive/90">
            <Plus className="mr-1.5 size-3.5" /> Quick Triage Arrival
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Total Census
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{census}</div>
            <p className="text-[11px] text-muted-foreground">Capacity: 28 Beds (85% occupied)</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              In Treatment
            </CardTitle>
            <Activity className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{inExamCount}</div>
            <p className="text-[11px] text-muted-foreground">Active physician & nursing care</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Waiting for Bed
            </CardTitle>
            <Clock className="size-4 text-clinical-watch" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-clinical-watch">{waitingCount}</div>
            <p className="text-[11px] text-muted-foreground">Average wait: 24 minutes</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Average LOS
            </CardTitle>
            <Timer className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">2h 14m</div>
            <p className="text-[11px] text-clinical-normal font-medium">Within 4-hour target standard</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tracking Board Table */}
      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
        {/* Table Controls */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between bg-muted/20">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients or complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={zoneFilter === "all" ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setZoneFilter("all")}
            >
              All Zones
            </Button>
            <Button
              size="sm"
              variant={zoneFilter === "resuscitation" ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs text-destructive"
              onClick={() => setZoneFilter("resuscitation")}
            >
              Resuscitation
            </Button>
            <Button
              size="sm"
              variant={zoneFilter === "acute" ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setZoneFilter("acute")}
            >
              Acute (Beds 1-12)
            </Button>
            <Button
              size="sm"
              variant={zoneFilter === "fast-track" ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setZoneFilter("fast-track")}
            >
              Fast Track
            </Button>
            <Button
              size="sm"
              variant={zoneFilter === "waiting" ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setZoneFilter("waiting")}
            >
              Waiting Room
            </Button>
          </div>
        </div>

        {/* Board rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Bed / Location</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Acuity</th>
                <th className="px-4 py-3">Chief Complaint</th>
                <th className="px-4 py-3">Care Team</th>
                <th className="px-4 py-3">LOS</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((patient) => {
                const esi = ESI_LEVELS[patient.esiLevel]

                return (
                  <tr key={patient.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Bed className="size-3.5 text-muted-foreground" />
                        <span>{patient.bed}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-foreground text-sm leading-tight block">
                          {patient.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {patient.age}y {patient.sex} · {patient.mrn}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", esi.colorClass)}>
                        ESI {patient.esiLevel}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-foreground font-medium">{patient.chiefComplaint}</p>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-[11px]">
                        <p className="font-medium text-foreground">{patient.attending}</p>
                        <p className="text-muted-foreground text-[10px]">{patient.nurse}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                      {patient.timeInDept}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[11px]">
                        {patient.ordersCount.labs > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                            <FlaskConical className="size-2.5" /> {patient.ordersCount.labs}
                          </span>
                        )}
                        {patient.ordersCount.imaging > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                            <Scan className="size-2.5" /> {patient.ordersCount.imaging}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <ClinicalStatusBadge
                        status={
                          patient.status === "In Exam"
                            ? "normal"
                            : patient.status === "Workup Pending"
                              ? "watch"
                              : "unknown"
                        }
                      >
                        {patient.status}
                      </ClinicalStatusBadge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
