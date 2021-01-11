import { Form } from "./Form"
import { object, string } from "@corets/schema"
import { createTimeout } from "@corets/promise-helpers"

describe("Form", () => {
  it("creates with initial state", () => {
    const form = new Form({ foo: "bar" })

    expect(form.values.get()).toEqual({ foo: "bar" })
  })

  it("returns and sets state", () => {
    const form = new Form({})

    expect(form.values.get()).toEqual({})

    form.values.set({ foo: "bar" })

    expect(form.values.get()).toEqual({ foo: "bar" })
  })

  it("adds state", () => {
    const form = new Form<any>({ foo: "bar" })

    form.values.add({ yolo: "swag" })

    expect(form.values.get()).toEqual({ foo: "bar", yolo: "swag" })
  })

  it("returns state at given path", () => {
    const form = new Form<any>({ foo: "bar" })

    expect(form.values.getAt("foo")).toBe("bar")
  })

  it("sets state at given path", () => {
    const form = new Form<any>({ foo: "bar" })

    form.values.setAt("yolo", "swag")

    expect(form.values.get()).toEqual({ foo: "bar", yolo: "swag" })
  })

  it("tells if a value is set at given path", () => {
    const form = new Form<any>({ foo: "bar" })

    expect(form.values.hasAt("foo")).toBe(true)
    expect(form.values.hasAt("bar")).toBe(false)
  })

  it("resets everything to initial state", () => {
    const form = new Form<any>({ foo: "bar" })

    form.values.set({ yolo: "swag" })
    form.submitting.set(true)
    form.submitted.set(true)
    form.dirtyFields.set(["foo"])
    form.changedFields.set(["foo"])
    form.errors.set({ foo: ["bar"] })
    form.result.set({ foo: ["bar"] })

    form.reset()

    expect(form.values.get()).toEqual({ foo: "bar" })
    expect(form.submitting.get()).toEqual(false)
    expect(form.submitted.get()).toEqual(false)
    expect(form.dirtyFields.get()).toEqual([])
    expect(form.changedFields.get()).toEqual([])
    expect(form.errors.get()).toEqual(undefined)
    expect(form.result.get()).toEqual(undefined)
  })

  it("submits", async () => {
    const handler = jest.fn().mockResolvedValue(true)
    const form = new Form({ foo: "bar" }).configure({ validateOnSubmit: false })
    form.handler(handler)
    form.errors.set({ foo: ["bar"] })
    form.result.set({ foo: "bar" })

    const submitting: any[] = []
    form.submitting.listen((value) => {
      submitting.push(value)
    })

    const submitted: any[] = []
    form.submitted.listen((value) => {
      submitted.push(value)
    })

    let result = await form.submit()

    expect(result).toBe(true)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(form)
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false, true])
    expect(form.errors.get()).toEqual(undefined)
    expect(form.result.get()).toEqual(true)
  })

  it("handles rejections and thrown errors during submit", async () => {
    const errorLog = console.error
    console.error = jest.fn()

    const handler = jest.fn().mockRejectedValue(new Error("test"))
    const form = new Form({ foo: "bar" })
    form.handler(handler)

    const submitting: any[] = []
    form.submitting.listen((value) => {
      submitting.push(value)
    })

    const submitted: any[] = []
    form.submitted.listen((value) => {
      submitted.push(value)
    })

    let receivedError: any

    try {
      await form.submit()
    } catch (error) {
      receivedError = error
    }

    expect(receivedError instanceof Error).toBe(true)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(form)
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false])

    console.error = errorLog
  })

  it("validates with schema", async () => {
    const form = new Form({ foo: "bar" })
      .schema(object({ foo: string().min(4) }))
      .schema(object({ bar: string().min(8) }) as any)

    const errors = (await form.validate())!

    expect(errors.foo.length).toBe(1)
    expect(typeof errors.foo[0] === "string").toBe(true)
    expect(errors.bar.length).toBe(1)
    expect(typeof errors.bar[0] === "string").toBe(true)
  })

  it("validates with function", async () => {
    const validator = jest.fn()
    const form = new Form({ foo: "bar" })
      .validator(() => ({ foo: ["error"] }))
      .validator(() => ({ bar: ["error"] }))
      .validator(validator)

    const errors = (await form.validate())!

    expect(errors.foo.length).toBe(1)
    expect(typeof errors.foo[0] === "string").toBe(true)
    expect(errors.bar.length).toBe(1)
    expect(typeof errors.bar[0] === "string").toBe(true)
    expect(validator).toHaveBeenCalledTimes(1)
    expect(validator).toHaveBeenCalledWith(form)
  })

  it("handles errors during validate", async () => {
    const errorLog = console.error
    console.error = jest.fn()

    const validator = jest.fn().mockRejectedValue(new Error("test"))
    const form = new Form({ foo: "bar" })
      .configure({ validateOnChange: false })
      .validator(() => ({ foo: ["error"] }))
      .validator(() => ({ bar: ["error"] }))
      .validator(validator)

    let receivedError: any

    try {
      await form.validate()
    } catch (error) {
      receivedError = error
    }

    expect(receivedError instanceof Error).toBe(true)
    expect(validator).toHaveBeenCalledTimes(1)
    expect(validator).toHaveBeenCalledWith(form)

    console.error = errorLog
  })

  it("validates without validators", async () => {
    const form = new Form({ foo: "bar" })
    const errors = await form.validate()

    expect(errors).toBe(undefined)
  })

  it("validates with mixed validators", async () => {
    const form = new Form({ foo: "bar" })
      .validator(() => ({ foo: ["error"] }))
      .schema(object({ bar: string().min(8) }) as any)

    const errors = (await form.validate())!

    expect(errors.foo.length).toBe(1)
    expect(typeof errors.foo[0] === "string").toBe(true)
    expect(errors.bar.length).toBe(1)
    expect(typeof errors.bar[0] === "string").toBe(true)
  })

  it("validates with passing validators", async () => {
    const form = new Form({ foo: "bar" })
      .validator(() => undefined)
      .schema(object({ foo: string().min(3) }))

    const errors = (await form.validate())!

    expect(errors).toBe(undefined)
  })

  it("validates explicitly on submit", async () => {
    const handler = jest.fn()
    const validator = jest.fn()
    const form = new Form({ foo: "bar" })
      .configure({ validateOnSubmit: false })
      .validator(validator)
      .handler(handler)

    await form.submit()

    expect(validator).toHaveBeenCalledTimes(0)
    expect(handler).toHaveBeenCalledTimes(1)

    await form.submit({ validate: true })

    expect(validator).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(2)

    await form.submit({ validate: false })

    expect(validator).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(3)

    form.configure({ validateOnSubmit: true })

    await form.submit()

    expect(validator).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledTimes(4)

    await form.submit({ validate: false })

    expect(validator).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledTimes(5)

    await form.submit({ validate: true })

    expect(validator).toHaveBeenCalledTimes(3)
    expect(handler).toHaveBeenCalledTimes(6)
  })

  it("validates on submit and aborts submit on validation errors", async () => {
    const handler = jest.fn()
    const form = new Form({ foo: "bar" })
      .configure({ validateOnSubmit: true })
      .validator(() => ({ foo: ["error"] }))
      .handler(handler)

    const submitting: any[] = []
    form.submitting.listen((value) => {
      submitting.push(value)
    })

    const submitted: any[] = []
    form.submitted.listen((value) => {
      submitted.push(value)
    })

    const errors: any[] = []
    form.errors.listen((value) => {
      errors.push(value)
    })

    const status = await form.submit()

    expect(status).toBe(undefined)
    expect(handler).not.toHaveBeenCalled()
    expect(errors).toEqual([undefined, { foo: ["error"] }])
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false])
  })

  it("validates on submit and submits if there are no validation errors", async () => {
    const handler = jest.fn(() => "result")
    const form = new Form({ foo: "bar" })
      .configure({ validateOnSubmit: true })
      .validator(() => undefined)
      .handler(handler)

    const submitting: any[] = []
    form.submitting.listen((value) => {
      submitting.push(value)
    })

    const submitted: any[] = []
    form.submitted.listen((value) => {
      submitted.push(value)
    })

    const errors: any[] = []
    form.errors.listen((value) => {
      errors.push(value)
    })

    const status = await form.submit()

    expect(status).toBe("result")
    expect(handler).toHaveBeenCalled()
    expect(errors).toEqual([undefined])
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false, true])
  })

  it("validates changed fields only", async () => {
    const form = new Form({ foo: "ba", bar: "ba" })
      .configure({ validateChangedFieldsOnly: true })
      .schema(object({ foo: string().min(3), bar: string().min(3) }))

    const errors1 = await form.validate()

    expect(errors1).toBe(undefined)

    form.changedFields.add("foo")

    const errors2 = (await form.validate())!

    expect(errors2.foo.length).toBe(1)
    expect(typeof errors2.foo[0] === "string").toBe(true)
  })

  it("validates on change", async () => {
    const form = new Form({ foo: "ba", bar: "ba" })
      .configure({ validateOnChange: true })
      .schema(object({ foo: string().min(3), bar: string().min(3) }))

    expect(form.errors.get()).toBe(undefined)

    form.values.setAt("foo", "b")

    await createTimeout(0)

    expect(form.errors.get()).not.toBe(undefined)
    expect(form.errors.get()!.foo.length).toBe(1)
  })

  it("validates changed fields but keeps previous errors", async () => {
    const form = new Form({ foo: "ba", bar: "ba" }).schema(
      object({ foo: string().min(3), bar: string().min(3) })
    )

    const errors1 = await form.validate({
      changedFieldsOnly: false,
      keepPreviousErrors: false,
    })

    expect(errors1 !== undefined).toBe(true)
    expect(errors1?.foo?.length).toBe(1)
    expect(errors1?.bar?.length).toBe(1)

    const errors2 = await form.validate({
      changedFieldsOnly: true,
      keepPreviousErrors: false,
    })

    expect(errors2 === undefined).toBe(true)

    form.changedFields.add("foo")

    const errors3 = await form.validate({
      changedFieldsOnly: true,
      keepPreviousErrors: false,
    })

    expect(errors3 !== undefined).toBe(true)
    expect(errors3?.foo?.length).toBe(1)
    expect(errors3?.bar?.length).toBe(undefined)

    const errors4 = await form.validate({
      changedFieldsOnly: false,
      keepPreviousErrors: false,
    })

    expect(errors4 !== undefined).toBe(true)
    expect(errors4?.foo?.length).toBe(1)
    expect(errors4?.bar?.length).toBe(1)

    const errors5 = await form.validate({
      changedFieldsOnly: false,
      keepPreviousErrors: true,
    })

    expect(errors5 !== undefined).toBe(true)
    expect(errors5?.foo?.length).toBe(1)
    expect(errors5?.bar?.length).toBe(1)

    const errors6 = await form.validate({ changedFieldsOnly: true })

    expect(errors6 !== undefined).toBe(true)
    expect(errors6?.foo?.length).toBe(1)
    expect(errors6?.bar?.length).toBe(1)

    form.values.setAt("bar", "bar")

    const errors7 = await form.validate({ changedFieldsOnly: true })

    expect(errors7 !== undefined).toBe(true)
    expect(errors7?.foo?.length).toBe(1)
    expect(errors7?.bar?.length).toBe(undefined)
  })

  it("validates without persisting errors", async () => {
    const form = new Form({ foo: "ba", bar: "ba" }).schema(
      object({ foo: string().min(3), bar: string().min(3) })
    )

    const errors1 = await form.validate({ persistErrors: false })

    expect(errors1 !== undefined).toBe(true)
    expect(form.errors.get() !== undefined).toBe(false)

    const errors2 = await form.validate()

    expect(errors2 !== undefined).toBe(true)
    expect(form.errors.get() !== undefined).toBe(true)
  })

  it("tracks a field as dirty and changed", () => {
    const form = new Form({ foo: "bar" })

    form.values.setAt("foo", "bar")

    expect(form.dirtyFields.get()).toEqual(["foo"])
    expect(form.changedFields.get()).toEqual([])

    form.values.setAt("foo", "baz")

    expect(form.dirtyFields.get()).toEqual(["foo"])
    expect(form.changedFields.get()).toEqual(["foo"])
  })

  it("listens", async () => {
    const form = new Form({ foo: { bar: "baz" } })
    let listener = jest.fn()

    const returnedForm = form.listen(listener)

    expect(returnedForm === form).toBe(true)

    expect(listener).toHaveBeenCalledTimes(6)
    expect(listener).toHaveBeenCalledWith(form)

    form.values.setAt("foo.bar", "yolo")

    expect(listener).toHaveBeenCalledTimes(9)
    expect(listener).toHaveBeenCalledWith(form)
  })

  it("deps", () => {
    const form = new Form({ foo: "foo", bar: "bar" })

    expect(form.deps(["foo", "bar"])).toEqual([
      `["foo","bar"]`,
      `[null,null]`,
      `[false,false]`,
      `[false,false]`,
      undefined,
      `false`,
      `false`,
    ])

    form.values.setAt("foo", "fooz")

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","bar"]`,
      `[null,null]`,
      `[true,false]`,
      `[true,false]`,
      undefined,
      `false`,
      `false`,
    ])

    form.errors.setAt("foo", ["error"])

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","bar"]`,
      `[["error"],null]`,
      `[true,false]`,
      `[true,false]`,
      undefined,
      `false`,
      `false`,
    ])

    form.submitting.set(true)

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","bar"]`,
      `[["error"],null]`,
      `[true,false]`,
      `[true,false]`,
      undefined,
      `true`,
      `false`,
    ])

    form.submitted.set(true)

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","bar"]`,
      `[["error"],null]`,
      `[true,false]`,
      `[true,false]`,
      undefined,
      `true`,
      `true`,
    ])

    form.result.set({ status: "ok" })

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","bar"]`,
      `[["error"],null]`,
      `[true,false]`,
      `[true,false]`,
      `{"status":"ok"}`,
      `true`,
      `true`,
    ])

    form.values.setAt("bar", "barz")

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","barz"]`,
      `[["error"],null]`,
      `[true,true]`,
      `[true,true]`,
      `{"status":"ok"}`,
      `true`,
      `true`,
    ])

    form.errors.setAt("bar", ["yolo"])

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","barz"]`,
      `[["error"],["yolo"]]`,
      `[true,true]`,
      `[true,true]`,
      `{"status":"ok"}`,
      `true`,
      `true`,
    ])

    expect(
      form.deps(["foo", "bar"], {
        result: false,
      })
    ).toEqual([
      `["fooz","barz"]`,
      `[["error"],["yolo"]]`,
      `[true,true]`,
      `[true,true]`,
      undefined,
      `true`,
      `true`,
    ])

    expect(
      form.deps(["foo", "bar"], {
        result: false,
        submitting: false,
      })
    ).toEqual([
      `["fooz","barz"]`,
      `[["error"],["yolo"]]`,
      `[true,true]`,
      `[true,true]`,
      undefined,
      undefined,
      `true`,
    ])

    expect(
      form.deps(["foo", "bar"], {
        result: false,
        submitting: false,
        submitted: false,
      })
    ).toEqual([
      `["fooz","barz"]`,
      `[["error"],["yolo"]]`,
      `[true,true]`,
      `[true,true]`,
      undefined,
      undefined,
      undefined,
    ])

    expect(
      form.deps(["foo", "bar"], {
        result: false,
        submitting: false,
        submitted: false,
        changedFields: false,
      })
    ).toEqual([
      `["fooz","barz"]`,
      `[["error"],["yolo"]]`,
      `[true,true]`,
      `[]`,
      undefined,
      undefined,
      undefined,
    ])

    expect(
      form.deps(["foo", "bar"], {
        result: false,
        submitting: false,
        submitted: false,
        changedFields: false,
        dirtyFields: false,
      })
    ).toEqual([
      `["fooz","barz"]`,
      `[["error"],["yolo"]]`,
      `[]`,
      `[]`,
      undefined,
      undefined,
      undefined,
    ])

    expect(
      form.deps(["foo", "bar"], {
        result: false,
        submitting: false,
        submitted: false,
        changedFields: false,
        dirtyFields: false,
        errors: false,
      })
    ).toEqual([
      `["fooz","barz"]`,
      `[]`,
      `[]`,
      `[]`,
      undefined,
      undefined,
      undefined,
    ])

    expect(
      form.deps(["foo", "bar"], {
        result: false,
        submitting: false,
        submitted: false,
        changedFields: false,
        dirtyFields: false,
        errors: false,
        values: false,
      })
    ).toEqual([`[]`, `[]`, `[]`, `[]`, undefined, undefined, undefined])
  })
})
