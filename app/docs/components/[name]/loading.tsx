export default function Loading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-6 w-96 max-w-full animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 h-80 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
