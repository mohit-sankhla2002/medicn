import type { Metadata } from "next"

import { CodeBlock } from "@/components/docs/code-block"
import { Code, H2, P, PageHeader } from "@/components/docs/prose"
import { siteConfig } from "@/lib/site"

export const metadata: Metadata = { title: "Registry & directory" }

export default function RegistryPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader
        title="Registry & directory"
        description="How the medicn registry is built, hosted and listed in the shadcn registry directory."
      />

      <H2>Endpoints</H2>
      <P>Every item is served as JSON following the shadcn registry-item schema:</P>
      <CodeBlock
        lang="bash"
        code={`${siteConfig.url}/r/registry.json        # registry index
${siteConfig.url}/r/{name}.json           # a single item, e.g. body-map`}
      />

      <H2>Namespace</H2>
      <P>
        Consumers register the namespace once in <Code>components.json</Code>:
      </P>
      <CodeBlock
        lang="json"
        code={JSON.stringify({ registries: { "@medicn": `${siteConfig.url}/r/{name}.json` } }, null, 2)}
      />

      <H2>Building the registry</H2>
      <P>
        <Code>registry/items.ts</Code> is the single source of truth. <Code>pnpm registry:build</Code> generates{" "}
        <Code>registry.json</Code> from it and runs <Code>shadcn build</Code>, which writes <Code>public/r/*.json</Code>.
        It runs automatically before <Code>pnpm build</Code>. Set <Code>NEXT_PUBLIC_SITE_URL</Code> to your deployed
        origin so cross-item dependencies resolve to the right URLs.
      </P>
      <CodeBlock lang="bash" code={`NEXT_PUBLIC_SITE_URL=${siteConfig.url} pnpm registry:build`} />

      <H2>Listing in the shadcn directory</H2>
      <P>The directory requires a public, open-source, flat registry whose index contains no file contents — which is what <Code>shadcn build</Code> produces here.</P>
      <ol className="ml-5 list-decimal space-y-2 leading-7 text-foreground/85">
        <li>
          Deploy the site so <Code>/r/registry.json</Code> and each <Code>/r/{"{name}"}.json</Code> are publicly reachable.
        </li>
        <li>
          Fork <Code>shadcn-ui/ui</Code> and add an <Code>@medicn</Code> entry (name, homepage, description and the{" "}
          <Code>{`${siteConfig.url}/r/{name}.json`}</Code> URL) to <Code>apps/v4/registry/directory.json</Code>.
        </li>
        <li>
          Run <Code>pnpm validate:registries</Code> and open a pull request. Once merged, anyone can run{" "}
          <Code>shadcn add @medicn/body-map</Code> without extra configuration.
        </li>
        <li>Optionally list it on community indexes such as registry.directory and shadcn.io.</li>
      </ol>
    </article>
  )
}
