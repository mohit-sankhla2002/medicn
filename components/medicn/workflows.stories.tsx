import type { Meta, StoryObj } from "@storybook/react-vite"

import PatientSwitcherDemo from "@/components/demos/patient-switcher-demo"
import PatientTaskListDemo from "@/components/demos/patient-task-list-demo"
import AppointmentWaitlistDemo from "@/components/demos/appointment-waitlist-demo"
import PatientWorklistDemo from "@/components/demos/patient-worklist-demo"
import PatientMessageThreadDemo from "@/components/demos/patient-message-thread-demo"
import BillingSummaryDemo from "@/components/demos/billing-summary-demo"
import { WorkflowState } from "@/components/medicn/workflow-state"
import { PatientMessageThread } from "@/components/medicn/patient-message-thread"

const meta = {
  title: "medicn/Patient & practice workflows",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const FamilyAccounts: Story = { render: () => <PatientSwitcherDemo /> }
export const PatientTasks: Story = { render: () => <PatientTaskListDemo /> }
export const AppointmentWaitlist: Story = { render: () => <AppointmentWaitlistDemo /> }
export const PatientWorklist: Story = { render: () => <PatientWorklistDemo /> }
export const Messages: Story = { render: () => <PatientMessageThreadDemo /> }
export const Billing: Story = { render: () => <BillingSummaryDemo /> }
export const Loading: Story = { render: () => <WorkflowState state="loading" title="Loading patient records…" /> }
export const Empty: Story = { render: () => <WorkflowState state="empty" title="You're all caught up" description="No outstanding tasks." /> }
export const FetchError: Story = { render: () => <WorkflowState state="error" title="Could not load records" description="Check your connection and try again." /> }
export const FailedSend: Story = {
  render: () => <PatientMessageThread conversationId="failed-send-preview" messages={[]} currentUserId="alex" defaultValue="Please call me about my appointment." onSend={async () => { throw new Error("Simulated network failure") }} />,
}
