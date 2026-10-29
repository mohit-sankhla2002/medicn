import { categoryOrder, registryItems } from "@/registry/items"

export interface NavItem {
  title: string
  href: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const gettingStarted: NavSection = {
  title: "Getting started",
  items: [
    { title: "Introduction", href: "/docs" },
    { title: "Installation", href: "/docs/installation" },
    { title: "Theming", href: "/docs/theming" },
    { title: "Themes", href: "/themes" },
    { title: "Registry & directory", href: "/docs/registry" },
    { title: "Accessibility & safety", href: "/docs/accessibility" },
  ],
}

export function getDocsNav(): NavSection[] {
  const componentSections = categoryOrder
    .filter((category) => category !== "Blocks")
    .map((category) => ({
      title: category,
      items: registryItems
        .filter((item) => item.category === category && item.type === "registry:component")
        .map((item) => ({ title: item.title, href: `/docs/components/${item.name}` })),
    }))
    .filter((section) => section.items.length > 0)

  const blocks = registryItems.filter((item) => item.type === "registry:block")

  return [
    gettingStarted,
    ...componentSections,
    ...(blocks.length
      ? [
          {
            title: "Blocks",
            items: [
              { title: "All blocks", href: "/blocks" },
              ...blocks.map((b) => ({ title: b.title, href: `/blocks#${b.name}` })),
            ],
          },
        ]
      : []),
  ]
}
