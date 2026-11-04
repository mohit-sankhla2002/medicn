import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  FamilyHistory,
  sortFamilyMembers,
  getFamilyConditionsSummary,
  type FamilyMember,
} from "@/components/medicn/family-history"

const sampleMembers: FamilyMember[] = [
  {
    id: "fm-1",
    relationship: "father",
    label: "Father",
    sex: "male",
    deceased: true,
    ageAtDeath: 68,
    causeOfDeath: "Myocardial Infarction",
    conditions: [
      { condition: "Coronary Artery Disease", ageOfOnset: 52 },
      { condition: "Type 2 Diabetes Mellitus", ageOfOnset: 48 },
    ],
  },
  {
    id: "fm-2",
    relationship: "mother",
    label: "Mother",
    sex: "female",
    deceased: false,
    conditions: [
      { condition: "Hypertension", ageOfOnset: 60 },
      { condition: "Osteoporosis", ageOfOnset: 65 },
    ],
  },
  {
    id: "fm-3",
    relationship: "sister",
    label: "Sister",
    sex: "female",
    deceased: false,
    conditions: [
      { condition: "Breast Cancer", ageOfOnset: 42, note: "BRCA1 positive" },
    ],
  },
]

describe("sortFamilyMembers", () => {
  it("sorts parents before siblings", () => {
    const sorted = sortFamilyMembers(sampleMembers)
    expect(["father", "mother"]).toContain(sorted[0].relationship)
    expect(sorted[2].relationship).toBe("sister")
  })
})

describe("getFamilyConditionsSummary", () => {
  it("aggregates conditions across family members", () => {
    const summary = getFamilyConditionsSummary(sampleMembers)
    const cad = summary.find((s) => s.condition === "Coronary Artery Disease")
    expect(cad).toBeDefined()
    expect(cad?.affectedCount).toBe(1)
    expect(cad?.members).toContain("Father")
  })
})

describe("FamilyHistory component", () => {
  it("renders family members and documented conditions", () => {
    render(<FamilyHistory members={sampleMembers} />)
    expect(screen.getByText("Family Medical History & Pedigree")).toBeInTheDocument()
    expect(screen.getByText("Father")).toBeInTheDocument()
    expect(screen.getByText("Mother")).toBeInTheDocument()
    expect(screen.getByText("Sister")).toBeInTheDocument()
    expect(screen.getAllByText("Coronary Artery Disease").length).toBeGreaterThan(0)
    expect(screen.getByText(/Deceased \(Age 68\)/i)).toBeInTheDocument()
  })

  it("filters members by condition search", async () => {
    render(<FamilyHistory members={sampleMembers} />)
    const search = screen.getByPlaceholderText(/Search conditions\.\.\./i)
    await userEvent.type(search, "Breast")

    expect(screen.getByText("Sister")).toBeInTheDocument()
    expect(screen.queryByText("Father")).not.toBeInTheDocument()
  })

  it("calls onAddMember when add button clicked", async () => {
    const onAddMember = vi.fn()
    render(<FamilyHistory members={sampleMembers} onAddMember={onAddMember} />)
    const addBtn = screen.getByRole("button", { name: /Add Family Member/i })
    await userEvent.click(addBtn)
    expect(onAddMember).toHaveBeenCalled()
  })
})
