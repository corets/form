import { createFormFromSchema } from "./createFormFromSchema"
import { object, value } from "@corets/schema"

describe("createFromFromSchema", () => {
  it("creates from from schema with default values", async () => {
    const schema = object({ foo: value("bar").string().oneOf(["foo"]) })
    const form = createFormFromSchema<{ foo: string }, { error?: any }>(schema)

    expect(form.getAt("foo")).toBe("bar")

    const errors = await form.validate()

    expect(errors !== undefined).toBe(true)

    form.setAt("foo", "foo")
    expect(await form.validate()).toBe(undefined)
  })
})
