"use client"

import * as React from "react"
import { ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const widths = { desktop: "100%", tablet: "768px", mobile: "390px" } as const

export function BlockViewer({ name, code }: { name: string; code: React.ReactNode }) {
  const [size, setSize] = React.useState<keyof typeof widths>("desktop")
  return (
    <Tabs defaultValue="preview" className="gap-3">
      <div className="flex items-center justify-between gap-2">
        <TabsList variant="line">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-1">
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={size}
            onValueChange={(v) => v && setSize(v as keyof typeof widths)}
            className="hidden lg:flex"
            aria-label="Preview width"
          >
            <ToggleGroupItem value="desktop" aria-label="Desktop">
              <Monitor />
            </ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet">
              <Tablet />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Mobile">
              <Smartphone />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button asChild variant="ghost" size="icon-sm" aria-label="Open in new tab">
            <a href={`/view/${name}`} target="_blank" rel="noreferrer">
              <ExternalLink />
            </a>
          </Button>
        </div>
      </div>
      <TabsContent value="preview">
        <div className="flex justify-center overflow-hidden rounded-xl border bg-muted/40">
          <iframe
            src={`/view/${name}`}
            title={`${name} preview`}
            loading="lazy"
            style={{ width: widths[size] }}
            className={cn("h-[820px] max-w-full bg-background transition-[width]", size !== "desktop" && "border-x")}
          />
        </div>
      </TabsContent>
      <TabsContent value="code">{code}</TabsContent>
    </Tabs>
  )
}
