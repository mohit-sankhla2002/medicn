"use client"

import * as React from "react"
import { ReceiptText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WorkflowState } from "@/components/medicn/workflow-state"

export type BillingStatus = "draft" | "due" | "partially-paid" | "paid" | "overdue" | "void"

export interface BillingStatement {
  id: string
  patientName: string
  currency: string
  status: BillingStatus
  issuedAt?: string
  dueAt?: string
  items: { id: string; description: string; detail?: string; amountMinor: number }[]
  /** Authoritative server totals, including any insurance/discount/tax adjustments. */
  totals?: { label: string; amountMinor: number }[]
  balanceMinor: number
}

/** Currency-aware minor units: 1234 USD → $12.34; 1234 JPY → ¥1,234. */
export function formatBillingAmount(amountMinor: number, currency: string, locale = "en-US") {
  if (!Number.isSafeInteger(amountMinor)) return "—"
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency })
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2
  return formatter.format(amountMinor / 10 ** digits)
}

export interface BillingSummaryProps extends Omit<React.ComponentProps<"section">, "title" | "children"> {
  statement?: BillingStatement
  title?: React.ReactNode
  locale?: string
  formatAmount?: (amountMinor: number, currency: string) => string
  onPay?: (statement: BillingStatement) => void
  onDownload?: (statement: BillingStatement) => void
  pending?: boolean
  note?: React.ReactNode
  isLoading?: boolean
  error?: React.ReactNode
  onRetry?: () => void
  labels?: Partial<Record<BillingStatus | "balance" | "dueAt" | "pay" | "download" | "empty" | "loading" | "error" | "retry", string>>
}

/** Display and action entry points only; no payment or claim is submitted by this UI. */
export function BillingSummary({ statement, title = "Billing summary", locale = "en-US", formatAmount, onPay, onDownload, pending, note, isLoading, error, onRetry, labels, className, ...props }: BillingSummaryProps) {
  const id = React.useId()
  const text = { draft: "Draft", due: "Payment due", "partially-paid": "Partially paid", paid: "Paid", overdue: "Overdue", void: "Void", balance: "Amount due", dueAt: "Due", pay: "Make a payment", download: "Download statement", empty: "No billing statement available", loading: "Loading statement…", error: "Could not load statement", retry: "Try again", ...labels }
  const amount = (value: number) => formatAmount ? formatAmount(value, statement!.currency) : formatBillingAmount(value, statement!.currency, locale)
  const canPay = statement && statement.balanceMinor > 0 && ["due", "partially-paid", "overdue"].includes(statement.status)
  return (
    <section data-slot="billing-summary" aria-labelledby={`${id}-title`} aria-busy={isLoading || pending || undefined} className={cn("w-full overflow-hidden rounded-xl border bg-card text-card-foreground", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4"><h3 id={`${id}-title`} className="flex items-center gap-2 font-semibold"><ReceiptText aria-hidden className="size-4 text-muted-foreground" />{title}</h3>{statement && !isLoading && !error && <Badge variant="secondary">{text[statement.status]}</Badge>}</div>
      {isLoading ? <WorkflowState state="loading" title={text.loading} /> : error ? <WorkflowState state="error" title={text.error} description={error} onRetry={onRetry} retryLabel={text.retry} /> : !statement ? <WorkflowState state="empty" title={text.empty} /> : <>
        <div className="space-y-1 border-b px-5 py-4 text-sm"><p className="font-medium">{statement.patientName}</p><p className="text-xs text-muted-foreground">{statement.id}{statement.issuedAt ? ` · ${statement.issuedAt}` : ""}</p>{statement.dueAt && <p className="text-xs text-muted-foreground">{text.dueAt}: {statement.dueAt}</p>}</div>
        <ul className="divide-y px-5">{statement.items.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm"><div><p>{item.description}</p>{item.detail && <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>}</div><span className="shrink-0 tabular-nums">{amount(item.amountMinor)}</span></li>)}</ul>
        <dl className="space-y-2 border-t bg-muted/20 px-5 py-4 text-sm">{statement.totals?.map((total, index) => <div key={index} className="flex justify-between gap-4 text-muted-foreground"><dt>{total.label}</dt><dd className="tabular-nums">{amount(total.amountMinor)}</dd></div>)}<div className="flex justify-between gap-4 pt-2 text-base font-semibold"><dt>{text.balance}</dt><dd className="tabular-nums">{amount(statement.balanceMinor)}</dd></div></dl>
        {note && <div className="px-5 pb-4 text-xs text-muted-foreground">{note}</div>}
        {(onDownload || (canPay && onPay)) && <div className="flex flex-wrap gap-2 border-t px-5 py-4">{canPay && onPay && <Button type="button" disabled={pending} onClick={() => onPay(statement)}>{text.pay}</Button>}{onDownload && <Button type="button" variant="outline" disabled={pending} onClick={() => onDownload(statement)}>{text.download}</Button>}</div>}
      </>}
    </section>
  )
}
