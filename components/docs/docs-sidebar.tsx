"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import type { NavSection } from "@/lib/docs-nav"

export function DocsSidebarNav({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-6 text-sm">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <h4 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{section.title}</h4>
          {section.items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2 py-1.5 transition-colors hover:bg-muted hover:text-foreground",
                  active ? "bg-muted font-medium text-foreground" : "text-foreground/70"
                )}
              >
                {item.title}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
