import { createForm } from "./createForm"
import { FormField } from "./FormField"
import { Form } from "./Form"

describe("FormField", () => {
  it("handles value", () => {
    const form = createForm({ foo: "bar" })
    const field = new FormField(form, "foo")

    expect(field.getValue()).toBe("bar")

    field.setValue("yolo")

    expect(field.getValue()).toBe("yolo")
    expect(form.getAt("foo")).toBe("yolo")

    form.setAt("foo", "swag")

    expect(field.getValue()).toBe("swag")
    expect(form.getAt("foo")).toBe("swag")
  })

  it("handles errors", () => {
    const form = createForm({ foo: "bar" })
    const field = new FormField(form, "foo")

    expect(field.hasErrors()).toBe(false)
    expect(form.hasErrors()).toBe(false)

    field.setErrors("error1")

    expect(field.hasErrors()).toBe(true)
    expect(field.getErrors()).toEqual(["error1"])
    expect(form.hasErrors()).toBe(true)
    expect(form.getErrors()).toEqual({ foo: ["error1"] })

    field.addErrors("error2")

    expect(field.hasErrors()).toBe(true)
    expect(field.getErrors()).toEqual(["error1", "error2"])
    expect(form.hasErrors()).toBe(true)
    expect(form.getErrors()).toEqual({ foo: ["error1", "error2"] })

    field.setErrors("error3")

    expect(field.hasErrors()).toBe(true)
    expect(field.getErrors()).toEqual(["error3"])
    expect(form.hasErrors()).toBe(true)
    expect(form.getErrors()).toEqual({ foo: ["error3"] })

    form.setErrors({ foo: ["error1"], bar: ["error2"] })

    expect(field.hasErrors()).toBe(true)
    expect(field.getErrors()).toEqual(["error1"])
    expect(form.hasErrors()).toBe(true)
    expect(form.getErrors()).toEqual({ foo: ["error1"], bar: ["error2"] })

    field.clearErrors()

    expect(field.hasErrors()).toBe(false)
    expect(field.getErrors()).toEqual(undefined)
    expect(form.hasErrors()).toBe(true)
    expect(form.getErrors()).toEqual({ bar: ["error2"] })

    form.setErrors({ foo: ["error1"] })

    expect(field.hasErrors()).toBe(true)
    expect(field.getErrors()).toEqual(["error1"])
    expect(form.hasErrors()).toBe(true)
    expect(form.getErrors()).toEqual({ foo: ["error1"] })

    form.clearErrors()

    expect(field.hasErrors()).toBe(false)
    expect(field.getErrors()).toEqual(undefined)
    expect(form.hasErrors()).toBe(false)
    expect(form.getErrors()).toEqual(undefined)
  })

  it("handles dirty state", () => {
    const form = createForm({ foo: "bar" })
    const field = new FormField(form, "foo")

    expect(field.isDirty()).toBe(false)
    expect(form.isDirty()).toBe(false)

    field.setValue("baz")

    expect(field.isDirty()).toBe(true)
    expect(form.isDirty()).toBe(true)
    expect(form.getDirty()).toEqual(["foo"])

    field.clearDirty()

    expect(field.isDirty()).toBe(false)
    expect(form.isDirty()).toBe(false)

    field.setDirty()

    expect(field.isDirty()).toBe(true)
    expect(form.getDirty()).toEqual(["foo"])
  })

  it("handles changed state", () => {
    const form = createForm({ foo: "bar" })
    const field = new FormField(form, "foo")

    expect(field.isChanged()).toBe(false)
    expect(form.isChanged()).toBe(false)

    field.setValue("bar")

    expect(field.isChanged()).toBe(false)
    expect(form.isChanged()).toBe(false)

    field.setValue("baz")

    expect(field.isChanged()).toBe(true)
    expect(form.isChanged()).toBe(true)
    expect(form.getChanged()).toEqual(["foo"])

    field.setValue("bar")

    expect(field.isChanged()).toBe(false)
    expect(form.isChanged()).toBe(false)
    expect(form.getChanged()).toEqual([])

    field.setValue("baz")

    expect(field.isChanged()).toBe(true)
    expect(form.isChanged()).toBe(true)
    expect(form.getChanged()).toEqual(["foo"])

    field.clearChanged()

    expect(field.isChanged()).toBe(false)
    expect(form.isChanged()).toBe(false)

    field.setChanged()

    expect(field.isChanged()).toBe(true)
    expect(form.getChanged()).toEqual(["foo"])
  })

  it("returns its form", () => {
    const form = createForm({ foo: "bar" })
    const field = new FormField(form, "foo")

    expect(field.getForm() === form).toBe(true)
  })

  it("returns form key", () => {
    const form = createForm({ foo: { bar: "yolo" } })
    const field = new FormField(form, "foo.bar")

    expect(field.getKey()).toBe("foo.bar")
  })

  it("returns field dependencies", () => {
    const form = new Form({ foo: "foo", bar: "bar" })

    form.setAt("foo", "fooz")

    expect(form.getFields().foo.get().getDeps()).toEqual(form.getDeps("foo"))
  })
})
