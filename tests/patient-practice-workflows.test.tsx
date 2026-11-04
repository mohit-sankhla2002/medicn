import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PatientSwitcher } from "@/components/medicn/patient-switcher"
import { PatientTaskList, type PatientTask } from "@/components/medicn/patient-task-list"
import { AppointmentWaitlist, type WaitlistEntry } from "@/components/medicn/appointment-waitlist"
import { PatientWorklist, type WorklistPatient } from "@/components/medicn/patient-worklist"
import { PatientMessageThread, type PatientMessage } from "@/components/medicn/patient-message-thread"
import { BillingSummary, formatBillingAmount, type BillingStatement } from "@/components/medicn/billing-summary"

afterEach(cleanup)

const profiles = [
  { id: "self", name: "Alex", relationship: "You", accessLabel: "Full access" },
  { id: "child", name: "Sam", relationship: "Child", accessLabel: "Appointments only" },
  { id: "unavailable", name: "Robin", relationship: "Parent", disabled: true },
]
const tasks: PatientTask[] = [
  { id: "intake", title: "Health history", status: "completed" },
  { id: "contact", title: "Contact details", status: "not-started" },
  { id: "results", title: "Visit summary", status: "blocked", blockedReason: "Available after your visit" },
]
const patients: WorklistPatient[] = [
  { id: "visit-1", patientId: "alex", name: "Alex Morgan", identifier: "1042", provider: "Dr. Chen", status: "arrived" },
  { id: "visit-2", patientId: "jamie", name: "Jamie Patel", identifier: "2086", provider: "Dr. Chen", status: "roomed" },
  { id: "visit-3", patientId: "taylor", name: "Taylor Reed", identifier: "3018", provider: "Dr. Reed", status: "arrived" },
]
const invoice: BillingStatement = { id: "INV-1", patientName: "Alex", currency: "USD", status: "due", items: [{ id: "consult", description: "Consultation", amountMinor: 15000 }], totals: [{ label: "Adjustment", amountMinor: -1000 }], balanceMinor: 14000 }

describe("patient context", () => {
  it("does not select a patient implicitly and respects controlled selection", async () => {
    const onPatientChange = vi.fn()
    const { rerender } = render(<PatientSwitcher patients={profiles} value="self" onPatientChange={onPatientChange} />)
    await userEvent.selectOptions(screen.getByLabelText("Care account"), "child")
    expect(onPatientChange).toHaveBeenCalledWith(profiles[1])
    expect(screen.getByLabelText("Care account")).toHaveValue("self")
    rerender(<PatientSwitcher patients={profiles} value="child" onPatientChange={onPatientChange} />)
    expect(screen.getByRole("status")).toHaveTextContent("Viewing care for Sam")
    expect(screen.getByRole("status")).toHaveTextContent("Appointments only")
    rerender(<PatientSwitcher patients={profiles} value="removed-profile" />)
    expect(screen.getByLabelText("Care account")).toHaveValue("")
    expect(screen.queryByText("Appointments only")).not.toBeInTheDocument()
  })

  it("does not expose stale account context while a new list loads", () => {
    render(<PatientSwitcher patients={profiles} value="child" isLoading />)
    expect(screen.queryByText("Appointments only")).not.toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeDisabled()
  })

  it("supports uncontrolled selection and prevents choosing disabled profiles", async () => {
    render(<PatientSwitcher patients={profiles} />)
    expect(screen.getByRole("combobox")).toHaveValue("")
    await userEvent.selectOptions(screen.getByRole("combobox"), "child")
    expect(screen.getByRole("combobox")).toHaveValue("child")
    await userEvent.selectOptions(screen.getByRole("combobox"), "unavailable")
    expect(screen.getByRole("combobox")).toHaveValue("child")
  })
})

describe("patient tasks", () => {
  it("opens tasks without completing them and prevents blocked actions", async () => {
    const onTaskAction = vi.fn()
    render(<PatientTaskList tasks={tasks} onTaskAction={onTaskAction} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "1")
    await userEvent.click(screen.getByRole("button", { name: "Start", description: /Contact details/ }))
    expect(onTaskAction).toHaveBeenCalledWith(tasks[1])
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "1")
    expect(screen.getByRole("button", { name: "Start", description: /Visit summary/ })).toBeDisabled()
  })

  it("uses updated server data and allows localized states", () => {
    const { rerender } = render(<PatientTaskList tasks={tasks} />)
    rerender(<PatientTaskList tasks={tasks.map((task) => ({ ...task, status: "completed" }))} labels={{ completed: "Terminé", progress: "Tâches terminées" }} />)
    expect(screen.getByRole("progressbar", { name: "Tâches terminées" })).toHaveAttribute("value", "3")
    expect(screen.getAllByText("Terminé")).toHaveLength(3)
  })
})

