"use client"

import * as React from "react"
import { CalendarClock, FileText, Plus, Printer, Stethoscope } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AllergyList, toPatientAllergies, type Allergy } from "@/components/medicn/allergy-list"
import { ClinicalTimeline, type TimelineEvent } from "@/components/medicn/clinical-timeline"
import { EarlyWarningScore } from "@/components/medicn/early-warning-score"
import { LabResults, type LabPanel } from "@/components/medicn/lab-results"
import { MedicationForm, toMedication } from "@/components/medicn/medication-form"
import { MedicationList, type Medication } from "@/components/medicn/medication-list"
import { PatientHeader, type Patient } from "@/components/medicn/patient-header"
import { ProblemList, type Problem } from "@/components/medicn/problem-list"
import { VitalSignsPanel, type VitalReading } from "@/components/medicn/vital-signs"
import { VitalsChart, type VitalsChartSeries } from "@/components/medicn/vitals-chart"
import { VitalsForm, type VitalsFormValues } from "@/components/medicn/vitals-form"

// Sample data — replace with your EHR / FHIR queries.
const TODAY = "2026-10-29"

const patient: Omit<Patient, "allergies"> = {
  name: "Grace Liu",
  mrn: "330-417-92",
  age: 54,
  sex: "Female",
  dateOfBirth: "Feb 9, 1972",
  flags: [{ label: "Diabetic", tone: "warning" }],
  details: [
    { label: "Primary care", value: "Dr. Priya Patel" },
    { label: "Insurance", value: "Blue Cross PPO" },
    { label: "Last visit", value: "Aug 12, 2026" },
  ],
}

const initialAllergies: Allergy[] = [
  {
    id: "a1",
    substance: "Iodinated contrast",
    category: "medication",
    criticality: "high",
    reactions: [{ manifestation: "Anaphylaxis", severity: "severe" }],
    recordedDate: "Jun 11, 2018",
  },
  {
    id: "a2",
    substance: "Sulfonamides",
    category: "medication",
    criticality: "low",
    reactions: [
      { manifestation: "Rash", severity: "moderate" },
      { manifestation: "Hives", severity: "moderate" },
    ],
  },
]

const initialProblems: Problem[] = [
  {
    id: "p1",
    display: "Type 2 diabetes mellitus without complications",
    code: { system: "ICD-10-CM", code: "E11.9" },
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    onset: "2019-03",
    priority: true,
  },
  {
    id: "p2",
    display: "Essential hypertension",
    code: { system: "ICD-10-CM", code: "I10" },
    clinicalStatus: "active",
    onset: "2021",
  },
  { id: "p3", display: "Hyperlipidemia", code: { system: "ICD-10-CM", code: "E78.5" }, clinicalStatus: "active", onset: "2021" },
  {
    id: "p4",
    display: "Gestational diabetes",
    code: { system: "ICD-10-CM", code: "O24.419" },
    clinicalStatus: "resolved",
    onset: "2004",
    abatement: "2004",
  },
]

const vitals: VitalReading[] = [
  { type: "bloodPressure", systolic: 138, diastolic: 86, history: [146, 142, 140, 139, 138], recordedAt: "Today 09:34" },
  { type: "heartRate", value: 74, history: [80, 77, 76, 75, 74], recordedAt: "Today 09:34" },
  { type: "spo2", value: 98, recordedAt: "Today 09:34" },
  { type: "temperature", value: 36.8, recordedAt: "Today 09:34" },
  { type: "bmi", value: 29.1, history: [30.4, 30.0, 29.6, 29.1], recordedAt: "Today 09:30" },
  { type: "glucose", value: 132, history: [168, 151, 144, 132], recordedAt: "Fasting, today" },
]

const vitalsTrend: VitalsChartSeries[] = [
  {
    type: "bloodPressure",
    points: [
      { time: "2026-02-10T09:00:00", value: 152, value2: 94 },
      { time: "2026-04-14T09:00:00", value: 146, value2: 90 },
      { time: "2026-06-09T09:00:00", value: 142, value2: 88 },
      { time: "2026-08-12T09:00:00", value: 139, value2: 87 },
      { time: "2026-10-29T09:34:00", value: 138, value2: 86 },
    ],
  },
  {
    type: "heartRate",
    points: [
      { time: "2026-02-10T09:00:00", value: 82 },
      { time: "2026-04-14T09:00:00", value: 80 },
      { time: "2026-06-09T09:00:00", value: 77 },
      { time: "2026-08-12T09:00:00", value: 75 },
      { time: "2026-10-29T09:34:00", value: 74 },
    ],
  },
  {
    type: "weight",
    label: "Weight",
    unit: "kg",
    points: [
      { time: "2026-02-10T09:00:00", value: 84.2 },
      { time: "2026-04-14T09:00:00", value: 83.1 },
      { time: "2026-06-09T09:00:00", value: 82.4 },
      { time: "2026-08-12T09:00:00", value: 81.6 },
      { time: "2026-10-29T09:34:00", value: 80.7 },
    ],
  },
]

