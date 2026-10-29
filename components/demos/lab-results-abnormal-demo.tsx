import { LabResults, type LabPanel } from "@/components/medicn/lab-results"

const panels: LabPanel[] = [
  {
    id: "cmp",
    name: "Comprehensive metabolic panel",
    collectedAt: "2026-03-14T06:45:00",
    status: "final",
    results: [
      {
        id: "na",
        name: "Sodium",
        code: "2951-2",
        value: 129,
        unit: "mmol/L",
        referenceRange: { low: 135, high: 145, criticalLow: 120, criticalHigh: 160 },
        effectiveDate: "2026-03-14T06:45:00",
        previous: [
          { value: 132, effectiveDate: "2026-03-13T06:30:00" },
          { value: 136, effectiveDate: "2026-03-12T06:40:00" },
        ],
      },
      {
        id: "k",
        name: "Potassium",
        code: "2823-3",
        value: 4.1,
        unit: "mmol/L",
        referenceRange: { low: 3.5, high: 5.1, criticalLow: 2.8, criticalHigh: 6.2 },
        effectiveDate: "2026-03-14T06:45:00",
      },
      {
        id: "alt",
        name: "ALT",
        code: "1742-6",
        value: 88,
        unit: "U/L",
        referenceRange: { low: 7, high: 56 },
        effectiveDate: "2026-03-14T06:45:00",
        previous: [{ value: 61, effectiveDate: "2026-03-12T06:40:00" }],
      },
      {
        id: "alb",
        name: "Albumin",
        code: "1751-7",
        value: 3.9,
        unit: "g/dL",
        referenceRange: { low: 3.5, high: 5.0 },
        effectiveDate: "2026-03-14T06:45:00",
      },
    ],
  },
  {
    id: "coag",
    name: "Coagulation",
    collectedAt: "2026-03-14T06:45:00",
    status: "preliminary",
    results: [
      {
        id: "inr",
        name: "INR",
        code: "6301-6",
        value: 5.2,
        referenceRange: { low: 0.8, high: 1.2, criticalHigh: 5 },
        status: "preliminary",
        effectiveDate: "2026-03-14T06:45:00",
        previous: [
          { value: 3.4, effectiveDate: "2026-03-13T06:30:00" },
          { value: 2.6, effectiveDate: "2026-03-12T06:40:00" },
        ],
      },
      {
        id: "ptt",
        name: "aPTT",
        code: "14979-9",
        value: 31,
        unit: "s",
        referenceRange: { low: 25, high: 35 },
        effectiveDate: "2026-03-14T06:45:00",
      },
    ],
  },
  {
    id: "ua",
    name: "Urinalysis",
    collectedAt: "2026-03-14T08:10:00",
    results: [
      {
        id: "nit",
        name: "Nitrite",
        code: "5802-4",
        value: "Positive",
        referenceRange: { text: "Negative" },
        interpretation: "A",
        effectiveDate: "2026-03-14T08:10:00",
      },
      {
        id: "ph",
        name: "pH",
        code: "5803-2",
        value: 6.0,
        referenceRange: { low: 5.0, high: 8.0 },
        effectiveDate: "2026-03-14T08:10:00",
      },
    ],
  },
]

export default function LabResultsAbnormalDemo() {
  return <LabResults className="w-full max-w-4xl" title="Abnormal results" panels={panels} defaultAbnormalOnly />
}
