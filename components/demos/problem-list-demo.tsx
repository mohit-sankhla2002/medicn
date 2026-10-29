"use client"

import * as React from "react"

import { ProblemList, type Problem, type ProblemCodeResult } from "@/components/medicn/problem-list"

/** Sample data only — a small ICD-10-CM subset for demonstration, not a terminology service. */
const SAMPLE_ICD10: ProblemCodeResult[] = [
  ["Type 2 diabetes mellitus without complications", "E11.9"],
  ["Type 2 diabetes mellitus with hyperglycemia", "E11.65"],
  ["Type 1 diabetes mellitus without complications", "E10.9"],
  ["Essential (primary) hypertension", "I10"],
  ["Hyperlipidemia, unspecified", "E78.5"],
  ["Pure hypercholesterolemia, unspecified", "E78.00"],
  ["Asthma, unspecified, uncomplicated", "J45.909"],
  ["Mild intermittent asthma, uncomplicated", "J45.20"],
  ["Chronic obstructive pulmonary disease, unspecified", "J44.9"],
  ["Major depressive disorder, single episode, unspecified", "F32.9"],
  ["Generalized anxiety disorder", "F41.1"],
  ["Hypothyroidism, unspecified", "E03.9"],
  ["Obesity, unspecified", "E66.9"],
  ["Gastro-esophageal reflux disease without esophagitis", "K21.9"],
  ["Atrial fibrillation, unspecified", "I48.91"],
  ["Heart failure, unspecified", "I50.9"],
  ["Chronic kidney disease, stage 3 unspecified", "N18.30"],
  ["Low back pain, unspecified", "M54.50"],
  ["Primary osteoarthritis, right knee", "M17.11"],
  ["Migraine, unspecified, not intractable", "G43.909"],
  ["Iron deficiency anemia, unspecified", "D50.9"],
  ["Vitamin D deficiency, unspecified", "E55.9"],
  ["Obstructive sleep apnea", "G47.33"],
  ["Acute appendicitis without perforation", "K35.80"],
  ["Allergic rhinitis, unspecified", "J30.9"],
].map(([display, code]) => ({ display, code: { system: "ICD-10-CM", code } }))

/** Simulates a remote terminology lookup with a little latency. */
function searchCodes(query: string) {
  const q = query.toLowerCase()
  const matches = SAMPLE_ICD10.filter(
    (item) => item.display.toLowerCase().includes(q) || item.code.code.toLowerCase().startsWith(q)
  ).slice(0, 8)
  return new Promise<ProblemCodeResult[]>((resolve) => setTimeout(() => resolve(matches), 350))
}

const initialProblems: Problem[] = [
  {
    id: "1",
    display: "Type 2 diabetes mellitus without complications",
    code: { system: "ICD-10-CM", code: "E11.9" },
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    severity: "moderate",
    onset: "2019-04-02",
    priority: true,
  },
  {
    id: "2",
    display: "Essential hypertension",
    code: { system: "ICD-10-CM", code: "I10" },
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    onset: "2017",
  },
  {
    id: "3",
    display: "Hyperlipidemia",
    code: { system: "ICD-10-CM", code: "E78.5" },
    clinicalStatus: "active",
    verificationStatus: "provisional",
    severity: "mild",
    onset: "2023-08-15",
  },
  {
    id: "4",
    display: "Asthma, uncomplicated",
    code: { system: "ICD-10-CM", code: "J45.909" },
    clinicalStatus: "remission",
    verificationStatus: "confirmed",
    onset: "2004",
    note: "No exacerbations since 2020; rescue inhaler on file.",
  },
  {
    id: "5",
    display: "Acute appendicitis",
    code: { system: "ICD-10-CM", code: "K35.80" },
    clinicalStatus: "resolved",
    verificationStatus: "confirmed",
    category: "encounter-diagnosis",
    onset: "2015-06-10",
    abatement: "2015-06-12",
    note: "Laparoscopic appendectomy.",
  },
]

export default function ProblemListDemo() {
  return (
    <ProblemList
      className="w-full max-w-2xl"
      defaultProblems={initialProblems}
      searchCodes={searchCodes}
      today="2026-10-29"
    />
  )
}
