import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  DischargeSummary,
  DISCHARGE_CONDITION_LABELS,
  DISCHARGE_DISPOSITION_LABELS,
  getDischargeConditionStatus,
  type DischargeSummaryData,
} from "@/components/medicn/discharge-summary"

const sampleSummary: DischargeSummaryData = {
  patientName: "Robert Davis",
  mrn: "MRN-90281",
  admissionDate: "Oct 18, 2024",
  dischargeDate: "Oct 22, 2024",
  attendingPhysician: "Dr. Gregory House, MD",
  primaryDiagnosis: "Acute Uncomplicated Diverticulitis",
  secondaryDiagnoses: ["Essential Hypertension", "Type 2 Diabetes Mellitus"],
  hospitalCourse: "Patient presented with LLQ abdominal pain. CT confirmed Hinchey 1a diverticulitis. Managed with IV ceftriaxone and metronidazole with rapid clinical resolution of pain and leukocytosis. Diet advanced to low-residue without complications.",
  dischargeCondition: "improved",
  dischargeDisposition: "home",
  medications: [
    { name: "Amoxicillin-Clavulanate 875-125 mg", sig: "1 tablet PO BID x 7 days", status: "new" },
    { name: "Lisinopril 10 mg", sig: "1 tablet PO daily", status: "continued" },
    { name: "Ibuprofen 400 mg", sig: "Discontinued due to gastrointestinal irritation", status: "discontinued" },
  ],
  followUpAppointments: [
    { provider: "Dr. Sarah Jenkins", specialty: "Primary Care", timeFrame: "In 1 to 2 weeks" },
    { provider: "Dr. Marcus Vance", specialty: "Gastroenterology", timeFrame: "Colonoscopy in 6-8 weeks" },
  ],
  followUpInstructions: "Follow a low-fiber diet for 2 weeks, then gradually re-introduce fiber. Return to ED immediately for fever > 101F, worsening severe abdominal pain, or intractable nausea.",
}

describe("DISCHARGE_CONDITION_LABELS & getDischargeConditionStatus", () => {
  it("defines discharge condition labels", () => {
    expect(DISCHARGE_CONDITION_LABELS.stable).toBe("Stable")
    expect(DISCHARGE_CONDITION_LABELS.improved).toBe("Improved")
  })

  it("maps discharge conditions to appropriate clinical status", () => {
    expect(getDischargeConditionStatus("improved")).toBe("normal")
    expect(getDischargeConditionStatus("guarded")).toBe("watch")
    expect(getDischargeConditionStatus("critical")).toBe("critical")
  })
})

describe("DischargeSummary component", () => {
  it("renders patient demographics, admission/discharge dates, and diagnoses", () => {
    render(<DischargeSummary summary={sampleSummary} />)
    expect(screen.getByText("Hospital Discharge Summary")).toBeInTheDocument()
    expect(screen.getByText("Robert Davis")).toBeInTheDocument()
    expect(screen.getByText(/Oct 18, 2024/i)).toBeInTheDocument()
    expect(screen.getByText(/Oct 22, 2024/i)).toBeInTheDocument()
    expect(screen.getByText("Acute Uncomplicated Diverticulitis")).toBeInTheDocument()
    expect(screen.getByText("Essential Hypertension")).toBeInTheDocument()
  })

  it("renders reconciled discharge medications and statuses", () => {
    render(<DischargeSummary summary={sampleSummary} />)
    expect(screen.getByText("Amoxicillin-Clavulanate 875-125 mg")).toBeInTheDocument()
    expect(screen.getByText("1 tablet PO BID x 7 days")).toBeInTheDocument()
    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByText("Continued")).toBeInTheDocument()
    expect(screen.getByText("Discontinued")).toBeInTheDocument()
  })

  it("renders follow-up appointments and return precautions", () => {
    render(<DischargeSummary summary={sampleSummary} />)
    expect(screen.getByText("Follow-up Care & Appointments")).toBeInTheDocument()
    expect(screen.getByText("Dr. Sarah Jenkins")).toBeInTheDocument()
    expect(screen.getByText(/Colonoscopy in 6-8 weeks/i)).toBeInTheDocument()
    expect(screen.getByText(/Return to ED immediately/i)).toBeInTheDocument()
  })

  it("triggers onSign callback when sign button is clicked", async () => {
    const onSign = vi.fn()
    render(<DischargeSummary summary={sampleSummary} onSign={onSign} />)
    const signBtn = screen.getByRole("button", { name: /Sign & Finalize Discharge/i })
    await userEvent.click(signBtn)
    expect(onSign).toHaveBeenCalledWith(sampleSummary)
  })
})
