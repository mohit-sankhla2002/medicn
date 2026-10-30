"use client"

import * as React from "react"
import { Activity, Scale } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

export type BmiUnits = "metric" | "imperial"

export interface BmiClassification {
  category: "Underweight" | "Normal weight" | "Overweight" | "Obesity Class I" | "Obesity Class II" | "Obesity Class III"
  description: string
  status: ClinicalStatus
  range: string
}

export interface BmiResult {
  bmi: number
  classification: BmiClassification
  height: number
  weight: number
  units: BmiUnits
}

/**
 * Calculates BMI from height and weight.
 * - metric: height in cm, weight in kg
 * - imperial: height in inches, weight in lbs
 * Returns rounded to 1 decimal place or null if invalid.
 */
export function calculateBmi(height: number, weight: number, units: BmiUnits): number | null {
  if (height <= 0 || weight <= 0 || isNaN(height) || isNaN(weight)) return null
  let val: number
  if (units === "metric") {
    const meters = height / 100
    val = weight / (meters * meters)
  } else {
    val = (weight / (height * height)) * 703
  }
  return Math.round(val * 10) / 10
}

/**
 * Classifies BMI according to standard WHO guidelines.
 */
export function classifyBmi(bmi: number): BmiClassification {
  if (bmi < 18.5) {
    return {
      category: "Underweight",
      description: "BMI is below the healthy weight range (< 18.5).",
      status: "watch",
      range: "< 18.5",
    }
  }
  if (bmi <= 24.9) {
    return {
      category: "Normal weight",
      description: "BMI is in the healthy weight range (18.5 – 24.9).",
      status: "normal",
      range: "18.5 – 24.9",
    }
  }
  if (bmi <= 29.9) {
    return {
      category: "Overweight",
      description: "BMI indicates overweight range (25.0 – 29.9).",
      status: "watch",
      range: "25.0 – 29.9",
    }
  }
  if (bmi <= 34.9) {
    return {
      category: "Obesity Class I",
      description: "Moderate risk obesity (30.0 – 34.9).",
      status: "abnormal",
      range: "30.0 – 34.9",
    }
  }
  if (bmi <= 39.9) {
    return {
      category: "Obesity Class II",
      description: "Severe risk obesity (35.0 – 39.9).",
      status: "critical",
      range: "35.0 – 39.9",
    }
  }
  return {
    category: "Obesity Class III",
    description: "Very severe / morbid obesity (≥ 40.0).",
    status: "critical",
    range: "≥ 40.0",
  }
}

export function bmiToStatus(bmi: number): ClinicalStatus {
  return classifyBmi(bmi).status
}

export interface BmiCalculatorProps extends Omit<React.ComponentProps<typeof Card>, "onCalculate" | "title"> {
  defaultUnits?: BmiUnits
  defaultHeight?: number
  defaultWeight?: number
  showGauge?: boolean
  title?: React.ReactNode
  onCalculate?: (result: {
    bmi: number
    category: string
    status: ClinicalStatus
    classification: BmiClassification
  }) => void
}

export function BmiCalculator({
  defaultUnits = "metric",
  defaultHeight,
  defaultWeight,
  showGauge = true,
  title = "BMI Calculator",
  onCalculate,
  className,
  ...props
}: BmiCalculatorProps) {
  const [units, setUnits] = React.useState<BmiUnits>(defaultUnits)
  const [heightStr, setHeightStr] = React.useState<string>(defaultHeight ? String(defaultHeight) : "")
  const [weightStr, setWeightStr] = React.useState<string>(defaultWeight ? String(defaultWeight) : "")

  const height = parseFloat(heightStr)
  const weight = parseFloat(weightStr)

  const bmi = React.useMemo(() => {
    return calculateBmi(height, weight, units)
  }, [height, weight, units])

  const classification = React.useMemo(() => {
    return bmi !== null ? classifyBmi(bmi) : null
  }, [bmi])

  React.useEffect(() => {
    if (bmi !== null && classification) {
      onCalculate?.({
        bmi,
        category: classification.category,
        status: classification.status,
        classification,
      })
    }
  }, [bmi, classification, onCalculate])

  // Gauge pointer percentage: min 15 to max 45 range mapped to 0-100%
  const gaugePercent = React.useMemo(() => {
    if (bmi === null) return 0
    const clamped = Math.min(Math.max(bmi, 15), 45)
    return ((clamped - 15) / 30) * 100
  }, [bmi])

  return (
    <Card
      data-slot="bmi-calculator"
      className={cn("w-full max-w-md overflow-hidden", className)}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-primary" />
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
        <div className="flex rounded-lg border bg-muted p-0.5 text-xs">
          <Button
            type="button"
            size="sm"
            variant={units === "metric" ? "secondary" : "ghost"}
            className="h-6 px-2.5 text-xs"
            onClick={() => setUnits("metric")}
          >
            Metric
          </Button>
          <Button
            type="button"
            size="sm"
            variant={units === "imperial" ? "secondary" : "ghost"}
            className="h-6 px-2.5 text-xs"
            onClick={() => setUnits("imperial")}
          >
            Imperial
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bmi-height" className="text-xs font-medium text-muted-foreground">
              Height ({units === "metric" ? "cm" : "in"})
            </Label>
            <div className="relative">
              <Input
                id="bmi-height"
                type="number"
                placeholder={units === "metric" ? "175" : "68"}
                value={heightStr}
                onChange={(e) => setHeightStr(e.target.value)}
                min="1"
                step="any"
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {units === "metric" ? "cm" : "in"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bmi-weight" className="text-xs font-medium text-muted-foreground">
              Weight ({units === "metric" ? "kg" : "lbs"})
            </Label>
            <div className="relative">
              <Input
                id="bmi-weight"
                type="number"
                placeholder={units === "metric" ? "70" : "150"}
                value={weightStr}
                onChange={(e) => setWeightStr(e.target.value)}
                min="1"
                step="any"
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {units === "metric" ? "kg" : "lbs"}
              </span>
            </div>
          </div>
        </div>

        {bmi !== null && classification ? (
          <div className="rounded-lg border bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Body Mass Index
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight font-mono">{bmi}</span>
                  <span className="text-xs text-muted-foreground">kg/m²</span>
                </div>
              </div>
              <ClinicalStatusBadge status={classification.status}>
                {classification.category}
              </ClinicalStatusBadge>
            </div>

            {showGauge && (
              <div className="space-y-1.5 pt-1">
                <div className="relative h-2.5 w-full rounded-full overflow-hidden flex">
                  <div className="h-full bg-clinical-watch/60 flex-[3.5]" title="Underweight (<18.5)" />
                  <div className="h-full bg-clinical-normal flex-[6.5]" title="Normal (18.5-24.9)" />
                  <div className="h-full bg-clinical-watch/80 flex-[5]" title="Overweight (25-29.9)" />
                  <div className="h-full bg-clinical-abnormal flex-[5]" title="Obese I (30-34.9)" />
                  <div className="h-full bg-clinical-critical flex-[10]" title="Obese II+ (≥35)" />
                </div>
                <div className="relative w-full h-3">
                  <div
                    className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                    style={{ left: `${Math.min(Math.max(gaugePercent, 2), 98)}%` }}
                  >
                    <div className="size-2 rounded-full border-2 border-background bg-foreground shadow" />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40+</span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {classification.description} Reference target: 18.5 – 24.9 kg/m².
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            <Activity className="size-5 mb-1 opacity-40" />
            Enter height and weight to calculate BMI
          </div>
        )}
      </CardContent>
    </Card>
  )
}
