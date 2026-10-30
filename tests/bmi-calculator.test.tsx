import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  BmiCalculator,
  calculateBmi,
  classifyBmi,
  bmiToStatus,
  type BmiUnits,
} from "@/components/medicn/bmi-calculator"

describe("calculateBmi", () => {
  it("calculates BMI correctly with metric units (cm, kg)", () => {
    // 175 cm, 70 kg -> 70 / (1.75^2) = 22.86 -> 22.9
    const bmi = calculateBmi(175, 70, "metric")
    expect(bmi).toBe(22.9)
  })

  it("calculates BMI correctly with imperial units (in, lbs)", () => {
    // 68 in, 150 lbs -> (150 / (68^2)) * 703 = 22.81 -> 22.8
    const bmi = calculateBmi(68, 150, "imperial")
    expect(bmi).toBe(22.8)
  })

  it("returns null for non-positive or invalid inputs", () => {
    expect(calculateBmi(0, 70, "metric")).toBeNull()
    expect(calculateBmi(-10, 70, "metric")).toBeNull()
    expect(calculateBmi(170, 0, "metric")).toBeNull()
    expect(calculateBmi(170, -5, "metric")).toBeNull()
  })
})

describe("classifyBmi & bmiToStatus", () => {
  it("classifies underweight (< 18.5)", () => {
    const res = classifyBmi(17.2)
    expect(res.category).toBe("Underweight")
    expect(res.status).toBe("watch")
    expect(bmiToStatus(17.2)).toBe("watch")
  })

  it("classifies normal weight (18.5 - 24.9)", () => {
    const res = classifyBmi(22.0)
    expect(res.category).toBe("Normal weight")
    expect(res.status).toBe("normal")
    expect(bmiToStatus(22.0)).toBe("normal")
  })

  it("classifies overweight (25.0 - 29.9)", () => {
    const res = classifyBmi(27.4)
    expect(res.category).toBe("Overweight")
    expect(res.status).toBe("watch")
    expect(bmiToStatus(27.4)).toBe("watch")
  })

  it("classifies Obesity Class I (30.0 - 34.9)", () => {
    const res = classifyBmi(32.1)
    expect(res.category).toBe("Obesity Class I")
    expect(res.status).toBe("abnormal")
    expect(bmiToStatus(32.1)).toBe("abnormal")
  })

  it("classifies Obesity Class II (35.0 - 39.9)", () => {
    const res = classifyBmi(37.5)
    expect(res.category).toBe("Obesity Class II")
    expect(res.status).toBe("critical")
    expect(bmiToStatus(37.5)).toBe("critical")
  })

  it("classifies Obesity Class III (>= 40.0)", () => {
    const res = classifyBmi(42.0)
    expect(res.category).toBe("Obesity Class III")
    expect(res.status).toBe("critical")
    expect(bmiToStatus(42.0)).toBe("critical")
  })
})

describe("BmiCalculator component", () => {
  it("renders with default inputs and titles", () => {
    render(<BmiCalculator />)
    expect(screen.getByText("BMI Calculator")).toBeInTheDocument()
    expect(screen.getByLabelText(/Height/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Weight/i)).toBeInTheDocument()
  })

  it("computes BMI when valid values are entered", async () => {
    const onCalculate = vi.fn()
    render(<BmiCalculator onCalculate={onCalculate} />)

    const heightInput = screen.getByLabelText(/Height/i)
    const weightInput = screen.getByLabelText(/Weight/i)

    await userEvent.clear(heightInput)
    await userEvent.type(heightInput, "180")

    await userEvent.clear(weightInput)
    await userEvent.type(weightInput, "75")

    // 75 / (1.8^2) = 23.1
    expect(screen.getByText("23.1")).toBeInTheDocument()
    expect(screen.getByText("Normal weight")).toBeInTheDocument()
    expect(onCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        bmi: 23.1,
        category: "Normal weight",
      })
    )
  })

  it("allows switching units between metric and imperial", async () => {
    render(<BmiCalculator defaultUnits="metric" />)

    expect(screen.getByText("cm")).toBeInTheDocument()
    expect(screen.getByText("kg")).toBeInTheDocument()

    const imperialBtn = screen.getByRole("button", { name: /Imperial/i })
    await userEvent.click(imperialBtn)

    expect(screen.getByText("in")).toBeInTheDocument()
    expect(screen.getByText("lbs")).toBeInTheDocument()
  })

  it("handles initial values correctly", () => {
    render(<BmiCalculator defaultHeight={170} defaultWeight={65} defaultUnits="metric" />)
    // 65 / (1.7^2) = 22.5
    expect(screen.getByText("22.5")).toBeInTheDocument()
    expect(screen.getByText("Normal weight")).toBeInTheDocument()
  })
})