const labPanels: LabPanel[] = [
  {
    id: "dm",
    name: "Diabetes monitoring",
    collectedAt: "2026-10-28T07:40:00",
    results: [
      {
        id: "a1c",
        name: "Hemoglobin A1c",
        code: "4548-4",
        value: 6.8,
        unit: "%",
        referenceRange: { low: 4, high: 5.6 },
        effectiveDate: "2026-10-28T07:40:00",
        previous: [
          { value: 7.1, effectiveDate: "2026-07-30T07:30:00" },
          { value: 7.6, effectiveDate: "2026-04-14T07:30:00" },
          { value: 8.2, effectiveDate: "2026-01-12T07:30:00" },
        ],
      },
      {
        id: "glu",
        name: "Glucose, fasting",
        code: "1558-6",
        value: 132,
        unit: "mg/dL",
        referenceRange: { low: 70, high: 99, criticalLow: 40, criticalHigh: 400 },
        effectiveDate: "2026-10-28T07:40:00",
        previous: [{ value: 144, effectiveDate: "2026-07-30T07:30:00" }],
      },
      {
        id: "uacr",
        name: "Albumin/creatinine ratio, urine",
        code: "9318-7",
        value: 34,
        unit: "mg/g",
        referenceRange: { high: 29 },
        effectiveDate: "2026-10-28T07:40:00",
        previous: [{ value: 31, effectiveDate: "2026-04-14T07:30:00" }],
      },
    ],
  },
  {
    id: "lipid",
    name: "Lipid panel",
    collectedAt: "2026-10-28T07:40:00",
    results: [
      {
        id: "ldl",
        name: "LDL cholesterol",
        code: "13457-7",
        value: 92,
        unit: "mg/dL",
        referenceRange: { high: 99 },
        effectiveDate: "2026-10-28T07:40:00",
        previous: [{ value: 118, effectiveDate: "2026-04-14T07:30:00" }],
      },
      {
        id: "hdl",
        name: "HDL cholesterol",
        code: "2085-9",
        value: 48,
        unit: "mg/dL",
        referenceRange: { low: 40 },
        effectiveDate: "2026-10-28T07:40:00",
      },
      {
        id: "egfr",
        name: "eGFR",
        code: "33914-3",
        value: 78,
        unit: "mL/min/1.73m²",
        referenceRange: { low: 60 },
        effectiveDate: "2026-10-28T07:40:00",
      },
    ],
  },
]

const initialMedications: Medication[] = [
  { id: "m1", name: "Metformin XR", strength: "1000 mg", route: "Oral", frequency: "Once daily with dinner", indication: "type 2 diabetes", startDate: "Mar 2023" },
  { id: "m2", name: "Lisinopril", strength: "20 mg", route: "Oral", frequency: "Once daily", indication: "hypertension", startDate: "Jan 2024" },
  { id: "m3", name: "Atorvastatin", strength: "40 mg", route: "Oral", frequency: "At bedtime", indication: "hyperlipidemia" },
  { id: "m4", name: "Insulin glargine", strength: "14 units", route: "Subcutaneous", frequency: "At bedtime", highAlert: true, status: "held", indication: "type 2 diabetes" },
]

const medicationOptions = [
  { name: "Empagliflozin", strength: "10 mg", form: "tablet" },
  { name: "Semaglutide", strength: "0.25 mg", form: "injection" },
  { name: "Amlodipine", strength: "5 mg", form: "tablet" },
  { name: "Insulin glargine", strength: "100 units/mL", form: "injection", highAlert: true },
  { name: "Metformin XR", strength: "500 mg", form: "tablet" },
]

const timeline: TimelineEvent[] = [
  { id: "t1", type: "vitals", title: "Vitals recorded", date: "2026-10-29T09:34:00", author: "R. Gomez, MA", description: "BP 138/86, HR 74, BMI 29.1" },
  { id: "t2", type: "lab", title: "Diabetes monitoring panel", date: "2026-10-28T07:40:00", status: "abnormal", statusLabel: "A1c 6.8%", description: "A1c down from 7.1%. Urine albumin/creatinine slightly high." },
  { id: "t3", type: "lab", title: "Lipid panel", date: "2026-10-28T07:40:00", status: "normal", statusLabel: "Within range" },
  { id: "t4", type: "message", title: "Patient message: glucose log", date: "2026-09-18T19:12:00", author: "Grace Liu", description: "Fasting readings 120–140 this week." },
  { id: "t5", type: "encounter", title: "Follow-up visit", date: "2026-08-12T10:00:00", author: "Dr. Priya Patel", location: "Riverside Family Medicine" },
  { id: "t6", type: "medication", title: "Insulin glargine held", date: "2026-08-12T10:30:00", author: "Dr. Priya Patel", status: "watch", statusLabel: "Held", description: "Held while A1c improves on metformin." },
  { id: "t7", type: "immunization", title: "Influenza vaccine", date: "2026-10-02T14:15:00", location: "Riverside Family Medicine" },
  { id: "t8", type: "imaging", title: "Retinal photography", date: "2026-06-20T11:00:00", status: "normal", statusLabel: "No retinopathy" },
]

