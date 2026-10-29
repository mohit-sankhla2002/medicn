import { FacesPainScale } from "@/components/medicn/faces-pain-scale"

export default function FacesPainScaleReadonlyDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <span className="text-xs text-muted-foreground">Recorded 09:40 by triage nurse</span>
      <FacesPainScale value={6} readOnly size="sm" showNumbers={false} label="Recorded pain score, 6 out of 10" />
    </div>
  )
}
