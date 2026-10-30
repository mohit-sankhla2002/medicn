import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import EmergencyDepartmentPage from "@/components/blocks/emergency-department/page"

describe("EmergencyDepartment block", () => {
  it("renders ED census metrics and tracking board", () => {
    render(<EmergencyDepartmentPage />)
    expect(screen.getByText("Emergency Department Tracking Board")).toBeInTheDocument()
    expect(screen.getByText(/Total Census/i)).toBeInTheDocument()
    expect(screen.getByText(/In Treatment/i)).toBeInTheDocument()
    expect(screen.getByText("Bed 01")).toBeInTheDocument()
  })

  it("filters tracking board patients by search query", async () => {
    render(<EmergencyDepartmentPage />)
    const searchInput = screen.getByPlaceholderText(/Search patients or complaints\.\.\./i)
    await userEvent.type(searchInput, "Chest pain")
    expect(screen.getByText(/Chest pain/i)).toBeInTheDocument()
  })

  it("filters patients by acuity or zone", async () => {
    render(<EmergencyDepartmentPage />)
    const resusTab = screen.getByRole("button", { name: /Resuscitation/i })
    await userEvent.click(resusTab)
    expect(screen.getByText(/Trauma Bay/i)).toBeInTheDocument()
  })
})
