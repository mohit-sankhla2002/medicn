"use client"

import * as React from "react"
import { Paperclip, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WorkflowState } from "@/components/medicn/workflow-state"

export interface MessageAttachment {
  id: string
  name: string
  detail?: string
}

export interface PatientMessage {
  id: string
  authorId: string
  authorName: string
  authorRole?: string
  body: string
  /** Display-ready timestamp with the application's chosen time zone. */
  sentAt: string
  status?: "sent" | "delivered" | "read" | "failed"
  attachments?: MessageAttachment[]
}

export interface PatientMessageThreadProps extends Omit<React.ComponentProps<"section">, "title" | "children" | "onChange"> {
  /** Stable thread ID. Changing this or currentUserId resets local drafts and feedback. */
  conversationId: string
  messages: PatientMessage[]
  currentUserId: string
  title?: React.ReactNode
  description?: React.ReactNode
  /** Explain response times or route urgent concerns using host-specific copy. */
  notice?: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (draft: string) => void
  /** Resolve only after persistence succeeds; rejection preserves the draft for retry. */
  onSend?: (body: string) => void | Promise<void>
  onAttachmentOpen?: (attachment: MessageAttachment, message: PatientMessage) => void
  onRetryMessage?: (message: PatientMessage) => void
  disabled?: boolean
  maxLength?: number
  isLoading?: boolean
  error?: React.ReactNode
  onRetry?: () => void
  labels?: Partial<Record<"sent" | "delivered" | "read" | "failed" | "compose" | "placeholder" | "send" | "sending" | "sendError" | "retryMessage" | "empty" | "loading" | "error" | "retry", string>>
}

export function PatientMessageThread({ conversationId, ...props }: PatientMessageThreadProps) {
  return <MessageThreadContent key={JSON.stringify([conversationId, props.currentUserId])} {...props} />
}

function MessageThreadContent({ messages, currentUserId, title = "Care team messages", description, notice, value, defaultValue = "", onValueChange, onSend, onAttachmentOpen, onRetryMessage, disabled, maxLength = 4000, isLoading, error, onRetry, labels, className, ...props }: Omit<PatientMessageThreadProps, "conversationId">) {
  const id = React.useId()
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [sending, setSending] = React.useState(false)
  const [sendFailed, setSendFailed] = React.useState(false)
  const sendLock = React.useRef(false)
  const mounted = React.useRef(false)
  React.useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  const draft = value ?? internalValue
  const text = { sent: "Sent", delivered: "Delivered", read: "Read", failed: "Not sent", compose: "Your message", placeholder: "Write a message…", send: "Send message", sending: "Sending…", sendError: "Your message was not sent. Your draft is saved here; try again.", retryMessage: "Retry message", empty: "No messages yet", loading: "Loading messages…", error: "Could not load messages", retry: "Try again", ...labels }
  const canSend = Boolean(onSend) && !disabled && !isLoading && !error && !sending && draft.trim().length > 0 && draft.length <= maxLength

  const updateDraft = (next: string) => {
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
  }

  const send = async () => {
    if (!canSend || !onSend || sendLock.current) return
    sendLock.current = true
    setSending(true)
    setSendFailed(false)
    try {
      await onSend(draft.trim())
      if (mounted.current) updateDraft("")
    } catch {
      if (mounted.current) setSendFailed(true)
    } finally {
      sendLock.current = false
      if (mounted.current) setSending(false)
    }
  }

  return (
    <section data-slot="patient-message-thread" aria-labelledby={`${id}-title`} aria-busy={isLoading || undefined} className={cn("w-full overflow-hidden rounded-xl border bg-card text-card-foreground", className)} {...props}>
      <div className="border-b px-5 py-4"><h3 id={`${id}-title`} className="font-semibold">{title}</h3>{description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}</div>
      {notice && <div id={`${id}-notice`} className="border-b bg-muted/40 px-5 py-3 text-xs text-muted-foreground">{notice}</div>}
      {isLoading ? <WorkflowState state="loading" title={text.loading} /> : error ? <WorkflowState state="error" title={text.error} description={error} onRetry={onRetry} retryLabel={text.retry} /> : <div role="log" tabIndex={0} aria-label={typeof title === "string" ? title : undefined} aria-labelledby={typeof title !== "string" ? `${id}-title` : undefined} aria-relevant="additions" className="max-h-96 overflow-y-auto overscroll-contain p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        {messages.length === 0 ? <WorkflowState state="empty" title={text.empty} /> : <ol className="space-y-5">
          {messages.map((message) => <li key={message.id} className={cn("flex", message.authorId === currentUserId ? "justify-end" : "justify-start")}><article className={cn("max-w-[90%] space-y-2 rounded-xl border px-4 py-3 sm:max-w-[80%]", message.authorId === currentUserId ? "border-primary/15 bg-primary/5" : "bg-muted/40")}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-sm font-medium">{message.authorName}</span>{message.authorRole && <span className="text-xs text-foreground/75">{message.authorRole}</span>}</div>
            <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
            {message.attachments && message.attachments.length > 0 && <ul className="space-y-1">{message.attachments.map((attachment) => <li key={attachment.id} className="flex items-center gap-2 text-xs"><Paperclip aria-hidden className="size-3.5 shrink-0" />{onAttachmentOpen ? <Button type="button" variant="link" size="sm" className="h-auto justify-start p-0 text-left whitespace-normal" onClick={() => onAttachmentOpen(attachment, message)}>{attachment.name}</Button> : <span className="break-all">{attachment.name}</span>}{attachment.detail && <span className="text-muted-foreground">{attachment.detail}</span>}</li>)}</ul>}
            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/75"><span>{message.sentAt}</span>{message.status && <span>{text[message.status]}</span>}{message.authorId === currentUserId && message.status === "failed" && onRetryMessage && <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" disabled={disabled} onClick={() => onRetryMessage(message)}>{text.retryMessage}</Button>}</div>
          </article></li>)}
        </ol>}
      </div>}
      {onSend && <form className="space-y-2 border-t p-5" aria-busy={sending || undefined} onSubmit={(event) => { event.preventDefault(); void send() }}>
        <Label htmlFor={`${id}-draft`}>{text.compose}</Label>
        <Textarea id={`${id}-draft`} value={draft} maxLength={maxLength} disabled={disabled || sending || isLoading || Boolean(error)} placeholder={text.placeholder} aria-invalid={sendFailed || undefined} aria-describedby={[notice ? `${id}-notice` : "", sendFailed ? `${id}-send-error` : ""].filter(Boolean).join(" ") || undefined} onChange={(event) => { updateDraft(event.target.value); setSendFailed(false) }} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) { event.preventDefault(); void send() } }} />
        {sendFailed && <p id={`${id}-send-error`} role="alert" className="text-sm text-destructive">{text.sendError}</p>}
        <div className="flex items-center justify-between gap-3"><span className="text-xs tabular-nums text-muted-foreground">{draft.length} / {maxLength}</span><Button type="submit" size="sm" disabled={!canSend}><Send aria-hidden className="size-4" />{sending ? text.sending : text.send}</Button><span role="status" className="sr-only">{sending ? text.sending : ""}</span></div>
      </form>}
    </section>
  )
}
