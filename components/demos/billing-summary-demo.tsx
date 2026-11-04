"use client"

import * as React from "react"
import { BillingSummary, type BillingStatement } from "@/components/medicn/billing-summary"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const statement: BillingStatement = {
  id: "INV-2026-1042", patientName: "Alex Morgan", currency: "INR", status: "partially-paid", issuedAt: "Nov 4, 2026", dueAt: "Nov 18, 2026",
  items: [{ id: "consultation", description: "Follow-up consultation", detail: "Dr. Chen · Nov 4, 2026", amountMinor: 150000 }, { id: "screening", description: "Screening services", amountMinor: 50000 }],
  totals: [{ label: "Total charges", amountMinor: 200000 }, { label: "Payment received", amountMinor: -50000 }], balanceMinor: 150000,
}

export default function BillingSummaryDemo() {
  const [open, setOpen] = React.useState(false)
  return <div className="w-full max-w-lg"><BillingSummary statement={statement} locale="en-IN" note="This statement reflects the payments and adjustments currently recorded by your clinic." onPay={() => setOpen(true)} onDownload={(invoice) => {
    const rows = [invoice.id, invoice.patientName, ...invoice.items.map((item) => `${item.description}: ${(item.amountMinor / 100).toFixed(2)} ${invoice.currency}`), `Balance: ${(invoice.balanceMinor / 100).toFixed(2)} ${invoice.currency}`]
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/plain" }))
    const link = document.createElement("a"); link.href = url; link.download = `${invoice.id}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }} />
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Payment preview</DialogTitle><DialogDescription>Payment collection is unavailable in this preview. No payment will be taken.</DialogDescription></DialogHeader><Button type="button" onClick={() => setOpen(false)}>Back to statement</Button></DialogContent></Dialog>
  </div>
}