describe("appointment waitlist", () => {
  const entries: WaitlistEntry[] = [
    { id: "waiting", patientName: "Alex", service: "Review", preferences: "Afternoons", status: "waiting" },
    { id: "offered", patientName: "Jamie", service: "Review", preferences: "Mornings", status: "offered", offeredSlot: "Nov 6 at 09:00 IST" },
    { id: "expired", patientName: "Taylor", service: "Review", preferences: "Any time", status: "expired", offeredSlot: "Nov 4 at 09:00 IST" },
  ]

  it("only exposes valid status actions and leaves state to the host", async () => {
    const onBook = vi.fn()
    const onOffer = vi.fn()
    render(<AppointmentWaitlist entries={entries} onBook={onBook} onOffer={onOffer} />)
    expect(screen.getAllByRole("button", { name: "Book offered slot" })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: "Offer a slot" })).toHaveLength(1)
    await userEvent.click(screen.getByRole("button", { name: "Book offered slot" }))
    expect(onBook).toHaveBeenCalledWith(entries[1])
    expect(screen.getByText("Slot offered")).toBeInTheDocument()
    expect(screen.getByText("Offer expired")).toBeInTheDocument()
  })

  it("does not offer booking for incomplete offers and locks pending actions", () => {
    const { rerender } = render(<AppointmentWaitlist entries={[{ ...entries[1], offeredSlot: undefined }]} onBook={vi.fn()} />)
    expect(screen.queryByRole("button", { name: "Book offered slot" })).not.toBeInTheDocument()
    rerender(<AppointmentWaitlist entries={entries} pendingId="offered" onBook={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Book offered slot" })).toBeDisabled()
  })
})

