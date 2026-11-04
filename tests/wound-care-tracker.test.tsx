import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  WoundCareTracker,
  calculateWoundArea,
  calculateAreaReduction,
  WOUND_STAGE_LABELS,
  type Wound,
} from "@/components/medicn/wound-care-tracker"

const sampleWound: Wound = {
  id: "w-1",
  location: "Sacrum / Coccyx",
  type: "pressure",
  acquiredDate: "Oct 01, 2024",
  assessments: [
    {
      id: "a-1",
      date: "Oct 01, 2024",
      lengthCm: 4.0,
      widthCm: 3.0,
      depthCm: 0.5,
      areaCm2: 12.0,
      stage: "stage2",
      exudateAmount: "moderate",
      exudateType: "serosanguinous",
      dressingApplied: "Hydrocolloid border dressing",
      assessor: "Sarah Jenkins, RN, CWOCN",
    },
    {
      id: "a-2",
      date: "Oct 15, 2024",
      lengthCm: 3.0,
      widthCm: 2.0,
      depthCm: 0.2,
      areaCm2: 6.0,
      stage: "stage2",
      exudateAmount: "small",
      exudateType: "serous",
      dressingApplied: "Foam dressing with silicone border",
      assessor: "Sarah Jenkins, RN, CWOCN",
    },
  ],
}

describe("calculateWoundArea & calculateAreaReduction", () => {
  it("computes area correctly", () => {
    expect(calculateWoundArea(4, 3)).toBe(12)
    expect(calculateWoundArea(3.5, 2)).toBe(7)
  })

  it("computes area reduction percentage correctly", () => {
    // 12 cm2 -> 6 cm2 = 50% reduction
    expect(calculateAreaReduction(12, 6)).toBe(50)
    // 10 cm2 -> 12 cm2 = -20% (worsening)
    expect(calculateAreaReduction(10, 12)).toBe(-20)
  })
})

describe("WoundCareTracker component", () => {
  it("renders wound location, type, and reduction metrics", () => {
    render(<WoundCareTracker wound={sampleWound} />)
    expect(screen.getByText("Wound Assessment & Healing Tracker")).toBeInTheDocument()
    expect(screen.getByText("Sacrum / Coccyx")).toBeInTheDocument()
    expect(screen.getByText(/50% Area Reduction/i)).toBeInTheDocument()
    expect(screen.getByText("Hydrocolloid border dressing")).toBeInTheDocument()
    expect(screen.getByText("Foam dressing with silicone border")).toBeInTheDocument()
  })

  it("calls onAddAssessment when record button is clicked", async () => {
    const onAddAssessment = vi.fn()
    render(<WoundCareTracker wound={sampleWound} onAddAssessment={onAddAssessment} />)
    const btn = screen.getByRole("button", { name: /Record Assessment/i })
    await userEvent.click(btn)
    expect(onAddAssessment).toHaveBeenCalledWith(sampleWound.id)
  })
})
