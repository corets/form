import { createFormFields } from "./createFormFields"
import { FormFields } from "./FormFields"

describe("createFormFields", () => {
  it("creates fields", () => {
    const fields = createFormFields()

    expect(fields instanceof FormFields).toBe(true)
  })

  it("creates fields with initial state", () => {
    const fields = createFormFields(["foo"])

    expect(fields instanceof FormFields).toBe(true)
    expect(fields.get()).toEqual(["foo"])
  })
})
