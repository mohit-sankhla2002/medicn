import type { PropDoc } from "@/registry/items"

function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] break-words">{children}</code>
}

/** Renders `backtick` spans inside descriptions as inline code. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") ? <InlineCode key={i}>{part.slice(1, -1)}</InlineCode> : <span key={i}>{part}</span>
      )}
    </>
  )
}

export function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Prop</th>
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-4 py-2.5 font-medium">Default</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {props.map((prop) => (
            <tr key={prop.name} className="align-top">
              <td className="px-4 py-3">
                <code className="font-mono text-[13px] font-medium text-primary">{prop.name}</code>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  <RichText text={prop.description} />
                </p>
              </td>
              <td className="max-w-64 px-4 py-3">
                <InlineCode>{prop.type}</InlineCode>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {prop.default ? <InlineCode>{prop.default}</InlineCode> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
