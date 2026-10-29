import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeBlock, readSource } from "@/components/docs/code-block"
import { ComponentPreview } from "@/components/docs/component-preview"
import { InstallCommand } from "@/components/docs/install-command"
import { Code, H2, H3, P, PageHeader, Step, Steps } from "@/components/docs/prose"
import { PropsTable, RichText } from "@/components/docs/props-table"
import { getDocsNav } from "@/lib/docs-nav"
import { registryUrl } from "@/lib/site"
import { getRegistryItem, registryItems } from "@/registry/items"

export function generateStaticParams() {
  return registryItems.filter((item) => item.type === "registry:component").map((item) => ({ name: item.name }))
}

export async function generateMetadata({ params }: PageProps<"/docs/components/[name]">): Promise<Metadata> {
  const { name } = await params
  const item = getRegistryItem(name)
  return item ? { title: item.title, description: item.description } : {}
}

export default async function ComponentPage({ params }: PageProps<"/docs/components/[name]">) {
  const { name } = await params
  const item = getRegistryItem(name)
  if (!item || item.type !== "registry:component") notFound()

  const [hero, ...examples] = item.demos ?? []
  const sources = await Promise.all(item.files.map(async (file) => ({ ...file, code: await readSource(file.path) })))
  const shadcnDeps = (item.registryDependencies ?? []).filter((d) => !d.startsWith("medicn:"))
  const medicnDeps = (item.registryDependencies ?? []).filter((d) => d.startsWith("medicn:")).map((d) => d.slice(7))

  const flat = getDocsNav().flatMap((s) => s.items).filter((i) => i.href.startsWith("/docs/components/"))
  const index = flat.findIndex((i) => i.href === `/docs/components/${name}`)
  const prev = flat[index - 1]
  const next = flat[index + 1]

  return (
    <article className="mx-auto max-w-4xl">
      <PageHeader title={item.title} description={item.description}>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{item.category}</Badge>
          {item.dependencies?.map((dep) => (
            <Badge key={dep} variant="outline" className="font-mono">
              {dep}
            </Badge>
          ))}
        </div>
      </PageHeader>

      {hero && <ComponentPreview name={hero.name} />}

      <H2 id="installation">Installation</H2>
      <Tabs defaultValue="cli" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="cli">CLI</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="cli" className="flex flex-col gap-3">
          <InstallCommand args={`add ${registryUrl(item.name)}`} />
          <P className="text-sm text-muted-foreground">
            Or, with the <Link href="/docs/registry" className="underline underline-offset-4">@medicn namespace</Link>{" "}
            configured: <Code>shadcn add @medicn/{item.name}</Code>
          </P>
        </TabsContent>
        <TabsContent value="manual">
          <Steps>
            {(item.dependencies?.length ?? 0) > 0 && (
              <Step title="Install the dependencies">
                <CodeBlock lang="bash" code={`pnpm add ${item.dependencies!.join(" ")}`} />
              </Step>
            )}
            {(shadcnDeps.length > 0 || medicnDeps.length > 0) && (
              <Step title="Add the required components">
                {shadcnDeps.length > 0 && <CodeBlock lang="bash" code={`pnpm dlx shadcn@latest add ${shadcnDeps.join(" ")}`} />}
                {medicnDeps.length > 0 && (
                  <P className="text-sm">
                    Also copy:{" "}
                    {medicnDeps.map((dep, i) => (
                      <span key={dep}>
                        {i > 0 && ", "}
                        <Link href={`/docs/components/${dep}`} className="font-medium underline underline-offset-4">
                          {dep}
                        </Link>
                      </span>
                    ))}
                  </P>
                )}
              </Step>
            )}
            <Step title="Copy and paste the following code into your project">
              {sources.map((file) => (
                <CodeBlock key={file.path} code={file.code} title={file.target ?? file.path} />
              ))}
            </Step>
            <Step title="Update the import paths to match your project setup">
              <P className="my-0 text-sm text-muted-foreground">
                Components import from <Code>@/components/ui</Code>, <Code>@/components/medicn</Code> and{" "}
                <Code>@/lib/utils</Code>.
              </P>
            </Step>
          </Steps>
        </TabsContent>
      </Tabs>

      {item.usage && (
        <>
          <H2 id="usage">Usage</H2>
          <CodeBlock code={item.usage} />
        </>
      )}

      {examples.length > 0 && (
        <>
          <H2 id="examples">Examples</H2>
          {examples.map((example) => (
            <section key={example.name}>
              <H3 id={example.name}>{example.title ?? example.name}</H3>
              {example.description && <P className="mt-0 text-sm text-muted-foreground">{example.description}</P>}
              <ComponentPreview name={example.name} />
            </section>
          ))}
        </>
      )}

      {item.notes && item.notes.length > 0 && (
        <>
          <H2 id="notes">Notes</H2>
          <ul className="ml-5 list-disc space-y-2 text-foreground/85">
            {item.notes.map((note) => (
              <li key={note} className="leading-7">
                <RichText text={note} />
              </li>
            ))}
          </ul>
        </>
      )}

      {item.references && item.references.length > 0 && (
        <>
          <H2 id="references">Standards &amp; real-world use</H2>
          <P>The data model and behaviour follow these standards and established clinical software patterns.</P>
          <ul className="ml-5 list-disc space-y-2 text-foreground/85">
            {item.references.map((reference) => (
              <li key={reference.href} className="leading-7">
                <a
                  href={reference.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  {reference.label}
                </a>
                {reference.description && (
                  <>
                    {" — "}
                    <RichText text={reference.description} />
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {item.api && item.api.length > 0 && (
        <>
          <H2 id="api">API Reference</H2>
          {item.api.map((section) => (
            <section key={section.component}>
              <H3 id={`api-${section.component}`}>{section.component}</H3>
              {section.description && <P className="mt-0 text-sm text-muted-foreground">{section.description}</P>}
              <PropsTable props={section.props} />
            </section>
          ))}
        </>
      )}

      <nav className="mt-16 flex items-center justify-between gap-4 border-t pt-6">
        {prev ? (
          <Button asChild variant="outline">
            <Link href={prev.href}>
              <ArrowLeft /> {prev.title}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button asChild variant="outline">
            <Link href={next.href}>
              {next.title} <ArrowRight />
            </Link>
          </Button>
        )}
      </nav>
    </article>
  )
}
