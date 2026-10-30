import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  ConsentForm,
  CONSENT_TYPES,
  getConsentStatusInfo,
  type ConsentData,
} from "@/components/medicn/consent-form"

describe("CONSENT_TYPES & getConsentStatusInfo", () => {
  it("defines all major consent types", () => {
    expect(CONSENT_TYPES.procedure).toBeDefined()
    expect(CONSENT_TYPES.research).toBeDefined()
    expect(CONSENT_TYPES.hipaa).toBeDefined()
    expect(CONSENT_TYPES.general).toBeDefined()
  })

  it("maps unsigned and signed statuses to clinical status", () => {
    expect(getConsentStatusInfo("unsigned").status).toBe("watch")
    expect(getConsentStatusInfo("signed").status).toBe("normal")
    expect(getConsentStatusInfo("revoked").status).toBe("critical")
  })
})

describe("ConsentForm component", () => {
  it("renders procedure details and acknowledgment text", () => {
    render(
      <ConsentForm
        procedureName="Laparoscopic Cholecystectomy"
        description="Removal of gallbladder using minimally invasive surgical technique."
        risks="Bleeding, infection, damage to bile duct, conversion to open surgery."
        benefits="Relief of biliary colic and prevention of recurrent cholecystitis."
      />
    )
    expect(screen.getByText("Informed Consent for Procedure")).toBeInTheDocument()
    expect(screen.getByText("Laparoscopic Cholecystectomy")).toBeInTheDocument()
    expect(screen.getByText(/Bleeding, infection/i)).toBeInTheDocument()
    expect(screen.getByText(/Relief of biliary colic/i)).toBeInTheDocument()
  })

  it("captures typed signature and submits on sign", async () => {
    const onSign = vi.fn()
    render(
      <ConsentForm
        procedureName="Upper Endoscopy (EGD)"
        onSign={onSign}
      />
    )

    const nameInput = screen.getByLabelText(/Patient Legal Name/i)
    await userEvent.type(nameInput, "Robert M. Davis")

    const signBtn = screen.getByRole("button", { name: /Sign & Confirm Consent/i })
    await userEvent.click(signBtn)

    expect(onSign).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "signed",
        patientPrintedName: "Robert M. Davis",
        procedureName: "Upper Endoscopy (EGD)",
      })
    )
  })

  it("renders locked/read-only signed view when status is signed", () => {
    render(
      <ConsentForm
        procedureName="Colonoscopy"
        status="signed"
        patientPrintedName="Robert M. Davis"
        signedAt="Oct 20, 2024 at 09:15 AM"
        readOnly
      />
    )
    expect(screen.getByText("Signed")).toBeInTheDocument()
    expect(screen.getByText("Robert M. Davis")).toBeInTheDocument()
    expect(screen.getByText(/Oct 20, 2024 at 09:15 AM/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Sign & Confirm Consent/i })).not.toBeInTheDocument()
  })
})
