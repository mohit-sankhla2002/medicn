"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { BodyMap, BodyMapSelectionList } from "@/components/medicn/body-map"
import { PainScale } from "@/components/medicn/pain-scale"

const sections = [
  { id: "personal", title: "Personal information" },
  { id: "contact", title: "Contact & emergency" },
  { id: "insurance", title: "Insurance" },
  { id: "history", title: "Medical history" },
  { id: "medications", title: "Medications & allergies" },
  { id: "visit", title: "Today's visit" },
  { id: "consent", title: "Consent" },
]

const CONDITIONS = [
  "Asthma",
  "Cancer",
  "Diabetes",
  "Heart disease",
  "High blood pressure",
  "High cholesterol",
  "Kidney disease",
  "Stroke",
  "Thyroid disease",
  "Depression / anxiety",
]

type Row = { id: number; name: string; detail: string }

function RepeatableRows({
  label,
  namePlaceholder,
  detailPlaceholder,
  addLabel,
}: {
  label: string
  namePlaceholder: string
  detailPlaceholder: string
  addLabel: string
}) {
  const [rows, setRows] = React.useState<Row[]>([{ id: 0, name: "", detail: "" }])
  const nextId = React.useRef(1)
  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              aria-label={`${namePlaceholder} ${i + 1}`}
              placeholder={namePlaceholder}
              value={row.name}
              onChange={(e) => setRows((r) => r.map((x) => (x.id === row.id ? { ...x, name: e.target.value } : x)))}
            />
            <Input
              aria-label={`${detailPlaceholder} ${i + 1}`}
              placeholder={detailPlaceholder}
              value={row.detail}
              onChange={(e) => setRows((r) => r.map((x) => (x.id === row.id ? { ...x, detail: e.target.value } : x)))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove row ${i + 1}`}
              disabled={rows.length === 1}
              onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setRows((r) => [...r, { id: nextId.current++, name: "", detail: "" }])}
      >
        <Plus /> {addLabel}
      </Button>
    </FieldSet>
  )
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function PatientIntakePage() {
  const [regions, setRegions] = React.useState<string[]>([])
  const [pain, setPain] = React.useState<number | null>(null)
  const [noAllergies, setNoAllergies] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  return (
    <div className="min-h-svh bg-muted/40">
      <div className="mx-auto grid w-full max-w-5xl gap-8 p-4 sm:p-8 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block">
          <nav aria-label="Form sections" className="sticky top-8 flex flex-col gap-1 text-sm">
            <p className="mb-2 font-semibold">New patient intake</p>
            {sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
                <span className="mr-2 tabular-nums">{i + 1}.</span>
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        <form
          className="flex min-w-0 flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(true)
          }}
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Riverside Clinic</h1>
            <p className="text-muted-foreground">This takes about 10 minutes. Fields marked * are required.</p>
          </div>

          <Section id="personal" title="Personal information">
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="first">Legal first name *</FieldLabel>
                <Input id="first" autoComplete="given-name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="last">Legal last name *</FieldLabel>
                <Input id="last" autoComplete="family-name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="preferred">Preferred name</FieldLabel>
                <Input id="preferred" autoComplete="nickname" />
              </Field>
              <Field>
                <FieldLabel htmlFor="dob">Date of birth *</FieldLabel>
                <Input id="dob" type="date" autoComplete="bday" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="sex">Sex assigned at birth *</FieldLabel>
                <Select required>
                  <SelectTrigger id="sex" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="intersex">Intersex</SelectItem>
                    <SelectItem value="unknown">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="pronouns">Pronouns</FieldLabel>
                <Input id="pronouns" placeholder="e.g. she/her, they/them" />
              </Field>
              <Field>
                <FieldLabel htmlFor="language">Preferred language</FieldLabel>
                <Input id="language" defaultValue="English" />
              </Field>
              <Field orientation="horizontal" className="self-end">
                <Switch id="interpreter" />
                <FieldLabel htmlFor="interpreter" className="font-normal">
                  I need an interpreter
                </FieldLabel>
              </Field>
            </FieldGroup>
          </Section>

          <Section id="contact" title="Contact & emergency">
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone">Mobile phone *</FieldLabel>
                <Input id="phone" type="tel" autoComplete="tel" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" autoComplete="email" />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Input id="address" autoComplete="street-address" />
              </Field>
              <FieldSeparator className="sm:col-span-2">Emergency contact</FieldSeparator>
              <Field>
                <FieldLabel htmlFor="ec-name">Name *</FieldLabel>
                <Input id="ec-name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="ec-phone">Phone *</FieldLabel>
                <Input id="ec-phone" type="tel" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="ec-relation">Relationship</FieldLabel>
                <Input id="ec-relation" placeholder="e.g. Spouse" />
              </Field>
            </FieldGroup>
          </Section>

          <Section id="insurance" title="Insurance">
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <FieldSet className="sm:col-span-2">
                <FieldLegend variant="label">How will you pay?</FieldLegend>
                <RadioGroup defaultValue="insurance" className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["insurance", "Health insurance", "We'll bill your plan directly."],
                    ["self", "Self-pay", "Pay at the time of your visit."],
                  ].map(([value, title, desc]) => (
                    <FieldLabel key={value} htmlFor={`pay-${value}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <span className="font-medium">{title}</span>
                          <FieldDescription>{desc}</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={value} id={`pay-${value}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </FieldSet>
              <Field>
                <FieldLabel htmlFor="payer">Insurance provider</FieldLabel>
                <Input id="payer" placeholder="e.g. Aetna" />
              </Field>
              <Field>
                <FieldLabel htmlFor="member">Member ID</FieldLabel>
                <Input id="member" className="font-mono" />
              </Field>
              <Field>
                <FieldLabel htmlFor="group">Group number</FieldLabel>
                <Input id="group" className="font-mono" />
              </Field>
              <Field>
                <FieldLabel htmlFor="card">Insurance card (front)</FieldLabel>
                <Input id="card" type="file" accept="image/*,.pdf" />
              </Field>
            </FieldGroup>
          </Section>

          <Section id="history" title="Medical history" description="Select any condition you have been diagnosed with.">
            <FieldGroup>
              <div className="grid gap-3 sm:grid-cols-2">
                {CONDITIONS.map((c) => {
                  const id = `cond-${c.toLowerCase().replace(/[^a-z]+/g, "-")}`
                  return (
                    <Field key={c} orientation="horizontal">
                      <Checkbox id={id} />
                      <FieldLabel htmlFor={id} className="font-normal">
                        {c}
                      </FieldLabel>
                    </Field>
                  )
                })}
              </div>
              <Field>
                <FieldLabel htmlFor="surgeries">Past surgeries or hospital stays</FieldLabel>
                <Textarea id="surgeries" placeholder="Procedure and year, e.g. Appendectomy 2015" />
              </Field>
              <Field>
                <FieldLabel htmlFor="family">Family history</FieldLabel>
                <Textarea id="family" placeholder="e.g. Mother — breast cancer at 52" />
              </Field>
            </FieldGroup>
          </Section>

          <Section id="medications" title="Medications & allergies">
            <FieldGroup>
              <RepeatableRows
                label="Current medications"
                namePlaceholder="Medication"
                detailPlaceholder="Dose and how often"
                addLabel="Add medication"
              />
              <FieldSeparator />
              <Field orientation="horizontal">
                <Checkbox id="nkda" checked={noAllergies} onCheckedChange={(v) => setNoAllergies(v === true)} />
                <FieldLabel htmlFor="nkda" className="font-normal">
                  I have no known drug allergies
                </FieldLabel>
              </Field>
              {!noAllergies && (
                <RepeatableRows
                  label="Allergies"
                  namePlaceholder="Allergen"
                  detailPlaceholder="Reaction"
                  addLabel="Add allergy"
                />
              )}
            </FieldGroup>
          </Section>

          <Section id="visit" title="Today's visit" description="Show us where the problem is and how much it hurts.">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="reason">Main reason for your visit *</FieldLabel>
                <Textarea id="reason" required placeholder="e.g. Lower back pain for two weeks after lifting" />
              </Field>
              <div className="grid items-start gap-6 md:grid-cols-[260px_1fr]">
                <div className="flex flex-col items-center gap-3">
                  <BodyMap value={regions} onValueChange={setRegions} className="max-w-[240px]" />
                </div>
                <div className="flex flex-col gap-5">
                  <FieldSet>
                    <FieldLegend variant="label">Affected areas</FieldLegend>
                    <BodyMapSelectionList
                      value={regions}
                      onRemove={(id) => setRegions((r) => r.filter((x) => x !== id))}
                    />
                  </FieldSet>
                  <FieldSet>
                    <FieldLegend variant="label">Pain right now</FieldLegend>
                    <PainScale value={pain} onValueChange={setPain} size="sm" />
                  </FieldSet>
                </div>
              </div>
            </FieldGroup>
          </Section>

          <Section id="consent" title="Consent">
            <FieldGroup>
              {[
                ["consent-treat", "I consent to examination and treatment by Riverside Clinic providers. *"],
                ["consent-privacy", "I have received the Notice of Privacy Practices. *"],
                ["consent-sms", "Send me appointment reminders by text message."],
              ].map(([id, label]) => (
                <Field key={id} orientation="horizontal">
                  <Checkbox id={id} required={label.endsWith("*")} />
                  <FieldLabel htmlFor={id} className="font-normal">
                    {label}
                  </FieldLabel>
                </Field>
              ))}
              <Field>
                <FieldLabel htmlFor="signature">Type your full name to sign *</FieldLabel>
                <Input id="signature" required className="font-serif text-lg italic" />
              </Field>
            </FieldGroup>
          </Section>

          <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
            <p className="text-sm text-muted-foreground">
              {submitted ? "Thanks — your intake was submitted." : "Your answers are encrypted and shared only with your care team."}
            </p>
            <Button type="submit">Submit intake</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
