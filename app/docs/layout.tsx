import type { ReactNode } from "react"

import { DocsSidebarNav } from "@/components/docs/docs-sidebar"
import { SiteHeader } from "@/components/docs/site-header"
import { getDocsNav } from "@/lib/docs-nav"

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-10 px-4 md:px-6">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 md:block">
          <DocsSidebarNav sections={getDocsNav()} />
        </aside>
        <main className="min-w-0 flex-1 py-8 pb-24">{children}</main>
      </div>
    </>
  )
}
