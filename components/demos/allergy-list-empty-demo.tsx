"use client"

import * as React from "react"

import { AllergyList, type Allergy } from "@/components/medicn/allergy-list"

export default function AllergyListEmptyDemo() {
  const [allergies, setAllergies] = React.useState<Allergy[] | undefined>(undefined)
  const [noKnownAllergies, setNoKnownAllergies] = React.useState(false)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <AllergyList
        allergies={allergies}
        onAllergiesChange={setAllergies}
        noKnownAllergies={noKnownAllergies}
        onNoKnownAllergiesChange={setNoKnownAllergies}
        suggestions={["Penicillin", "Sulfonamides", "Latex", "Peanut", "Shellfish"]}
      />
      <p className="text-xs text-muted-foreground">
        Status:{" "}
        {allergies?.length ? `${allergies.length} recorded` : noKnownAllergies ? "No known allergies" : "Not recorded"}
      </p>
    </div>
  )
}
