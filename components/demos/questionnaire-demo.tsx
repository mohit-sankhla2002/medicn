"use client"

import * as React from "react"

import { PHQ9, Questionnaire, type QuestionnaireAnswers } from "@/components/medicn/questionnaire"

export default function QuestionnaireDemo() {
  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>({
    "phq9-1": 2,
    "phq9-2": 1,
    "phq9-3": 3,
    "phq9-4": 2,
  })
  return (
    <div className="w-full max-w-3xl">
      <Questionnaire definition={PHQ9} value={answers} onValueChange={setAnswers} />
    </div>
  )
}
