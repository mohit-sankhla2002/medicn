"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  Circle,
  Dna,
  Heart,
  Plus,
  Search,
  Square,
  User,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"

export interface FamilyMemberCondition {
  condition: string
  ageOfOnset?: number
  note?: string
}

export interface FamilyMember {
  id: string
  relationship: string
  label: string
  sex: "male" | "female" | "other"
  deceased?: boolean
  ageAtDeath?: number
  causeOfDeath?: string
  conditions: FamilyMemberCondition[]
}

const relationshipOrder: Record<string, number> = {
  father: 1,
  mother: 2,
  paternalGrandfather: 3,
  paternalGrandmother: 4,
  maternalGrandfather: 5,
  maternalGrandmother: 6,
  brother: 7,
  sister: 8,
  son: 9,
  daughter: 10,
}

export function sortFamilyMembers(members: FamilyMember[]): FamilyMember[] {
  return [...members].sort((a, b) => {
    const orderA = relationshipOrder[a.relationship] ?? 99
    const orderB = relationshipOrder[b.relationship] ?? 99
    return orderA - orderB
  })
}

export function getFamilyConditionsSummary(
  members: FamilyMember[]
): { condition: string; affectedCount: number; members: string[] }[] {
  const map = new Map<string, string[]>()
  for (const m of members) {
    for (const c of m.conditions) {
      const existing = map.get(c.condition) ?? []
      if (!existing.includes(m.label)) {
        existing.push(m.label)
      }
      map.set(c.condition, existing)
    }
  }

  return Array.from(map.entries())
    .map(([condition, membersList]) => ({
      condition,
      affectedCount: membersList.length,
      members: membersList,
    }))
    .sort((a, b) => b.affectedCount - a.affectedCount)
}

export interface FamilyHistoryProps extends Omit<React.ComponentProps<"div">, "title"> {
  members: FamilyMember[]
  onAddMember?: () => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function FamilyHistory({
  members: initialMembers,
  onAddMember,
  readOnly = false,
  title = "Family Medical History & Pedigree",
  className,
  ...props
}: FamilyHistoryProps) {
  const [search, setSearch] = React.useState("")

  const sorted = React.useMemo(() => sortFamilyMembers(initialMembers), [initialMembers])

  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return sorted
    const q = search.trim().toLowerCase()
    return sorted.filter((m) => {
      const matchesName = m.label.toLowerCase().includes(q)
      const matchesCond = m.conditions.some((c) => c.condition.toLowerCase().includes(q))
      const matchesCause = m.causeOfDeath?.toLowerCase().includes(q)
      return matchesName || matchesCond || matchesCause
    })
  }, [sorted, search])

  const conditionSummary = React.useMemo(
    () => getFamilyConditionsSummary(initialMembers),
    [initialMembers]
  )

  return (
    <div
      data-slot="family-history"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Dna className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">Heritable Disease Risk & Pedigree Record</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && onAddMember && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onAddMember}>
              <Plus className="mr-1 size-3.5" /> Add Family Member
            </Button>
          )}
        </div>
      </div>

      {/* Aggregate Conditions Quick Bar */}
      {conditionSummary.length > 0 && (
        <div className="border-b bg-muted/20 px-5 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase mr-1">
              Top Heritable Risks:
            </span>
            {conditionSummary.slice(0, 4).map((cond, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground"
              >
                <span>{cond.condition}</span>
                <span className="font-mono text-primary font-bold">({cond.affectedCount})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="border-b p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conditions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Members Grid / List */}
      <div className="p-5">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No family members matching &quot;{search}&quot;.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => {
              const isMale = member.sex === "male"

              return (
                <div
                  key={member.id}
                  className="rounded-lg border bg-card p-3.5 text-xs shadow-xs space-y-2.5 transition-colors hover:bg-muted/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Pedigree Glyph: Square for male, circle for female */}
                      <div className="relative flex size-6 shrink-0 items-center justify-center rounded border bg-muted/40 text-primary">
                        {isMale ? (
                          <Square className="size-4" />
                        ) : (
                          <Circle className="size-4" />
                        )}
                        {member.deceased && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-0.5 bg-destructive rotate-45" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground text-sm leading-tight block">
                          {member.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {member.sex}
                        </span>
                      </div>
                    </div>

                    {member.deceased && (
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Deceased {member.ageAtDeath ? `(Age ${member.ageAtDeath})` : ""}
                      </span>
                    )}
                  </div>

                  {member.causeOfDeath && (
                    <p className="text-[11px] text-destructive italic">
                      Cause: {member.causeOfDeath}
                    </p>
                  )}

                  {/* Documented Conditions */}
                  <div className="space-y-1.5 pt-1 border-t">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Conditions ({member.conditions.length})
                    </span>
                    {member.conditions.length === 0 ? (
                      <span className="text-muted-foreground italic text-[11px]">No known conditions</span>
                    ) : (
                      <ul className="space-y-1">
                        {member.conditions.map((cond, cIdx) => (
                          <li
                            key={cIdx}
                            className="rounded-md border bg-muted/30 p-1.5 space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-medium text-foreground">{cond.condition}</span>
                              {cond.ageOfOnset != null && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  onset: {cond.ageOfOnset}y
                                </span>
                              )}
                            </div>
                            {cond.note && (
                              <p className="text-[10px] text-muted-foreground">{cond.note}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
