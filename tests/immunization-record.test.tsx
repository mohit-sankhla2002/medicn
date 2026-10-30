import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  ImmunizationRecord,
  sortImmunizations,
  getSeriesProgress,
  isImmunizationOverdue,
  type Immunization,
  type ImmunizationDue,
} from "@/components/medicn/immunization-record"

const sampleImmunizations: Immunization[] = [
  {
    id: "imm-1",
    vaccineName: "COVID-19 mRNA (Pfizer)",
    vaccineCode: "208",
    doseNumber: 1,
    seriesDoses: 2,
    date: "Jan 15, 2024",
    site: "Left deltoid",
    lotNumber: "EH9821",
    performer: "Sarah Jenkins, RN",
    status: "completed",
  },
  {
    id: "imm-2",
    vaccineName: "COVID-19 mRNA (Pfizer)",
    vaccineCode: "208",
    doseNumber: 2,
    seriesDoses: 2,
    date: "Feb 12, 2024",
    site: "Left deltoid",
    lotNumber: "EL0142",
    performer: "Sarah Jenkins, RN",
    status: "completed",
  },
  {
    id: "imm-3",
    vaccineName: "Influenza, seasonal",
    vaccineCode: "141",
    doseNumber: 1,
    seriesDoses: 1,
    date: "Oct 04, 2024",
    site: "Right deltoid",
    lotNumber: "FL2024-A",
    performer: "David Ross, MD",
    status: "completed",
  },
]

const sampleDue: ImmunizationDue[] = [
  {
    vaccineName: "Tdap (Tetanus, Diphtheria, Pertussis)",
    vaccineCode: "115",
    dueDate: "2024-11-15",
    overdue: true,
    seriesInfo: "Booster due every 10 years",
  },
  {
    vaccineName: "Zoster (Shingrix)",
    vaccineCode: "187",
    dueDate: "2025-03-01",
    overdue: false,
    seriesInfo: "Dose 1 of 2",
  },
]

describe("sortImmunizations", () => {
  it("sorts by date descending", () => {
    const sorted = sortImmunizations(sampleImmunizations)
    expect(sorted[0].vaccineName).toBe("Influenza, seasonal")
    expect(sorted[1].doseNumber).toBe(2)
  })
})

describe("getSeriesProgress", () => {
  it("calculates given doses and total doses correctly", () => {
    const progress = getSeriesProgress(sampleImmunizations, "COVID-19 mRNA (Pfizer)")
    expect(progress.given).toBe(2)
    expect(progress.total).toBe(2)
  })

  it("handles unknown vaccines gracefully", () => {
    const progress = getSeriesProgress(sampleImmunizations, "Nonexistent")
    expect(progress.given).toBe(0)
    expect(progress.total).toBeUndefined()
  })
})

describe("isImmunizationOverdue", () => {
  it("returns true for past dates", () => {
    expect(isImmunizationOverdue("2020-01-01", "2024-01-01")).toBe(true)
  })

  it("returns false for future dates", () => {
    expect(isImmunizationOverdue("2025-01-01", "2024-01-01")).toBe(false)
  })
})

describe("ImmunizationRecord component", () => {
  it("renders vaccine history items properly", () => {
    render(<ImmunizationRecord immunizations={sampleImmunizations} />)
    expect(screen.getByText("Immunization Record")).toBeInTheDocument()
    expect(screen.getAllByText(/COVID-19 mRNA/i)).toHaveLength(2)
    expect(screen.getByText(/Influenza, seasonal/i)).toBeInTheDocument()
    expect(screen.getByText(/EH9821/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Sarah Jenkins, RN/i)).toHaveLength(2)
  })

  it("displays due vaccines section when provided", () => {
    render(
      <ImmunizationRecord
        immunizations={sampleImmunizations}
        dueVaccines={sampleDue}
      />
    )
    expect(screen.getByText("Upcoming & Due")).toBeInTheDocument()
    expect(screen.getByText(/Tdap/i)).toBeInTheDocument()
    expect(screen.getByText(/Overdue/i)).toBeInTheDocument()
    expect(screen.getByText(/Zoster/i)).toBeInTheDocument()
  })

  it("shows empty state when no immunizations are recorded", () => {
    render(<ImmunizationRecord immunizations={[]} />)
    expect(screen.getByText("No immunization records found.")).toBeInTheDocument()
  })

  it("fires onRecord callback when record button clicked", async () => {
    const onRecord = vi.fn()
    render(
      <ImmunizationRecord
        immunizations={sampleImmunizations}
        onRecord={onRecord}
      />
    )
    const recordBtn = screen.getByRole("button", { name: /Record vaccine/i })
    await userEvent.click(recordBtn)
    expect(onRecord).toHaveBeenCalled()
  })

  it("hides record action when readOnly is true", () => {
    render(
      <ImmunizationRecord
        immunizations={sampleImmunizations}
        readOnly
      />
    )
    expect(screen.queryByRole("button", { name: /Record vaccine/i })).not.toBeInTheDocument()
  })
})
