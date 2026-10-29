import type { Metadata } from "next"

import { BlockViewer } from "@/components/docs/block-viewer"
import { CodeBlock, readSource } from "@/components/docs/code-block"
import { InstallCommand } from "@/components/docs/install-command"
import { registryUrl } from "@/lib/site"
import { registryItems } from "@/registry/items"

export const metadata: Metadata = {
  title: "Blocks",
  description: "Full medical screens you can drop into your app: dashboards, booking, intake, charts.",
}

export default async function BlocksPage() {
  const blocks = registryItems.filter((item) => item.type === "registry:block")
  const sources = await Promise.all(blocks.map((b) => readSource(b.files[0].path)))

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 py-10 md:px-6">
      <div className="mb-12 flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Blocks</h1>
        <p className="text-lg text-muted-foreground">
          Complete clinical screens built from medicn components. Install one and it lands in your app as a route, ready
          to wire to your data.
        </p>
      </div>
      <div className="flex flex-col gap-20">
        {blocks.map((block, i) => (
          <section key={block.name} id={block.name} className="flex scroll-mt-20 flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-tight">{block.title}</h2>
                <p className="text-muted-foreground">{block.description}</p>
              </div>
              <div className="w-full lg:max-w-xl">
                <InstallCommand args={`add ${registryUrl(block.name)}`} />
              </div>
            </div>
            <BlockViewer
              name={block.name}
              code={<CodeBlock code={sources[i]} title={block.files[0].target} />}
            />
          </section>
        ))}
      </div>
    </main>
  )
}
