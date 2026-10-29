import { Button } from "@/components/ui/button"
import { PatientHeader } from "@/components/medicn/patient-header"

export default function PatientHeaderDemo() {
  return (
    <PatientHeader
      className="w-full"
      patient={{
        name: "Amelia Hart",
        mrn: "204-918-33",
        age: 38,
        sex: "Female",
        pronouns: "she/her",
        dateOfBirth: "Mar 14, 1988",
        allergies: [
          { substance: "Penicillin", reaction: "Anaphylaxis", severity: "severe" },
          { substance: "Latex", reaction: "Contact dermatitis", severity: "mild" },
          { substance: "Codeine", reaction: "Nausea, vomiting", severity: "moderate" },
        ],
        flags: [
          { label: "Fall risk", tone: "warning" },
          { label: "Interpreter", tone: "default" },
        ],
        details: [
          { label: "Primary care", value: "Dr. Priya Patel" },
          { label: "Insurance", value: "Aetna PPO" },
          { label: "Language", value: "Portuguese" },
        ],
      }}
      actions={
        <>
          <Button variant="outline">Message</Button>
          <Button>Start visit</Button>
        </>
      }
    />
  )
}
