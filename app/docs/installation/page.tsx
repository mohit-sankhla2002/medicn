import type { Metadata } from "next"

import { CodeBlock } from "@/components/docs/code-block"
import { InstallCommand } from "@/components/docs/install-command"
import { Code, P, PageHeader, Step, Steps } from "@/components/docs/prose"
import { registryUrl, siteConfig } from "@/lib/site"

export const metadata: Metadata = { title: "Installation" }

export default function InstallationPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader title="Installation" description="Set up shadcn/ui, then add medicn components with the shadcn CLI." />
      <Steps>
        <Step title="Create a project with shadcn/ui">
          <P className="my-0">
            medicn works in any project supported by shadcn/ui (Next.js, Vite, React Router, Astro, TanStack Start…) with
            Tailwind CSS v4. If you don&apos;t have one yet:
          </P>
          <InstallCommand args="init" />
        </Step>
        <Step title="Add a component">
          <P className="my-0">Point the CLI at any component URL:</P>
          <InstallCommand args={`add ${registryUrl("body-map")}`} />
          <P className="my-0 text-sm text-muted-foreground">
            The CLI installs npm dependencies, required shadcn/ui primitives and other medicn components automatically.
          </P>
        </Step>
        <Step title="(Optional) Register the @medicn namespace">
          <P className="my-0">
            Add the registry to <Code>components.json</Code> so you can use short names:
          </P>
          <CodeBlock
            lang="json"
            title="components.json"
            code={JSON.stringify({ registries: { "@medicn": `${siteConfig.url}/r/{name}.json` } }, null, 2)}
          />
          <InstallCommand args="add @medicn/appointment-calendar @medicn/pain-scale" />
        </Step>
        <Step title="Use it">
          <CodeBlock
            title="app/page.tsx"
            code={`import { BodyMap } from "@/components/medicn/body-map"

export default function Page() {
  return <BodyMap onValueChange={(regions) => console.log(regions)} />
}`}
          />
        </Step>
      </Steps>
    </article>
  )
}
