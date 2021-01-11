import { createFormValues } from "./createFormValues"
import { FormValues } from "./FormValues"
import { createFormFields } from "./createFormFields"

describe("createFormValues", () => {
  it("creates state", () => {
    const values = createFormValues(
      undefined,
      createFormFields(),
      createFormFields()
    )

    expect(values instanceof FormValues).toBe(true)
    expect(values.get()).toEqual({})
  })

  it("creates state with initial state", () => {
    const values = createFormValues(
      { foo: "bar" },
      createFormFields(),
      createFormFields()
    )

    expect(values instanceof FormValues).toBe(true)
    expect(values.get()).toEqual({ foo: "bar" })
  })
})