describe("practice worklist", () => {
  it("combines search and status filters and returns the encounter to selection handlers", async () => {
    const onPatientSelect = vi.fn()
    render(<PatientWorklist patients={patients} onPatientSelect={onPatientSelect} />)
    await userEvent.type(screen.getByRole("searchbox"), "Dr. Chen")
    await userEvent.selectOptions(screen.getByLabelText("Visit status"), "roomed")
    expect(screen.queryByText("Alex Morgan")).not.toBeInTheDocument()
    expect(screen.queryByText("Taylor Reed")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Jamie Patel" }))
    expect(onPatientSelect).toHaveBeenCalledWith(patients[1])
    expect(screen.getByRole("status")).toHaveTextContent("Results: 1")
  })

  it("supports externally filtered data without filtering it a second time", async () => {
    const onSearchChange = vi.fn()
    render(<PatientWorklist patients={patients} search="server-query" manualFiltering onSearchChange={onSearchChange} />)
    expect(screen.getByText("Alex Morgan")).toBeInTheDocument()
    await userEvent.type(screen.getByRole("searchbox"), "x")
    expect(onSearchChange).toHaveBeenLastCalledWith("server-queryx")
    expect(screen.getByRole("searchbox")).toHaveValue("server-query")
  })

  it("announces no matches and recovers after clearing search", async () => {
    render(<PatientWorklist patients={patients} />)
    await userEvent.type(screen.getByRole("searchbox"), "missing")
    expect(screen.getByText("No patients match these filters")).toBeInTheDocument()
    await userEvent.clear(screen.getByRole("searchbox"))
    expect(screen.getByText("Alex Morgan")).toBeInTheDocument()
  })
})

describe("message persistence", () => {
  it("resets local drafts when switching conversations or viewers", async () => {
    const { rerender } = render(<PatientMessageThread conversationId="alex-care" messages={[]} currentUserId="alex" onSend={vi.fn()} />)
    await userEvent.type(screen.getByLabelText("Your message"), "Private draft")
    rerender(<PatientMessageThread conversationId="sam-care" messages={[]} currentUserId="alex" onSend={vi.fn()} />)
    expect(screen.getByLabelText("Your message")).toHaveValue("")
    await userEvent.type(screen.getByLabelText("Your message"), "Another private draft")
    rerender(<PatientMessageThread conversationId="sam-care" messages={[]} currentUserId="coordinator" onSend={vi.fn()} />)
    expect(screen.getByLabelText("Your message")).toHaveValue("")
  })

  it("does not clear an externally managed draft after the sending thread unmounts", async () => {
    let resolveSend!: () => void
    const onValueChange = vi.fn()
    const onSend = () => new Promise<void>((resolve) => { resolveSend = resolve })
    const { rerender } = render(<PatientMessageThread conversationId="old" messages={[]} currentUserId="alex" onSend={onSend} value="Old thread draft" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("button", { name: "Send message" }))
    rerender(<PatientMessageThread conversationId="new" messages={[]} currentUserId="alex" onSend={vi.fn()} value="New thread draft" onValueChange={onValueChange} />)
    resolveSend()
    await waitFor(() => expect(screen.getByLabelText("Your message")).toHaveValue("New thread draft"))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("retains a rejected draft and clears it only after a successful retry", async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(undefined)
    render(<PatientMessageThread conversationId="primary-care" messages={[]} currentUserId="alex" onSend={onSend} />)
    await userEvent.type(screen.getByLabelText("Your message"), "  Please call me  ")
    await userEvent.click(screen.getByRole("button", { name: "Send message" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Your message was not sent")
    expect(screen.getByLabelText("Your message")).toHaveValue("  Please call me  ")
    await userEvent.click(screen.getByRole("button", { name: "Send message" }))
    await waitFor(() => expect(screen.getByLabelText("Your message")).toHaveValue(""))
    expect(onSend).toHaveBeenNthCalledWith(2, "Please call me")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getByText("No messages yet")).toBeInTheDocument()
  })

  it("locks duplicate submissions while persistence is pending", async () => {
    let resolveSend!: () => void
    const onSend = vi.fn(() => new Promise<void>((resolve) => { resolveSend = resolve }))
    render(<PatientMessageThread conversationId="primary-care" messages={[]} currentUserId="alex" onSend={onSend} defaultValue="Hello" />)
    await userEvent.dblClick(screen.getByRole("button", { name: "Send message" }))
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled()
    expect(screen.getByLabelText("Your message")).toBeDisabled()
    resolveSend()
    await waitFor(() => expect(screen.getByLabelText("Your message")).toHaveValue(""))
  })

  it("supports controlled drafts and rejects whitespace-only messages", async () => {
    const onValueChange = vi.fn()
    render(<PatientMessageThread conversationId="primary-care" messages={[]} currentUserId="alex" value=" " onValueChange={onValueChange} onSend={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Your message"), "a")
    expect(onValueChange).toHaveBeenLastCalledWith(" a")
    expect(screen.getByLabelText("Your message")).toHaveValue(" ")
  })

  it("renders read-only history and delegates authorized attachment opening", async () => {
    const message: PatientMessage = { id: "1", authorId: "nurse", authorName: "Jordan", body: "Visit summary", sentAt: "Nov 4 at 09:00 IST", attachments: [{ id: "file-1", name: "summary.pdf" }] }
    const onAttachmentOpen = vi.fn()
    render(<PatientMessageThread conversationId="primary-care" messages={[message]} currentUserId="alex" onAttachmentOpen={onAttachmentOpen} />)
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "summary.pdf" }))
    expect(onAttachmentOpen).toHaveBeenCalledWith(message.attachments![0], message)
  })
})

describe("billing data", () => {
  it("formats different currency minor units without assuming two decimals", () => {
    expect(formatBillingAmount(1234, "USD")).toBe("$12.34")
    expect(formatBillingAmount(1234, "JPY")).toBe("¥1,234")
    expect(formatBillingAmount(1234, "KWD")).toContain("1.234")
    expect(formatBillingAmount(150000, "INR", "en-IN")).toBe("₹1,500.00")
    expect(formatBillingAmount(NaN, "USD")).toBe("—")
    expect(formatBillingAmount(1.1, "USD")).toBe("—")
  })

  it("uses the host balance and calls checkout without marking a statement paid", async () => {
    const onPay = vi.fn()
    render(<BillingSummary statement={invoice} onPay={onPay} />)
    expect(screen.getByText("$140.00")).toBeInTheDocument()
    expect(screen.getByText("-$10.00")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Make a payment" }))
    expect(onPay).toHaveBeenCalledWith(invoice)
    expect(screen.getByText("Payment due")).toBeInTheDocument()
  })

  it.each(["paid", "void", "draft"] as const)("does not offer payment for %s statements even with a stale balance", (status) => {
    render(<BillingSummary statement={{ ...invoice, status }} onPay={vi.fn()} />)
    expect(screen.queryByRole("button", { name: "Make a payment" })).not.toBeInTheDocument()
  })
})

describe("shared workflow feedback", () => {
  it("hides stale worklist data on error and exposes a retry", async () => {
    const onRetry = vi.fn()
    render(<PatientWorklist patients={patients} error="Connection lost" onRetry={onRetry} />)
    expect(screen.queryByText("Alex Morgan")).not.toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("Connection lost")
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("gives separate component instances unique labels and descriptions", () => {
    render(<><PatientSwitcher patients={profiles} /><PatientSwitcher patients={profiles} /><PatientMessageThread conversationId="primary-care" messages={[]} currentUserId="alex" onSend={vi.fn()} /><PatientMessageThread conversationId="primary-care" messages={[]} currentUserId="alex" onSend={vi.fn()} /></>)
    const controls = [...screen.getAllByRole("combobox"), ...screen.getAllByRole("textbox")]
    expect(new Set(controls.map((control) => control.id)).size).toBe(controls.length)
    for (const control of controls) expect(document.querySelector(`label[for="${control.id}"]`)).not.toBeNull()
  })
})
