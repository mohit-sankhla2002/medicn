import type { StorybookConfig } from "@storybook/react-vite"
import { fileURLToPath } from "node:url"

const config: StorybookConfig = {
  stories: [
    "../packages/ui/src/**/*.mdx",
    "../packages/ui/src/**/*.stories.@(ts|tsx)",
    "../components/medicn/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
  async viteFinal(config) {
    const [{ mergeConfig }, { default: tailwindcss }] = await Promise.all([
      import("vite"),
      import("@tailwindcss/vite"),
    ])
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: { alias: { "@": fileURLToPath(new URL("../", import.meta.url)) } },
    })
  },
}
export default config
