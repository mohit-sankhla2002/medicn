"use client"

import * as React from "react"
import { ClipboardCheck, MousePointerClick } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BodyMap, BodyMapSelectionList, getBodyRegionLabel, type BodySex } from "@/components/medicn/body-map"
import { getPainLevel, PainScale } from "@/components/medicn/pain-scale"

const SYMPTOMS = ["Pain", "Aching", "Burning", "Numbness", "Tingling", "Swelling", "Stiffness", "Rash", "Weakness"]

const ONSET = [
  { value: "today", label: "Today" },
  { value: "days", label: "1–6 days ago" },
  { value: "weeks", label: "1–4 weeks ago" },
  { value: "months", label: "1–6 months ago" },
  { value: "chronic", label: "More than 6 months" },
]

export interface SymptomReport {
  sex: BodySex
  regions: string[]
  intensity: Record<string, number>
  symptoms: string[]
  onset?: string
  pattern?: string
  notes: string
}

export default function SymptomReportPage() {
  const [sex, setSex] = React.useState<BodySex>("female")
  const [regions, setRegions] = React.useState<string[]>([])
  const [intensity, setIntensity] = React.useState<Record<string, number>>({})
  const [active, setActive] = React.useState<string | null>(null)
  const [symptoms, setSymptoms] = React.useState<string[]>([])
  const [onset, setOnset] = React.useState<string>()
  const [pattern, setPattern] = React.useState<string>("")
  const [notes, setNotes] = React.useState("")
  const [submitted, setSubmitted] = React.useState<SymptomReport | null>(null)

  const onRegionsChange = (next: string[]) => {
    const added = next.find((id) => !regions.includes(id))
    setRegions(next)
    if (added) setActive(added)
    else if (active && !next.includes(active)) setActive(next[next.length - 1] ?? null)
    setIntensity((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => next.includes(id))))
  }

  const removeRegion = (id: string) => onRegionsChange(regions.filter((r) => r !== id))

  const worst = Math.max(0, ...Object.values(intensity))
  const canSubmit = regions.length > 0 && symptoms.length > 0

  return (
    <div className="min-h-svh bg-muted/40 p-4 sm:p-8">
      <form
        className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,420px)_1fr]"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted({ sex, regions, intensity, symptoms, onset, pattern, notes })
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Where does it hurt?</CardTitle>
            <CardDescription>
              Tap every area that&apos;s affected. Tap your face, a hand or a foot to zoom in for more detail.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <BodyMap
              value={regions}
              onValueChange={onRegionsChange}
              intensity={intensity}
              sex={sex}
              onSexChange={setSex}
              showSexToggle
              className="max-w-[300px]"
            />
            <BodyMapSelectionList
              value={regions}
              intensity={intensity}
              sex={sex}
              onRemove={removeRegion}
              emptyText={
                <span className="inline-flex items-center gap-1.5">
                  <MousePointerClick className="size-4" /> No areas selected yet
                </span>
              }
              className="w-full justify-center"
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>How bad is it?</CardTitle>
              <CardDescription>Rate each area from 0 (no pain) to 10 (worst imaginable).</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {regions.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Select an area on the body map to rate it.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Affected areas">
                    {regions.map((id) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active === id}
                        onClick={() => setActive(id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          active === id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        {getBodyRegionLabel(id, { sex })}
                        {intensity[id] != null && <span className="ml-1.5 tabular-nums opacity-80">{intensity[id]}</span>}
                      </button>
                    ))}
                  </div>
                  {active && (
                    <PainScale
                      key={active}
                      label={`Pain intensity for ${getBodyRegionLabel(active, { sex })}`}
                      value={intensity[active] ?? null}
                      onValueChange={(value) => setIntensity((prev) => ({ ...prev, [active]: value }))}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tell us more</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <FieldSet>
                  <FieldLegend variant="label">What does it feel like?</FieldLegend>
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    spacing={2}
                    value={symptoms}
                    onValueChange={setSymptoms}
                    className="flex-wrap"
                  >
                    {SYMPTOMS.map((s) => (
                      <ToggleGroupItem key={s} value={s} className="data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
                        {s}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FieldSet>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="onset">When did it start?</FieldLabel>
                    <Select value={onset} onValueChange={setOnset}>
                      <SelectTrigger id="onset" className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {ONSET.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Is it constant?</FieldLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={pattern}
                      onValueChange={setPattern}
                      className="w-full *:flex-1"
                    >
                      <ToggleGroupItem value="constant">Constant</ToggleGroupItem>
                      <ToggleGroupItem value="comes-and-goes">Comes & goes</ToggleGroupItem>
                    </ToggleGroup>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="notes">Anything else?</FieldLabel>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What makes it better or worse? Any injury, fever, or recent travel?"
                  />
                  <FieldDescription>
                    If you have chest pain, trouble breathing or sudden weakness, call your local emergency number now.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-between gap-3 border-t">
              <p className="text-sm text-muted-foreground">
                {regions.length} area{regions.length === 1 ? "" : "s"}
                {worst > 0 && ` · worst ${worst}/10 (${getPainLevel(worst).label.toLowerCase()})`}
              </p>
              <Button type="submit" disabled={!canSubmit}>
                <ClipboardCheck /> Submit report
              </Button>
            </CardFooter>
          </Card>

          {submitted && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Submitted payload</CardTitle>
                <CardDescription>Send this to your API or map it to a FHIR Observation.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(submitted, null, 2)}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    </div>
  )
}
