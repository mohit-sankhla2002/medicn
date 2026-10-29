import * as React from "react"

import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeBlock, readSource } from "@/components/docs/code-block"
import { demos } from "@/__registry__/demos"

export async function ComponentPreview({
  name,
  className,
  align = "center",
}: {
  name: string
  className?: string
  align?: "center" | "start"
}) {
  const Demo = demos[name]
  if (!Demo) {
    return <p className="text-sm text-destructive">Demo “{name}” not found.</p>
  }
  const source = await readSource(`components/demos/${name}.tsx`)
  return (
    <Tabs defaultValue="preview" className="gap-3">
      <TabsList variant="line">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <div
          className={cn(
            "flex min-h-72 w-full justify-center rounded-xl border bg-background p-4 sm:p-10",
            "bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]",
            align === "center" ? "items-center" : "items-start",
            className
          )}
        >
          <React.Suspense fallback={<div className="h-40 w-full animate-pulse rounded-lg bg-muted" />}>
            <Demo />
          </React.Suspense>
        </div>
      </TabsContent>
      <TabsContent value="code">
        <CodeBlock code={source} />
      </TabsContent>
    </Tabs>
  )
}
