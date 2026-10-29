import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"

export default function ClinicalStatusBadgeDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <ClinicalStatusBadge status="normal" />
      <ClinicalStatusBadge status="watch" />
      <ClinicalStatusBadge status="abnormal" />
      <ClinicalStatusBadge status="critical" />
      <ClinicalStatusBadge status="info">Pending review</ClinicalStatusBadge>
      <ClinicalStatusBadge status="unknown" />
    </div>
  )
}
