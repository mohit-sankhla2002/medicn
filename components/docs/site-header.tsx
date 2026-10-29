import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Logo, Wordmark } from "@/components/docs/logo"
import { MobileNav } from "@/components/docs/mobile-nav"
import { ThemeCustomizerPopover } from "@/components/docs/theme-customizer"
import { ThemeToggle } from "@/components/docs/theme-toggle"
import { getDocsNav } from "@/lib/docs-nav"
import { siteConfig } from "@/lib/site"

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6a4.6 4.6 0 0 1 1.3-3.2 4.3 4.3 0 0 1 .1-3.2s1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5a4.3 4.3 0 0 1 .1 3.2 4.6 4.6 0 0 1 1.3 3.2c0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4 md:px-6">
        <MobileNav sections={getDocsNav()} />
        <Link href="/" className="mr-4 flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs">Docs</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/components/appointment-calendar">Components</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/blocks">Blocks</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/themes">Themes</Link>
          </Button>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="GitHub">
            <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
              <GitHubIcon />
            </a>
          </Button>
          <ThemeCustomizerPopover />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
