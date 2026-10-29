import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MedicationList } from "@/components/medicn/medication-list"

export default function MedicationListDemo() {
  return (
    <MedicationList
      className="w-full max-w-2xl"
      medications={[
        {
          id: "1",
          name: "Metformin",
          strength: "500 mg",
          route: "Oral",
          frequency: "Twice daily with meals",
          indication: "type 2 diabetes",
          prescriber: "Dr. Priya Patel",
          startDate: "Jan 2024",
        },
        {
          id: "2",
          name: "Apixaban",
          strength: "5 mg",
          route: "Oral",
          frequency: "Every 12 hours",
          indication: "atrial fibrillation",
          highAlert: true,
        },
        { id: "3", name: "Ondansetron", strength: "4 mg", route: "Oral", frequency: "Every 8 hours", prn: true, indication: "nausea" },
        { id: "4", name: "Lisinopril", strength: "10 mg", route: "Oral", frequency: "Once daily", status: "held", indication: "hypertension" },
        { id: "5", name: "Amoxicillin", strength: "500 mg", route: "Oral", frequency: "Three times daily", status: "completed" },
      ]}
      renderActions={(med) => (
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${med.name}`}>
          <MoreHorizontal />
        </Button>
      )}
    />
  )
}
