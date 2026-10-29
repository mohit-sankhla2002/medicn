# medicn

Medical UI components and blocks for [shadcn/ui](https://ui.shadcn.com): appointment calendars, an interactive body map, pain scales, vitals, patient banners, and full clinical screens. Components are distributed as a shadcn registry, so the source is copied into your project and you own it.

> medicn is a UI toolkit, not a medical device. Clinical defaults such as reference ranges are generic. Validate them against your own protocols before you use them in patient care.

## Use it

```bash
npx shadcn@latest add https://medicn.vercel.app/r/body-map.json
```

Or register the namespace in `components.json` and use short names:

```json
{ "registries": { "@medicn": "https://medicn.vercel.app/r/{name}.json" } }
```

```bash
npx shadcn@latest add @medicn/appointment-calendar @medicn/patient-intake
```

## What's inside

| Category | Items |
| --- | --- |
| Scheduling | `appointment-calendar`, `appointment-slot-picker` |
| Anatomy | `body-map` |
| Forms | `pain-scale`, `vitals-form` |
| Clinical data | `clinical-status-badge`, `vital-signs`, `medication-list` |
| Patient | `patient-header` |
| Blocks | `clinic-dashboard`, `patient-chart`, `appointment-booking`, `symptom-report`, `patient-intake` |

## Repository layout

```
components/medicn/     registry components (the code users install)
components/blocks/     full-page blocks, installed as app/<name>/page.tsx
components/demos/      examples rendered on the docs site
components/docs/       docs site UI
components/ui/         shadcn/ui primitives (not distributed)
registry/items.ts      single source of truth: metadata, deps, demos, API docs
scripts/build-registry.mts  generates registry.json and __registry__/*
app/                   docs site (/, /docs, /docs/components/[name], /blocks, /view/[name])
```

## Develop

```bash
pnpm install
pnpm dev               # docs site; regenerates the registry index first
pnpm registry:build    # registry.json + public/r/*.json via `shadcn build`
pnpm build             # runs registry:build, then next build
```

Set `NEXT_PUBLIC_SITE_URL` to the deployed origin. Cross-item `registryDependencies` and the install commands in the docs are generated from it.

### Add a component

1. Create `components/medicn/<name>.tsx`. Import primitives from `@/components/ui/*`, other medicn components from `@/components/medicn/*`, and `cn` from `@/lib/utils`.
2. Add demos at `components/demos/<name>-demo.tsx`, each with a default export.
3. Add an entry to `registry/items.ts`. Use `medicn:<name>` for dependencies on other medicn items.
4. Run `pnpm registry:build`. The docs page at `/docs/components/<name>` is generated from the entry.

## Listing in the shadcn directory

Deploy the site, then add an `@medicn` entry to `apps/v4/registry/directory.json` in [shadcn-ui/ui](https://github.com/shadcn-ui/ui). Run `pnpm validate:registries` and open a PR. See `/docs/registry` for details.
