import { createFormErrors } from "./createFormErrors"
import { FormErrors } from "./FormErrors"

describe("createFormErrors", () => {
  it("creates errors", () => {
    const errors = createFormErrors()

    expect(errors instanceof FormErrors).toBe(true)
  })

  it("creates errors with initial state", () => {
    const errors = createFormErrors({ foo: ["bar"] })

    expect(errors instanceof FormErrors).toBe(true)
    expect(errors.get()).toEqual({ foo: ["bar"] })
  })
})
