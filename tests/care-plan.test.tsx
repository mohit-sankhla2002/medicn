import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  CarePlan,
  CARE_GOAL_STATUS_LABELS,
  getCareGoalStatus,
  calculatePlanProgress,
  type CareGoal,
} from "@/components/medicn/care-plan"

const sampleGoals: CareGoal[] = [
  {
    id: "g-1",
    problem: "Type 2 Diabetes Mellitus with Hyperglycemia",
    goalStatement: "Achieve and maintain HbA1c < 7.0% within 6 months",
    targetDate: "Apr 2025",
    status: "in-progress",
    progressPercent: 50,
    responsibleProvider: "Dr. Angela Ray",
    interventions: [
      { id: "i-1", title: "Monitor fasting blood glucose daily in AM", discipline: "nursing", completed: true },
      { id: "i-2", title: "Carbohydrate-controlled diet education", discipline: "dietary", completed: false },
    ],
  },
  {
    id: "g-2",
    problem: "High Fall Risk",
    goalStatement: "Zero patient falls during hospital admission",
    targetDate: "Discharge",
    status: "active",
    progressPercent: 80,
    responsibleProvider: "Nursing Team",
    interventions: [
      { id: "i-3", title: "Bed alarm activated at all times", discipline: "nursing", completed: true },
      { id: "i-4", title: "Non-skid socks and gait belt with ambulation", discipline: "physical-therapy", completed: true },
    ],
  },
]

describe("CARE_GOAL_STATUS_LABELS & helpers", () => {
  it("defines all goal status labels", () => {
    expect(CARE_GOAL_STATUS_LABELS.active).toBe("Active")
    expect(CARE_GOAL_STATUS_LABELS.achieved).toBe("Achieved")
    expect(CARE_GOAL_STATUS_LABELS["in-progress"]).toBe("In Progress")
  })

  it("maps goal status to clinical status", () => {
    expect(getCareGoalStatus("achieved")).toBe("normal")
    expect(getCareGoalStatus("in-progress")).toBe("watch")
    expect(getCareGoalStatus("cancelled")).toBe("unknown")
  })

  it("calculates overall plan progress correctly", () => {
    const avg = calculatePlanProgress(sampleGoals)
    expect(avg).toBe(65) // (50 + 80) / 2
  })
})

describe("CarePlan component", () => {
  it("renders care goals, problems, and target dates", () => {
    render(<CarePlan goals={sampleGoals} />)
    expect(screen.getByText("Interdisciplinary Care Plan")).toBeInTheDocument()
    expect(screen.getByText("Type 2 Diabetes Mellitus with Hyperglycemia")).toBeInTheDocument()
    expect(screen.getByText("Achieve and maintain HbA1c < 7.0% within 6 months")).toBeInTheDocument()
    expect(screen.getByText("Zero patient falls during hospital admission")).toBeInTheDocument()
    expect(screen.getByText("Target: Apr 2025")).toBeInTheDocument()
  })

  it("renders interventions with discipline tags and toggle completion", async () => {
    const onToggleIntervention = vi.fn()
    render(<CarePlan goals={sampleGoals} onToggleIntervention={onToggleIntervention} />)

    expect(screen.getByText("Monitor fasting blood glucose daily in AM")).toBeInTheDocument()
    expect(screen.getByText("Carbohydrate-controlled diet education")).toBeInTheDocument()

    const checkboxes = screen.getAllByRole("checkbox")
    await userEvent.click(checkboxes[1])
    expect(onToggleIntervention).toHaveBeenCalledWith("g-1", "i-2", true)
  })

  it("displays empty state when no goals exist", () => {
    render(<CarePlan goals={[]} />)
    expect(screen.getByText("No active care goals established.")).toBeInTheDocument()
  })
})
