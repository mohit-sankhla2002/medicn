import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"

const meta = {
  title: "Primitives/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["docs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive"],
      description: "Visual intent of the button.",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "sm for dense clinical tables, md default, lg for key patient actions.",
    },
    iconOnly: {
      control: "boolean",
      description: "Square button for icon-only actions (must contain an accessible label).",
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Order medication",
  },
}

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Save draft",
  },
}

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Print summary",
  },
}

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Copy MRN",
  },
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Cancel appointment",
  },
}

export const Sizes: Story = {
  args: { children: "Continue" },
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Sign order",
  },
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} variant="primary">
        Sign order
      </Button>
      <Button {...args} variant="outline">
        Add patient
      </Button>
    </div>
  ),
}

export const IconOnly: Story = {
  args: {
    iconOnly: true,
    variant: "outline",
  },
  render: (args) => (
    <Button {...args} aria-label="Print patient summary">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    </Button>
  ),
}
