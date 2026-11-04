import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TelehealthVisitPage from "@/components/blocks/telehealth-visit/page"

describe("TelehealthVisit block", () => {
  it("renders video consultation view and clinical tabs", () => {
    render(<TelehealthVisitPage />)
    expect(screen.getByText("Virtual Care Telehealth Consultation")).toBeInTheDocument()
    expect(screen.getAllByText(/Grace Liu/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Encrypted WebRTC/i)).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Clinical Note/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Prescribe/i })).toBeInTheDocument()
  })

  it("switches to e-prescribe tab when clicked", async () => {
    render(<TelehealthVisitPage />)
    const rxTab = screen.getByRole("tab", { name: /Prescribe/i })
    await userEvent.click(rxTab)
    expect(screen.getByLabelText(/Medication & Strength/i)).toBeInTheDocument()
  })

  it("allows toggling audio mute control", async () => {
    render(<TelehealthVisitPage />)
    const muteBtn = screen.getByRole("button", { name: /Mute audio/i })
    await userEvent.click(muteBtn)
    expect(screen.getByRole("button", { name: /Unmute audio/i })).toBeInTheDocument()
  })
})
