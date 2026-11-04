import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  PrescriptionPad,
  ROUTES,
  FREQUENCIES,
  buildSigLine,
  type Prescription,
  type Pharmacy,
} from "@/components/medicn/prescription-pad"

const samplePharmacies: Pharmacy[] = [
  { id: "pharm-1", name: "CVS Pharmacy #4102", address: "100 Main St, Springfield" },
  { id: "pharm-2", name: "Walgreens #1890", address: "240 Elm St, Springfield" },
]

describe("ROUTES & FREQUENCIES", () => {
  it("includes common clinical administration routes", () => {
    expect(ROUTES.some((r) => r.value === "oral")).toBe(true)
    expect(ROUTES.some((r) => r.value === "topical")).toBe(true)
  })

  it("includes standard frequencies with sig codes", () => {
    expect(FREQUENCIES.some((f) => f.sigCode === "BID")).toBe(true)
    expect(FREQUENCIES.some((f) => f.sigCode === "TID")).toBe(true)
  })
})

describe("buildSigLine", () => {
  it("formats complete sig directions correctly", () => {
    const rx: Partial<Prescription> = {
      dose: "500 mg",
      route: "oral",
      frequency: "twice daily",
      duration: "10 days",
      instructions: "Take with food",
    }
    const sig = buildSigLine(rx)
    expect(sig).toContain("500 mg")
    expect(sig).toContain("oral")
    expect(sig).toContain("twice daily")
    expect(sig).toContain("x 10 days")
    expect(sig).toContain("Take with food")
  })

  it("handles sparse or missing fields gracefully", () => {
    const sig = buildSigLine({ dose: "1 tablet" })
    expect(sig).toBe("1 tablet")
  })
})

describe("PrescriptionPad component", () => {
  it("renders patient details and prescription header", () => {
    render(
      <PrescriptionPad
        patient={{ name: "Eleanor Vance", dateOfBirth: "1964-08-12", allergies: ["Penicillin"] }}
        prescriber={{ name: "Dr. Gregory House, MD", dea: "BH1234567" }}
      />
    )
    expect(screen.getByText("Eleanor Vance")).toBeInTheDocument()
    expect(screen.getByText("Dr. Gregory House, MD")).toBeInTheDocument()
    expect(screen.getByText(/Penicillin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Medication & Strength/i)).toBeInTheDocument()
  })

  it("updates prescription inputs and triggers onPrescribe", async () => {
    const onPrescribe = vi.fn()
    render(
      <PrescriptionPad
        patient={{ name: "Eleanor Vance" }}
        pharmacies={samplePharmacies}
        onPrescribe={onPrescribe}
      />
    )

    const medInput = screen.getByLabelText(/Medication & Strength/i)
    await userEvent.type(medInput, "Azithromycin 250 mg")

    const doseInput = screen.getByLabelText(/Dose/i)
    await userEvent.type(doseInput, "2 tablets day 1, then 1 tablet daily")

    const qtyInput = screen.getByLabelText(/Quantity/i)
    await userEvent.type(qtyInput, "6")

    const sendBtn = screen.getByRole("button", { name: /Transmit E-Prescription/i })
    await userEvent.click(sendBtn)

    expect(onPrescribe).toHaveBeenCalledWith(
      expect.objectContaining({
        medication: "Azithromycin 250 mg",
        dose: "2 tablets day 1, then 1 tablet daily",
        quantity: "6",
      })
    )
  })

  it("shows controlled substance warning when flagged", () => {
    render(
      <PrescriptionPad
        defaultPrescription={{
          medication: "Oxycodone-Acetaminophen 5-325 mg",
          controlledSubstance: true,
        }}
      />
    )
    expect(screen.getByText(/Schedule II Controlled Substance/i)).toBeInTheDocument()
  })
})
