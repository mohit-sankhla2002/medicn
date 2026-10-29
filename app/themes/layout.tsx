import type { ReactNode } from "react"

import { SiteHeader } from "@/components/docs/site-header"

export default function ThemesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  )
}
