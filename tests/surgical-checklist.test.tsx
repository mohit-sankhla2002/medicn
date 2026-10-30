import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  SurgicalChecklist,
  WHO_CHECKLIST_PHASES,
  calculateChecklistProgress,
  type ChecklistPhase,
} from "@/components/medicn/surgical-checklist"

describe("WHO_CHECKLIST_PHASES", () => {
  it("includes all three standard WHO surgical phases", () => {
    expect(WHO_CHECKLIST_PHASES.signIn).toBeDefined()
    expect(WHO_CHECKLIST_PHASES.timeOut).toBeDefined()
    expect(WHO_CHECKLIST_PHASES.signOut).toBeDefined()
  })

  it("has items in each phase", () => {
    expect(WHO_CHECKLIST_PHASES.signIn.items.length).toBeGreaterThan(0)
    expect(WHO_CHECKLIST_PHASES.timeOut.items.length).toBeGreaterThan(0)
    expect(WHO_CHECKLIST_PHASES.signOut.items.length).toBeGreaterThan(0)
  })
})

describe("calculateChecklistProgress", () => {
  it("calculates progress percentage correctly", () => {
    const phases: ChecklistPhase[] = [
      {
        id: "phase1",
        title: "Sign In",
        subtitle: "Before induction",
        items: [
          { id: "i1", label: "Patient confirmed", checked: true },
          { id: "i2", label: "Site marked", checked: false },
        ],
      },
      {
        id: "phase2",
        title: "Time Out",
        subtitle: "Before incision",
        items: [
          { id: "i3", label: "Team introductions", checked: true },
          { id: "i4", label: "Antibiotics given", checked: true },
        ],
      },
    ]
    const { total, checked, percentage } = calculateChecklistProgress(phases)
    expect(total).toBe(4)
    expect(checked).toBe(3)
    expect(percentage).toBe(75)
  })
})

describe("SurgicalChecklist component", () => {
  it("renders procedure info and checklist phases", () => {
    render(
      <SurgicalChecklist
        procedureName="Laparoscopic Appendectomy"
        patientName="James Wilson"
      />
    )
    expect(screen.getByText("Surgical Safety Checklist")).toBeInTheDocument()
    expect(screen.getByText("Laparoscopic Appendectomy")).toBeInTheDocument()
    expect(screen.getAllByText(/Sign In/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Time Out/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Sign Out/i).length).toBeGreaterThan(0)
  })

  it("checks item when clicked and updates progress", async () => {
    const onPhaseComplete = vi.fn()
    render(
      <SurgicalChecklist
        procedureName="Laparoscopic Appendectomy"
        onPhaseComplete={onPhaseComplete}
      />
    )

    const checkbox = screen.getByLabelText(/Patient identity, site, procedure & consent confirmed/i)
    await userEvent.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it("marks whole phase complete when all items checked", async () => {
    const onComplete = vi.fn()
    const customPhases: ChecklistPhase[] = [
      {
        id: "signIn",
        title: "Sign In",
        subtitle: "Before induction",
        items: [
          { id: "c1", label: "Single verification item", checked: false },
        ],
      },
    ]
    render(<SurgicalChecklist phases={customPhases} onComplete={onComplete} />)

    const item = screen.getByLabelText("Single verification item")
    await userEvent.click(item)

    const completeBtn = screen.getByRole("button", { name: /Complete Sign In/i })
    await userEvent.click(completeBtn)

    expect(onComplete).toHaveBeenCalled()
  })
})
