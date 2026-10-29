"use client"

import { PHQ9, QuestionnaireScore, scoreQuestionnaire } from "@/components/medicn/questionnaire"

const response = scoreQuestionnaire(PHQ9, {
  "phq9-1": 2,
  "phq9-2": 2,
  "phq9-3": 3,
  "phq9-4": 2,
  "phq9-5": 1,
  "phq9-6": 2,
  "phq9-7": 1,
  "phq9-8": 0,
  "phq9-9": 1,
  "phq9-difficulty": 2,
})

export default function QuestionnaireScoreDemo() {
  return (
    <div className="w-full max-w-lg">
      <QuestionnaireScore title="PHQ-9" response={response} />
    </div>
  )
}
