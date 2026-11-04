"use client"

import * as React from "react"
import { CarePlan, type CareGoal } from "@/components/medicn/care-plan"

const demoGoals: CareGoal[] = [
  {
    id: "g-1",
    problem: "Type 2 Diabetes Mellitus with Poor Glycemic Control",
    goalStatement: "Maintain fasting blood glucose 90–130 mg/dL and reduce HbA1c to < 7.0% within 4 months.",
    targetDate: "Feb 2025",
    status: "in-progress",
    progressPercent: 65,
    responsibleProvider: "Dr. Angela Ray, MD",
    interventions: [
      {
        id: "i-1",
        title: "Daily fasting & postprandial glucose logging via patient portal",
        discipline: "nursing",
        completed: true,
      },
      {
        id: "i-2",
        title: "Medical Nutrition Therapy (MNT) — consistent carbohydrate counting",
        discipline: "dietary",
        completed: true,
      },
      {
        id: "i-3",
        title: "Titrate Metformin to 1000 mg BID with evening meal as tolerated",
        discipline: "medical",
        completed: false,
      },
    ],
  },
  {
    id: "g-2",
    problem: "Post-Operative Deconditioning & Fall Risk",
    goalStatement: "Independent ambulation of 150 feet with rolling walker prior to discharge.",
    targetDate: "Discharge",
    status: "active",
    progressPercent: 40,
    responsibleProvider: "Sarah Williams, DPT",
    interventions: [
      {
        id: "i-4",
        title: "Twice daily physical therapy gait training and quadriceps strengthening",
        discipline: "physical-therapy",
        completed: false,
      },
      {
        id: "i-5",
        title: "Enforce bed alarm, non-skid footwear, and 1-person assist transfer protocol",
        discipline: "nursing",
        completed: true,
      },
    ],
  },
  {
    id: "g-3",
    problem: "Stage 2 Essential Hypertension",
    goalStatement: "Resting sitting blood pressure < 130/80 mmHg across all outpatient readings.",
    targetDate: "Ongoing",
    status: "achieved",
    progressPercent: 100,
    responsibleProvider: "Dr. Gregory House, MD",
    interventions: [
      {
        id: "i-6",
        title: "Low sodium DASH dietary pattern (< 2000 mg Na/day)",
        discipline: "dietary",
        completed: true,
      },
      {
        id: "i-7",
        title: "Daily home BP log review",
        discipline: "medical",
        completed: true,
      },
    ],
  },
]

export default function CarePlanDemo() {
  const [goals, setGoals] = React.useState<CareGoal[]>(demoGoals)

  const handleToggle = (goalId: string, interventionId: string, completed: boolean) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g
        return {
          ...g,
          interventions: g.interventions.map((i) =>
            i.id === interventionId ? { ...i, completed } : i
          ),
        }
      })
    )
  }

  const handleAddGoal = () => {
    alert("New interdisciplinary care goal creation modal triggered.")
  }

  return (
    <div className="flex w-full justify-center p-4">
      <CarePlan
        className="w-full max-w-3xl"
        goals={goals}
        onToggleIntervention={handleToggle}
        onAddGoal={handleAddGoal}
      />
    </div>
  )
}
