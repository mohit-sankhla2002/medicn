import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  ClinicalNote,
  NOTE_TEMPLATES,
  getNoteStatusInfo,
  type ClinicalNoteData,
} from "@/components/medicn/clinical-note"

describe("NOTE_TEMPLATES", () => {
  it("defines SOAP template sections", () => {
    const soap = NOTE_TEMPLATES.soap
    expect(soap).toBeDefined()
    expect(soap.map((s) => s.key)).toEqual(["subjective", "objective", "assessment", "plan"])
  })

  it("defines H&P template sections", () => {
    const hp = NOTE_TEMPLATES.hp
    expect(hp).toBeDefined()
    expect(hp.map((s) => s.key)).toContain("chiefComplaint")
    expect(hp.map((s) => s.key)).toContain("hpi")
    expect(hp.map((s) => s.key)).toContain("physicalExam")
  })
})

describe("getNoteStatusInfo", () => {
  it("maps draft status correctly", () => {
    const info = getNoteStatusInfo("draft")
    expect(info.label).toBe("Draft")
    expect(info.status).toBe("watch")
  })

  it("maps signed status correctly", () => {
    const info = getNoteStatusInfo("signed")
    expect(info.label).toBe("Signed")
    expect(info.status).toBe("normal")
  })

  it("maps cosigned status correctly", () => {
    const info = getNoteStatusInfo("cosigned")
    expect(info.label).toBe("Co-signed")
    expect(info.status).toBe("info")
  })
})

describe("ClinicalNote component", () => {
  it("renders SOAP template sections by default", () => {
    render(<ClinicalNote />)
    expect(screen.getByText("Subjective")).toBeInTheDocument()
    expect(screen.getByText("Objective")).toBeInTheDocument()
    expect(screen.getByText("Assessment")).toBeInTheDocument()
    expect(screen.getByText("Plan")).toBeInTheDocument()
  })

  it("renders with custom initial sections and note author", () => {
    render(
      <ClinicalNote
        author="Dr. Angela Ray, MD"
        status="draft"
        defaultSections={[
          { key: "subjective", label: "Subjective", content: "Patient reports sore throat for 3 days." },
        ]}
      />
    )
    expect(screen.getByText("Dr. Angela Ray, MD")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Patient reports sore throat for 3 days.")).toBeInTheDocument()
  })

  it("triggers onSave when save button is clicked", async () => {
    const onSave = vi.fn()
    render(<ClinicalNote onSave={onSave} />)

    const textarea = screen.getAllByRole("textbox")[0]
    await userEvent.type(textarea, "Patient presents for routine follow up.")

    const saveBtn = screen.getByRole("button", { name: /Save draft/i })
    await userEvent.click(saveBtn)

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "draft",
        sections: expect.arrayContaining([
          expect.objectContaining({
            key: "subjective",
            content: expect.stringContaining("Patient presents for routine follow up."),
          }),
        ]),
      })
    )
  })

  it("triggers onSign when sign button is clicked", async () => {
    const onSign = vi.fn()
    render(<ClinicalNote onSign={onSign} />)

    const signBtn = screen.getByRole("button", { name: /Sign note/i })
    await userEvent.click(signBtn)

    expect(onSign).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "signed",
      })
    )
  })

  it("disables editing when note is signed and not editable", () => {
    render(
      <ClinicalNote
        status="signed"
        author="Dr. Angela Ray, MD"
        signedAt="Oct 24, 2024 at 14:30"
        defaultSections={[
          { key: "subjective", label: "Subjective", content: "Stable" },
        ]}
      />
    )
    expect(screen.getByText("Signed")).toBeInTheDocument()
    expect(screen.getByText(/Oct 24, 2024/i)).toBeInTheDocument()
    const textareas = screen.getAllByRole("textbox")
    expect(textareas[0]).toBeDisabled()
    expect(screen.queryByRole("button", { name: /Sign note/i })).not.toBeInTheDocument()
  })
})
