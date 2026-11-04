"use client"

import * as React from "react"
import {
  Activity,
  Check,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  Plus,
  Scan,
  Search,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

export type OrderCategory = "lab" | "imaging" | "referral" | "procedure" | "nursing"
export type OrderUrgency = "stat" | "asap" | "routine" | "timed"
export type OrderStatus = "pending" | "active" | "completed" | "cancelled"

export interface OrderItem {
  id: string
  name: string
  code?: string
  category: OrderCategory
  urgency?: OrderUrgency
  frequency?: string
  instructions?: string
  diagnosis?: string
  status?: OrderStatus
}

export interface OrderCatalogItem {
  name: string
  code?: string
  category: OrderCategory
  description?: string
}

export const ORDER_CATEGORIES: Record<
  OrderCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  lab: { label: "Laboratory", icon: FlaskConical },
  imaging: { label: "Radiology / Imaging", icon: Scan },
  referral: { label: "Consult / Referral", icon: UserPlus },
  procedure: { label: "Procedure", icon: Activity },
  nursing: { label: "Nursing Care", icon: HeartPulse },
}

export const ORDER_URGENCY_LABELS: Record<OrderUrgency, string> = {
  stat: "STAT",
  asap: "ASAP",
  routine: "Routine",
  timed: "Timed",
}

const urgencyPriority: Record<OrderUrgency, number> = {
  stat: 0,
  asap: 1,
  timed: 2,
  routine: 3,
}

export function sortOrders(orders: OrderItem[]): OrderItem[] {
  return [...orders].sort((a, b) => {
    const urgA = urgencyPriority[a.urgency ?? "routine"]
    const urgB = urgencyPriority[b.urgency ?? "routine"]
    if (urgA !== urgB) return urgA - urgB
    return a.name.localeCompare(b.name)
  })
}

export interface OrderEntryProps extends Omit<React.ComponentProps<"div">, "title" | "onSubmit"> {
  catalog: OrderCatalogItem[]
  defaultBasket?: OrderItem[]
  onSubmit?: (basket: OrderItem[]) => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function OrderEntry({
  catalog,
  defaultBasket = [],
  onSubmit,
  readOnly = false,
  title = "Order Entry (CPOE)",
  className,
  ...props
}: OrderEntryProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<OrderCategory | "all">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [basket, setBasket] = React.useState<OrderItem[]>(defaultBasket)

  const filteredCatalog = React.useMemo(() => {
    return catalog.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.code && item.code.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
      return matchesCategory && matchesQuery
    })
  }, [catalog, selectedCategory, searchQuery])

  const addToBasket = (catItem: OrderCatalogItem) => {
    const newOrder: OrderItem = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: catItem.name,
      code: catItem.code,
      category: catItem.category,
      urgency: "routine",
      status: "pending",
    }
    setBasket((prev) => [...prev, newOrder])
  }

  const removeFromBasket = (id: string) => {
    setBasket((prev) => prev.filter((o) => o.id !== id))
  }

  const updateOrderUrgency = (id: string, urgency: OrderUrgency) => {
    setBasket((prev) => prev.map((o) => (o.id === id ? { ...o, urgency } : o)))
  }

  const handleSubmit = () => {
    onSubmit?.(basket)
  }

  return (
    <div
      data-slot="order-entry"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground">
            {basket.length} pending {basket.length === 1 ? "order" : "orders"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-5">
        {/* Catalog column (3 cols) */}
        <div className="space-y-3 lg:col-span-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                size="sm"
                variant={selectedCategory === "all" ? "secondary" : "ghost"}
                className="h-7 px-2 text-[11px]"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {(Object.keys(ORDER_CATEGORIES) as OrderCategory[]).map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant={selectedCategory === cat ? "secondary" : "ghost"}
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {ORDER_CATEGORIES[cat].label.split(" ")[0]}
                </Button>
              ))}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border divide-y divide-border">
            {filteredCatalog.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No matching order items found.
              </div>
            ) : (
              filteredCatalog.map((item, idx) => {
                const Icon = ORDER_CATEGORIES[item.category].icon
                const inBasket = basket.some((b) => b.name === item.name)

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 hover:bg-muted/30"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-medium text-foreground">
                            {item.name}
                          </span>
                          {item.code && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.code}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {!readOnly && (
                      <Button
                        type="button"
                        size="sm"
                        variant={inBasket ? "secondary" : "outline"}
                        className="h-7 shrink-0 text-xs"
                        aria-label="Add to basket"
                        onClick={() => addToBasket(item)}
                      >
                        <Plus className="size-3" />
                        <span className="hidden sm:inline ml-1">Add</span>
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Order Basket column (2 cols) */}
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Order Basket
              </span>
              <span className="text-xs text-muted-foreground">
                {basket.length} {basket.length === 1 ? "item" : "items"}
              </span>
            </div>

            {basket.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No orders in basket. Select items from the catalog.
              </div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {basket.map((order) => {
                  return (
                    <li
                      key={order.id}
                      className="rounded-md border bg-card p-2 text-xs shadow-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium text-foreground">{order.name}</span>
                        {!readOnly && (
                          <button
                            type="button"
                            aria-label="Remove order"
                            onClick={() => removeFromBasket(order.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {order.category}
                        </span>
                        {!readOnly ? (
                          <div className="flex rounded border bg-muted text-[10px]">
                            {(["routine", "stat"] as OrderUrgency[]).map((u) => (
                              <button
                                key={u}
                                type="button"
                                className={cn(
                                  "px-1.5 py-0.5 font-medium rounded-xs transition-colors",
                                  order.urgency === u
                                    ? u === "stat"
                                      ? "bg-clinical-critical text-white"
                                      : "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground"
                                )}
                                onClick={() => updateOrderUrgency(order.id, u)}
                              >
                                {ORDER_URGENCY_LABELS[u]}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <ClinicalStatusBadge
                            status={order.urgency === "stat" ? "critical" : "normal"}
                            className="text-[10px]"
                          >
                            {ORDER_URGENCY_LABELS[order.urgency ?? "routine"]}
                          </ClinicalStatusBadge>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {!readOnly && (
            <div className="pt-2 border-t">
              <Button
                type="button"
                className="w-full text-xs h-8"
                disabled={basket.length === 0}
                onClick={handleSubmit}
              >
                <Send className="mr-1.5 size-3.5" />
                Sign & Place Orders ({basket.length})
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
