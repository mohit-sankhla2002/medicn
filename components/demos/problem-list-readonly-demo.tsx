import { ProblemList } from "@/components/medicn/problem-list"

export default function ProblemListReadonlyDemo() {
  return (
    <ProblemList
      readOnly
      className="w-full max-w-2xl"
      defaultProblems={[
        {
          id: "1",
          display: "Chronic kidney disease, stage 3a",
          code: { system: "ICD-10-CM", code: "N18.31" },
          clinicalStatus: "active",
          severity: "moderate",
          onset: "2021-02",
          priority: true,
        },
        {
          id: "2",
          display: "Atrial fibrillation",
          code: { system: "SNOMED CT", code: "49436004" },
          clinicalStatus: "recurrence",
          onset: "2018",
        },
        {
          id: "3",
          display: "Gastro-esophageal reflux disease",
          code: { system: "ICD-10-CM", code: "K21.9" },
          clinicalStatus: "active",
          verificationStatus: "unconfirmed",
        },
        {
          id: "4",
          display: "Major depressive disorder, single episode",
          code: { system: "ICD-10-CM", code: "F32.9" },
          clinicalStatus: "remission",
          onset: "2016",
          abatement: "2019",
        },
      ]}
    />
  )
}
