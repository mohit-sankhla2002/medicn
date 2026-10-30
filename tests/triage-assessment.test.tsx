import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  TriageAssessment,
  ESI_LEVELS,
  getEsiLevelInfo,
  recommendEsiLevel,
  type TriageData,
} from "@/components/medicn/triage-assessment"

describe("ESI_LEVELS & getEsiLevelInfo", () => {
  it("defines all 5 ESI triage acuity levels", () => {
    expect(ESI_LEVELS[1].label).toBe("Resuscitation")
    expect(ESI_LEVELS[2].label).toBe("Emergent")
    expect(ESI_LEVELS[3].label).toBe("Urgent")
    expect(ESI_LEVELS[4].label).toBe("Less Urgent")
    expect(ESI_LEVELS[5].label).toBe("Non-Urgent")
  })

  it("assigns critical status to ESI 1 and 2", () => {
    expect(getEsiLevelInfo(1).clinicalStatus).toBe("critical")
    expect(getEsiLevelInfo(2).clinicalStatus).toBe("critical")
    expect(getEsiLevelInfo(3).clinicalStatus).toBe("abnormal")
    expect(getEsiLevelInfo(4).clinicalStatus).toBe("normal")
    expect(getEsiLevelInfo(5).clinicalStatus).toBe("info")
  })
})

describe("recommendEsiLevel", () => {
  it("recommends Level 1 for immediate life-saving need", () => {
    expect(recommendEsiLevel({ immediateLifeThreat: true })).toBe(1)
  })

  it("recommends Level 2 for high risk or severe distress", () => {
    expect(recommendEsiLevel({ highRisk: true })).toBe(2)
    expect(recommendEsiLevel({ severePain: true })).toBe(2)
  })

  it("recommends Level 3 for two or more resources", () => {
    expect(recommendEsiLevel({ resourceCount: 2 })).toBe(3)
    expect(recommendEsiLevel({ resourceCount: 3 })).toBe(3)
  })

  it("recommends Level 4 for 1 resource and Level 5 for 0 resources", () => {
    expect(recommendEsiLevel({ resourceCount: 1 })).toBe(4)
    expect(recommendEsiLevel({ resourceCount: 0 })).toBe(5)
  })
})

describe("TriageAssessment component", () => {
  it("renders chief complaint and acuity selector", () => {
    render(
      <TriageAssessment
        patientName="Marcus Vance"
        chiefComplaint="Severe acute chest pain radiating to left shoulder"
      />
    )
    expect(screen.getByText("Emergency Triage Assessment")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Severe acute chest pain radiating to left shoulder")).toBeInTheDocument()
    expect(screen.getByText(/ESI 1: Resuscitation/i)).toBeInTheDocument()
    expect(screen.getByText(/ESI 2: Emergent/i)).toBeInTheDocument()
  })

  it("updates selected ESI level and triggers onTriage", async () => {
    const onTriage = vi.fn()
    render(
      <TriageAssessment
        patientName="Marcus Vance"
        chiefComplaint="Chest pain"
        onTriage={onTriage}
      />
    )

    const level2Btn = screen.getByRole("button", { name: /ESI 2: Emergent/i })
    await userEvent.click(level2Btn)

    const submitBtn = screen.getByRole("button", { name: /Complete Triage & Assign Bed/i })
    await userEvent.click(submitBtn)

    expect(onTriage).toHaveBeenCalledWith(
      expect.objectContaining({
        esiLevel: 2,
        chiefComplaint: "Chest pain",
      })
    )
  })
})
