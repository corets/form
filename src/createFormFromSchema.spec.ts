import { createFormFromSchema } from "./createFormFromSchema"
import { object, schema } from "@corets/schema"

describe("createFromFromSchema", () => {
  it("creates from from schema with default values", async () => {
    const formSchema = object({ foo: schema("bar").string().oneOf(["foo"]) })
    const form = createFormFromSchema<{ foo: string }, { error?: any }>(
      formSchema
    )

    expect(form.getAt("foo")).toBe("bar")

    const errors = await form.validate()

    expect(errors !== undefined).toBe(true)

    form.setAt("foo", "foo")
    expect(await form.validate()).toBe(undefined)
  })
})
