"use client"

import * as React from "react"
import { PatientMessageThread, type PatientMessage } from "@/components/medicn/patient-message-thread"

const initialMessages: PatientMessage[] = [
  { id: "message-1", authorId: "nurse", authorName: "Jordan Lee", authorRole: "Care coordinator", body: "Hi Alex, your visit summary is ready. Please bring your updated medication list to your follow-up.", sentAt: "Nov 4 · 09:10 IST", attachments: [{ id: "summary", name: "Visit summary", detail: "PDF" }] },
  { id: "message-2", authorId: "alex", authorName: "Alex Morgan", body: "Thank you. Can I bring a photo of the medication labels?", sentAt: "Nov 4 · 09:15 IST", status: "read" },
  { id: "message-3", authorId: "nurse", authorName: "Jordan Lee", authorRole: "Care coordinator", body: "Yes, please bring the labels or clear photos of them.", sentAt: "Nov 4 · 09:18 IST" },
]

export default function PatientMessageThreadDemo() {
  const [messages, setMessages] = React.useState(initialMessages)
  const nextId = React.useRef(4)
  return <div className="w-full max-w-xl"><PatientMessageThread conversationId="primary-care" messages={messages} currentUserId="alex" description="Alex Morgan · Primary care team" notice="Messages are reviewed during clinic hours. For urgent help, use your clinic’s urgent-care contact." onSend={(body) => { const messageId = `message-${nextId.current++}`; setMessages((previous) => [...previous, { id: messageId, authorId: "alex", authorName: "Alex Morgan", body, sentAt: "Just now", status: "sent" }]) }} /></div>
}
