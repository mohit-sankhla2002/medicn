"use client"

import { GAD7, Questionnaire } from "@/components/medicn/questionnaire"

export default function QuestionnaireGad7Demo() {
  return (
    <div className="w-full max-w-md">
      <Questionnaire definition={GAD7} layout="stacked" defaultValue={{ "gad7-1": 1, "gad7-2": 2 }} />
    </div>
  )
}
