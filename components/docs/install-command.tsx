"use client"

import * as React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyButton } from "@/components/docs/copy-button"

const managers = {
  pnpm: "pnpm dlx shadcn@latest",
  npm: "npx shadcn@latest",
  yarn: "yarn dlx shadcn@latest",
  bun: "bunx --bun shadcn@latest",
} as const

export function InstallCommand({ args }: { args: string }) {
  return (
    <Tabs defaultValue="pnpm" className="gap-0 overflow-hidden rounded-xl border bg-muted/40">
      <div className="flex items-center border-b px-2">
        <TabsList variant="line" className="h-10">
          {Object.keys(managers).map((m) => (
            <TabsTrigger key={m} value={m} className="font-mono text-xs">
              {m}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {Object.entries(managers).map(([m, prefix]) => {
        const command = `${prefix} ${args}`
        return (
          <TabsContent key={m} value={m} className="relative">
            <pre className="overflow-x-auto px-4 py-3.5 pr-12 font-mono text-[13px]">
              <code>{command}</code>
            </pre>
            <CopyButton value={command} className="absolute top-2 right-2" />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
