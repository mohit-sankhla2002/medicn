import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { blocks } from "@/__registry__/blocks"
import { getRegistryItem, registryItems } from "@/registry/items"

export function generateStaticParams() {
  return registryItems.filter((item) => item.type === "registry:block").map((item) => ({ name: item.name }))
}

export async function generateMetadata({ params }: PageProps<"/view/[name]">): Promise<Metadata> {
  const { name } = await params
  const item = getRegistryItem(name)
  return item ? { title: item.title, description: item.description } : {}
}

export default async function BlockViewPage({ params }: PageProps<"/view/[name]">) {
  const { name } = await params
  const Block = blocks[name]
  if (!Block) notFound()
  return <Block />
}
