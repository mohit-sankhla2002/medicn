import { PatientHeader } from "@/components/medicn/patient-header"

export default function PatientHeaderCompactDemo() {
  return (
    <PatientHeader
      compact
      className="w-full"
      patient={{
        name: "Rahul Mehta",
        mrn: "118-552-07",
        age: 71,
        sex: "Male",
        dateOfBirth: "Jul 2, 1955",
        flags: [{ label: "DNR", tone: "critical" }],
      }}
    />
  )
}
