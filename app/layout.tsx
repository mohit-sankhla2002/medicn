import type { Metadata } from "next"
import type { ReactNode } from "react"

import { Analytics } from "@vercel/analytics/next"
import { ThemeCustomizerProvider } from "@/components/docs/theme-customizer"
import { ThemeProvider } from "@/components/docs/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { fontVariables } from "@/lib/fonts"
import { siteConfig } from "@/lib/site"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: `Medicn — medical components for shadcn/ui`,
    template: "%s · Medicn",
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ThemeCustomizerProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeCustomizerProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
