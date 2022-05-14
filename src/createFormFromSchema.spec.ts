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

  it("creates from from schema factory", async () => {
    const form = createFormFromSchema<
      { foo: string; bar: string },
      { error?: any }
    >((form) =>
      object({
        foo: schema("bar").string(),
        bar: schema("foo")
          .string()
          .equals(() => form.getAt("foo")),
      })
    )

    expect(form.getAt("foo")).toBe("bar")
    expect(form.getAt("bar")).toBe("foo")

    const errors = await form.validate()

    expect(errors).toBeDefined()
    expect(errors?.foo).toBeUndefined()
    expect(errors?.bar).toBeDefined()

    form.setAt("bar", "bar")

    expect(await form.validate()).toBe(undefined)
  })
})
