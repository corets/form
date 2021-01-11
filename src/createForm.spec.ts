import { createForm } from "./index"
import { Form } from "./Form"

describe("createForm", () => {
  it("creates form with object initializer", () => {
    const form = createForm({ foo: "bar" })

    expect(form instanceof Form).toBe(true)
    expect(form.values.get()).toEqual({ foo: "bar" })
  })
})
