import { readFile } from "node:fs/promises"
import path from "node:path"
import { codeToHtml } from "shiki"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/docs/copy-button"

export async function highlight(code: string, lang = "tsx") {
  "use cache"
  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: "light",
  })
}

export async function readSource(file: string) {
  "use cache"
  return (await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), file), "utf8")).trimEnd()
}

export async function CodeBlock({
  code,
  lang = "tsx",
  title,
  className,
  maxHeight = true,
}: {
  code: string
  lang?: string
  title?: string
  className?: string
  maxHeight?: boolean
}) {
  const html = await highlight(code, lang)
  return (
    <figure className={cn("group relative overflow-hidden rounded-xl border bg-muted/40", className)}>
      {title && (
        <figcaption className="flex h-10 items-center border-b px-4 font-mono text-xs text-muted-foreground">
          {title}
        </figcaption>
      )}
      <CopyButton value={code} className={cn("absolute right-2", title ? "top-1.5" : "top-2")} />
      <div
        className={cn(
          "overflow-auto p-4 text-[13px] leading-relaxed [&_pre]:font-mono [&_pre]:outline-none",
          maxHeight && "max-h-[480px]"
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  )
}
