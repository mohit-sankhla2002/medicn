export const siteConfig = {
  name: "medicn",
  description:
    "Open-source, copy-paste medical UI components for shadcn/ui — appointment calendars, body maps, clinical forms, vitals and patient layouts.",
  // Set NEXT_PUBLIC_SITE_URL to the deployed origin; registry URLs are generated from it.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://medicn.vercel.app",
  links: {
    github: "https://github.com/mohit-sankhla2002/medicn",
  },
}

export function registryUrl(name: string) {
  return `${siteConfig.url}/r/${name}.json`
}