export default function PatientChartPage() {
  const [allergies, setAllergies] = React.useState<Allergy[]>(initialAllergies)
  const [problems, setProblems] = React.useState<Problem[]>(initialProblems)
  const [medications, setMedications] = React.useState<Medication[]>(initialMedications)
  const [orderOpen, setOrderOpen] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [vitalsDraft, setVitalsDraft] = React.useState<VitalsFormValues>({})

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 lg:p-6">
      <PatientHeader
        patient={{ ...patient, allergies: toPatientAllergies(allergies) }}
        actions={
          <>
            <Button variant="outline" size="icon" aria-label="Print summary">
              <Printer />
            </Button>
            <Button variant="outline">
              <CalendarClock /> Schedule
            </Button>
            <Button>
              <Stethoscope /> Start visit
            </Button>
          </>
        }
      />

      <Tabs defaultValue="summary" className="gap-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="vitals">Record vitals</TabsTrigger>
          <TabsTrigger value="note">Visit note</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="flex flex-col gap-4">
          <VitalSignsPanel readings={vitals} />
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <ProblemList problems={problems} onProblemsChange={setProblems} today={TODAY} />
            <AllergyList
              allergies={allergies}
              onAllergiesChange={setAllergies}
              suggestions={["Penicillin", "Amoxicillin", "Codeine", "Latex", "Peanut", "Shellfish", "Iodinated contrast"]}
            />
          </div>
        </TabsContent>

        <TabsContent value="results" className="flex flex-col gap-4">
          <LabResults panels={labPanels} title="Lab results" />
          <Card>
            <CardHeader>
              <CardTitle>Vitals trend</CardTitle>
              <CardDescription>Last five visits</CardDescription>
            </CardHeader>
            <CardContent>
              <VitalsChart series={vitalsTrend} timeFormat="MMM d" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus /> New medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>New medication</DialogTitle>
                  <DialogDescription>Build the order. The sig preview is what the patient will read.</DialogDescription>
                </DialogHeader>
                <MedicationForm
                  medicationOptions={medicationOptions}
                  presets={[
                    { label: "1 tab PO daily", order: { dose: { value: 1, unit: "tablet" }, route: "oral", frequency: "QD" } },
                    { label: "1 tab PO BID", order: { dose: { value: 1, unit: "tablet" }, route: "oral", frequency: "BID" } },
                  ]}
                  onCancel={() => setOrderOpen(false)}
                  onSubmit={(order) => {
                    setMedications((current) => [...current, toMedication(order, `m${current.length + 1}`)])
                    setOrderOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <MedicationList medications={medications} />
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent>
              <ClinicalTimeline events={timeline} groupBy="month" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <Card>
            <CardHeader>
              <CardTitle>Record vitals</CardTitle>
              <CardDescription>Entered values are stored in metric units.</CardDescription>
            </CardHeader>
            <CardContent>
              <VitalsForm onValuesChange={setVitalsDraft} onSubmit={() => setSaved(true)} />
              {saved && <p className="mt-3 text-sm text-clinical-normal-foreground">Vitals saved to chart.</p>}
            </CardContent>
          </Card>
          <EarlyWarningScore vitals={vitalsDraft} editable hideBreakdown />
        </TabsContent>

        <TabsContent value="note">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4" /> SOAP note
              </CardTitle>
              <CardDescription>Follow-up visit · Dr. Priya Patel</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                <FieldGroup className="grid gap-5 md:grid-cols-2">
                  {[
                    ["subjective", "Subjective", "Chief complaint, history of present illness, review of systems…"],
                    ["objective", "Objective", "Exam findings, vitals, results…"],
                    ["assessment", "Assessment", "Diagnoses and clinical reasoning…"],
                    ["plan", "Plan", "Orders, medications, referrals, follow-up…"],
                  ].map(([id, label, placeholder]) => (
                    <Field key={id}>
                      <FieldLabel htmlFor={`note-${id}`}>{label}</FieldLabel>
                      <Textarea id={`note-${id}`} placeholder={placeholder} className="min-h-28" />
                    </Field>
                  ))}
                </FieldGroup>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button">
                    Save draft
                  </Button>
                  <Button type="submit">Sign note</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
