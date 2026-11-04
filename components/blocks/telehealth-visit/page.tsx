"use client"

import * as React from "react"
import {
  Activity,
  AlertCircle,
  Camera,
  CameraOff,
  Check,
  Clock,
  FileText,
  Lock,
  Mic,
  MicOff,
  PhoneOff,
  Pill,
  ScreenShare,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Video,
  VideoOff,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"
import { ClinicalNote, type NoteSection } from "@/components/medicn/clinical-note"
import { PrescriptionPad } from "@/components/medicn/prescription-pad"
import { OrderEntry, type OrderCatalogItem } from "@/components/medicn/order-entry"

const telehealthCatalog: OrderCatalogItem[] = [
  { name: "Complete Blood Count (CBC)", code: "58410-2", category: "lab", description: "Standard hematology panel" },
  { name: "Comprehensive Metabolic Panel (CMP)", code: "24323-8", category: "lab", description: "14 core chem tests" },
  { name: "Lipid Panel", code: "57698-3", category: "lab", description: "Fasting lipid profile" },
  { name: "Chest X-Ray 2 Views", code: "71046", category: "imaging", description: "PA & Lateral" },
  { name: "Dermatology Outpatient Referral", category: "referral", description: "Evaluation of atypical lesion" },
]

export default function TelehealthVisitPage() {
  const [micMuted, setMicMuted] = React.useState(false)
  const [videoOff, setVideoOff] = React.useState(false)
  const [callDuration, setCallDuration] = React.useState("14:32")

  const patient = {
    name: "Grace Liu",
    age: 54,
    sex: "Female",
    mrn: "330-417-92",
    dateOfBirth: "Feb 9, 1972",
    allergies: ["Penicillin", "Latex"],
  }

  const prescriber = {
    name: "Dr. Priya Patel, MD",
    title: "Family Medicine & Telehealth Specialist",
    clinic: "Virtual Care Regional Network",
    npi: "1940182741",
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/10">
      {/* Telehealth Top Navigation Banner */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Video className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              Virtual Care Telehealth Consultation
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-clinical-normal animate-pulse" />
              Live HIPAA Encrypted WebRTC Session · HD Audio/Video
            </p>
          </div>
        </div>

        {/* Patient quick badge */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="font-semibold text-foreground">{patient.name}</span>
            <p className="text-[11px] text-muted-foreground font-mono">
              {patient.age}y {patient.sex} · MRN {patient.mrn}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 font-mono text-xs font-semibold">
            <Clock className="size-3 text-primary" />
            <span>{callDuration}</span>
          </div>

          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs font-semibold"
            onClick={() => alert("Telehealth visit completed. Post-encounter summary generated.")}
          >
            <PhoneOff className="mr-1.5 size-3.5" /> End Visit
          </Button>
        </div>
      </header>

      {/* Main split consultation interface */}
      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-12">
        {/* Left column: Video feed & patient stream (5 cols) */}
        <div className="flex flex-col gap-3 lg:col-span-5">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 shadow-md flex items-center justify-center">
            {videoOff ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                <CameraOff className="size-10 opacity-40 text-white" />
                <span className="text-xs text-white/70">Remote Camera Paused</span>
              </div>
            ) : (
              <div className="relative size-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                {/* Simulated live video avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex size-20 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/30 text-white text-2xl font-semibold shadow-lg">
                    GL
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-sm font-semibold">{patient.name}</p>
                    <span className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" /> Speaking · Optimal Connection
                    </span>
                  </div>
                </div>

                {/* Patient reported vitals overlay badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] text-white">
                  <span>BP: 124/78</span>
                  <span className="text-white/40">|</span>
                  <span>HR: 72 bpm</span>
                  <span className="text-white/40">|</span>
                  <span>SpO2: 99%</span>
                </div>

                {/* Self PIP (Doctor view) */}
                <div className="absolute bottom-3 right-3 h-20 w-32 rounded-lg border border-white/20 bg-slate-900 shadow-xl overflow-hidden flex items-center justify-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium">
                    <User className="size-3" /> Dr. Patel (You)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Media control bar */}
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-card p-2 shadow-xs">
            <Button
              size="sm"
              variant={micMuted ? "destructive" : "secondary"}
              className="h-8 text-xs"
              aria-label={micMuted ? "Unmute audio" : "Mute audio"}
              onClick={() => setMicMuted((prev) => !prev)}
            >
              {micMuted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
              <span className="ml-1.5">{micMuted ? "Unmute" : "Mute"}</span>
            </Button>

            <Button
              size="sm"
              variant={videoOff ? "destructive" : "secondary"}
              className="h-8 text-xs"
              onClick={() => setVideoOff((prev) => !prev)}
            >
              {videoOff ? <CameraOff className="size-3.5" /> : <Camera className="size-3.5" />}
              <span className="ml-1.5">{videoOff ? "Start Video" : "Stop Video"}</span>
            </Button>

            <Button size="sm" variant="outline" className="h-8 text-xs">
              <ScreenShare className="mr-1.5 size-3.5" /> Share Screen
            </Button>
          </div>
        </div>

        {/* Right column: Integrated clinical EHR workspace (7 cols) */}
        <div className="lg:col-span-7">
          <Tabs defaultValue="note" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-3">
              <TabsTrigger value="note" className="text-xs">
                <FileText className="mr-1.5 size-3.5" /> Clinical Note
              </TabsTrigger>
              <TabsTrigger value="rx" className="text-xs">
                <Pill className="mr-1.5 size-3.5" /> Prescribe
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-xs">
                <Activity className="mr-1.5 size-3.5" /> Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="note" className="mt-0">
              <ClinicalNote
                template="soap"
                author="Dr. Priya Patel, MD"
                title="Telehealth SOAP Note"
                defaultSections={[
                  {
                    key: "subjective",
                    label: "Subjective",
                    content:
                      "Patient presents via secure video telehealth for 3-month follow-up of Type 2 Diabetes and Hypertension. Reports feeling well, adherent to medications without side effects. Checking home blood pressures consistently.",
                  },
                  {
                    key: "objective",
                    label: "Objective (Virtual Exam)",
                    content:
                      "Patient alert, in no apparent distress via video. Respiratory effort unlabored, speaking in full sentences. Home vitals reported: BP 124/78 mmHg, HR 72 bpm, SpO2 99% room air.",
                  },
                  {
                    key: "assessment",
                    label: "Assessment",
                    content:
                      "1. Type 2 Diabetes Mellitus — stable on current oral regimen.\n2. Essential Hypertension — controlled to goal via telehealth follow-up.",
                  },
                  {
                    key: "plan",
                    label: "Plan",
                    content:
                      "1. Continue Metformin 500 mg PO BID.\n2. Continue Lisinopril 10 mg PO daily.\n3. Orders: Routine outpatient lab draw (HbA1c, CMP) sent to patient's local lab.\n4. Follow-up: Return for in-person or telehealth visit in 3 months.",
                  },
                ]}
              />
            </TabsContent>

            <TabsContent value="rx" className="mt-0">
              <PrescriptionPad
                patient={patient}
                prescriber={prescriber}
                defaultPrescription={{
                  medication: "Metformin HCl 500 mg Tablet",
                  dose: "1 tablet",
                  route: "oral",
                  frequency: "twice daily",
                  duration: "90 days",
                  quantity: "180",
                  refills: 3,
                  instructions: "Take with meals",
                }}
              />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <OrderEntry catalog={telehealthCatalog} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
