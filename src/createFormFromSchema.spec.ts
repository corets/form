import { createFormFromSchema } from "./createFormFromSchema"
import { object, shape } from "@corets/schema"

describe("createFromFromSchema", () => {
  it("creates from from schema with default values", async () => {
    const schema = object({ foo: shape("bar").string().oneOf(["foo"]) })
    const form = createFormFromSchema<{ foo: string }, { error?: any }>(schema)

    expect(form.getAt("foo")).toBe("bar")

    const errors = await form.validate()

    expect(errors !== undefined).toBe(true)

    form.setAt("foo", "foo")
    expect(await form.validate()).toBe(undefined)
  })
})
