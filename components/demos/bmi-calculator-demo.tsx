"use client"

import * as React from "react"
import { BmiCalculator } from "@/components/medicn/bmi-calculator"

export default function BmiCalculatorDemo() {
  return (
    <div className="flex w-full justify-center p-4">
      <BmiCalculator defaultHeight={178} defaultWeight={74} defaultUnits="metric" />
    </div>
  )
}
