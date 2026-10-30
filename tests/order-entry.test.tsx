import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  OrderEntry,
  ORDER_CATEGORIES,
  ORDER_URGENCY_LABELS,
  sortOrders,
  type OrderItem,
  type OrderCatalogItem,
} from "@/components/medicn/order-entry"

const sampleCatalog: OrderCatalogItem[] = [
  { name: "Comprehensive Metabolic Panel (CMP)", code: "24323-8", category: "lab", description: "14 tests" },
  { name: "Complete Blood Count (CBC)", code: "58410-2", category: "lab", description: "With differential" },
  { name: "Chest X-Ray 2 Views", code: "71046", category: "imaging", description: "PA and Lateral" },
  { name: "Cardiology Referral", category: "referral", description: "Consultation" },
  { name: "Wound Dressing Change", category: "nursing", description: "Daily clean dressing" },
]

describe("ORDER_CATEGORIES & ORDER_URGENCY_LABELS", () => {
  it("defines all major order categories", () => {
    expect(ORDER_CATEGORIES.lab).toBeDefined()
    expect(ORDER_CATEGORIES.imaging).toBeDefined()
    expect(ORDER_CATEGORIES.referral).toBeDefined()
    expect(ORDER_CATEGORIES.procedure).toBeDefined()
    expect(ORDER_CATEGORIES.nursing).toBeDefined()
  })

  it("defines urgency labels", () => {
    expect(ORDER_URGENCY_LABELS.stat).toBe("STAT")
    expect(ORDER_URGENCY_LABELS.routine).toBe("Routine")
  })
})

describe("sortOrders", () => {
  it("sorts by urgency priority then category", () => {
    const orders: OrderItem[] = [
      { id: "1", name: "CBC", category: "lab", urgency: "routine" },
      { id: "2", name: "Chest X-Ray", category: "imaging", urgency: "stat" },
    ]
    const sorted = sortOrders(orders)
    expect(sorted[0].name).toBe("Chest X-Ray")
    expect(sorted[1].name).toBe("CBC")
  })
})

describe("OrderEntry component", () => {
  it("renders catalog items and search input", () => {
    render(<OrderEntry catalog={sampleCatalog} />)
    expect(screen.getByText("Order Entry (CPOE)")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search orders\.\.\./i)).toBeInTheDocument()
    expect(screen.getByText("Comprehensive Metabolic Panel (CMP)")).toBeInTheDocument()
    expect(screen.getByText("Chest X-Ray 2 Views")).toBeInTheDocument()
  })

  it("filters catalog items based on search query", async () => {
    render(<OrderEntry catalog={sampleCatalog} />)
    const searchInput = screen.getByPlaceholderText(/Search orders\.\.\./i)
    await userEvent.type(searchInput, "Chest")
    expect(screen.getByText("Chest X-Ray 2 Views")).toBeInTheDocument()
    expect(screen.queryByText("Comprehensive Metabolic Panel (CMP)")).not.toBeInTheDocument()
  })

  it("adds order to basket when clicking add button", async () => {
    render(<OrderEntry catalog={sampleCatalog} />)
    const addButtons = screen.getAllByRole("button", { name: /Add to basket/i })
    await userEvent.click(addButtons[0])

    expect(screen.getByText(/1 pending order/i)).toBeInTheDocument()
  })

  it("submits basket items when submit button is clicked", async () => {
    const onSubmit = vi.fn()
    const defaultBasket: OrderItem[] = [
      { id: "o-1", name: "Complete Blood Count (CBC)", category: "lab", urgency: "routine" },
    ]
    render(<OrderEntry catalog={sampleCatalog} defaultBasket={defaultBasket} onSubmit={onSubmit} />)

    const submitBtn = screen.getByRole("button", { name: /Sign & Place Orders/i })
    await userEvent.click(submitBtn)

    expect(onSubmit).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "Complete Blood Count (CBC)" }),
      ])
    )
  })
})
