import Link from "next/link"
import { ArrowRight, CalendarDays, ClipboardList, HeartPulse, PersonStanding } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InstallCommand } from "@/components/docs/install-command"
import { SiteHeader } from "@/components/docs/site-header"
import { registryUrl, siteConfig } from "@/lib/site"
import { registryItems } from "@/registry/items"
import BodyMapDemo from "@/components/demos/body-map-demo"
import PainScaleDemo from "@/components/demos/pain-scale-demo"
import VitalSignCardDemo from "@/components/demos/vital-sign-card-demo"
import AppointmentCalendarDemo from "@/components/demos/appointment-calendar-demo"

const features = [
  { icon: CalendarDays, title: "Scheduling", text: "Day, week and month calendars with provider columns and a self-booking slot picker." },
  { icon: PersonStanding, title: "Anatomy", text: "A front/back body map with 54 regions so patients can show exactly where it hurts." },
  { icon: ClipboardList, title: "Clinical forms", text: "Pain scales, vitals entry with units and validation, intake and SOAP note layouts." },
  { icon: HeartPulse, title: "Clinical data", text: "Vital sign cards, status badges, medication lists and patient banners." },
]

function Tile({ title, href, className, children }: { title: string; href: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-card ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-sm font-medium">{title}</span>
        <Link href={href} className="text-xs text-muted-foreground hover:text-foreground">
          Docs →
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center p-5">{children}</div>
    </div>
  )
}

export default function Home() {
  const componentCount = registryItems.filter((i) => i.type === "registry:component").length
  const blockCount = registryItems.filter((i) => i.type === "registry:block").length

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          />
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
            <Link
              href="/blocks"
              className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {componentCount} components · {blockCount} blocks
              <ArrowRight className="size-3" />
            </Link>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Medical UI for shadcn/ui
            </h1>
            <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{siteConfig.description}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/docs">
                  Get started <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/blocks">Browse blocks</Link>
              </Button>
            </div>
            <div className="w-full max-w-xl text-left">
              <InstallCommand args={`add ${registryUrl("body-map")}`} />
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-screen-xl gap-4 px-4 py-16 md:grid-cols-3 md:px-6">
          <Tile title="Body Map" href="/docs/components/body-map" className="md:row-span-2">
            <BodyMapDemo />
          </Tile>
          <Tile title="Pain Scale" href="/docs/components/pain-scale" className="md:col-span-2">
            <PainScaleDemo />
          </Tile>
          <Tile title="Vital Signs" href="/docs/components/vital-signs" className="md:col-span-2">
            <VitalSignCardDemo />
          </Tile>
          <Tile title="Appointment Calendar" href="/docs/components/appointment-calendar" className="md:col-span-3">
            <div className="w-full">
              <AppointmentCalendarDemo />
            </div>
          </Tile>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto grid max-w-screen-xl gap-8 px-4 py-16 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col gap-2">
                <f.icon className="size-5 text-primary" />
                <h2 className="font-semibold">{f.title}</h2>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built on shadcn/ui. Open source. Not a medical device — validate clinical defaults before use.
      </footer>
    </>
  )
}
