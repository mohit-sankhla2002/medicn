import type { Metadata } from "next"
import Link from "next/link"

import { ThemeCustomizerControls } from "@/components/docs/theme-customizer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { demos } from "@/__registry__/demos"

export const metadata: Metadata = {
  title: "Themes",
  description: "Pick colours, clinical status palette, radius and font, preview them on real components, and copy the CSS.",
}

function Preview({ demo, title, className }: { demo: string; title: string; className?: string }) {
  const Demo = demos[demo]
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 justify-center">
        <div className="w-full min-w-0">
          <Demo />
        </div>
      </CardContent>
    </Card>
  )
}

export default function ThemesPage() {
  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 py-10 md:px-6">
      <div className="mb-10 flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Themes</h1>
        <p className="text-lg text-muted-foreground">
          Choose a primary colour, base colour, clinical status palette, radius and font. The whole site updates as you
          go. When you like it, copy the CSS into your app. See{" "}
          <Link href="/docs/theming" className="font-medium text-foreground underline underline-offset-4">
            Theming
          </Link>{" "}
          for how the tokens work.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Customize</CardTitle>
              <CardDescription>Saved in this browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeCustomizerControls />
            </CardContent>
          </Card>
        </aside>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <Preview demo="patient-header-demo" title="Patient header" className="xl:col-span-2" />
          <Preview demo="vital-signs-demo" title="Vital signs" className="xl:col-span-2" />
          <Preview demo="pain-scale-demo" title="Pain scale" />
          <Preview demo="clinical-status-badge-demo" title="Clinical status" />
          <Preview demo="body-map-intensity-demo" title="Body map" />
          <div className="flex min-w-0 flex-col gap-6">
            <Preview demo="medication-list-demo" title="Medications" />
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Primitives</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="theme-preview-email">Email</Label>
                  <Input id="theme-preview-email" placeholder="patient@example.com" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button>Book visit</Button>
                  <Button variant="secondary">Reschedule</Button>
                  <Button variant="outline">Details</Button>
                  <Button variant="destructive">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <Preview demo="appointment-calendar-day-demo" title="Appointment calendar" className="xl:col-span-2" />
          <Preview demo="vitals-form-demo" title="Vitals form" className="xl:col-span-2" />
        </div>
      </div>
    </main>
  )
}
