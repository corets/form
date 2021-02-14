import { Form } from "./Form"
import { object, string } from "@corets/schema"
import { createTimeout } from "@corets/promise-helpers"
import { createForm } from "./createForm"

describe("Form", () => {
  it("creates with initial values", () => {
    const form = new Form({ foo: "bar" })

    expect(form.get()).toEqual({ foo: "bar" })
  })

  it("returns and sets values", () => {
    const form = new Form({})

    expect(form.get()).toEqual({})

    form.set({ foo: "bar" })

    expect(form.get()).toEqual({ foo: "bar" })
  })

  it("puts values partially", () => {
    const form = new Form<any>({ foo: "bar" })

    form.put({ yolo: "swag" })

    expect(form.get()).toEqual({ foo: "bar", yolo: "swag" })
  })

  it("returns values at given path", () => {
    const form = new Form<any>({ foo: "bar" })

    expect(form.getAt("foo")).toBe("bar")
  })

  it("sets values at given path", () => {
    const form = new Form<any>({ foo: "bar" })

    form.setAt("yolo", "swag")

    expect(form.get()).toEqual({ foo: "bar", yolo: "swag" })
  })

  it("clears everything and resets to initial values", () => {
    const form = new Form<any>({ foo: "bar" })

    form.set({ yolo: "swag" })
    form.submitting.set(true)
    form.submitted.set(true)
    form.setDirtyFields(["foo"])
    form.setChangedFields(["foo"])
    form.setErrors({ foo: ["bar"] })
    form.setResult({ foo: ["bar"] })

    form.clear()

    expect(form.get()).toEqual({ foo: "bar" })
    expect(form.isSubmitting()).toEqual(false)
    expect(form.isSubmitted()).toEqual(false)
    expect(form.getDirtyFields()).toEqual([])
    expect(form.getChangedFields()).toEqual([])
    expect(form.getErrors()).toEqual(undefined)
    expect(form.getResult()).toEqual(undefined)
  })

  it("clears everything with custom initial values", () => {
    const form = new Form<any>({ foo: "bar" })

    form.set({ yolo: "swag" })

    form.clear({ foo: "baz" })

    expect(form.get()).toEqual({ foo: "baz" })
  })

  it("returns and sets errors", () => {
    const form = new Form()

    expect(form.getErrors()).toBe(undefined)

    form.setErrors({ foo: ["bar"] })

    expect(form.getErrors()).toEqual({ foo: ["bar"] })

    form.setErrors({ foo: ["baz"] })

    expect(form.getErrors()).toEqual({ foo: ["baz"] })

    form.setErrors(undefined)

    expect(form.getErrors()).toEqual(undefined)
  })

  it("sets errors at a given path", () => {
    const form = new Form()

    form.setErrorsAt("foo", ["bar"])

    expect(form.getErrors()).toEqual({ foo: ["bar"] })

    form.setErrorsAt("foo", "baz")

    expect(form.getErrors()).toEqual({ foo: ["baz"] })
  })

  it("tells if there are any errors", () => {
    const form = new Form()

    expect(form.hasErrors()).toBe(false)

    form.setErrors({ foo: ["error"] })

    expect(form.hasErrors()).toBe(true)

    form.clearErrors()

    expect(form.hasErrors()).toBe(false)
  })

  it("adds new errors", () => {
    const form = new Form()
    form.addErrors({ foo: ["bar"] })

    expect(form.getErrors()).toEqual({ foo: ["bar"] })

    form.addErrors({ bar: ["foo"] })

    expect(form.getErrors()).toEqual({ foo: ["bar"], bar: ["foo"] })

    form.addErrors(undefined)

    expect(form.getErrors()).toEqual({ foo: ["bar"], bar: ["foo"] })
  })

  it("clears errors", () => {
    const form = new Form()

    form.setErrors({ foo: ["error"] })

    form.clearErrors()

    expect(form.getErrors()).toBe(undefined)
  })

  it("returns error at given path", () => {
    const form = new Form()

    expect(form.getErrors()).toBe(undefined)

    form.clearErrorsAt("foo")

    expect(form.getErrors()).toBe(undefined)

    form.setErrors({ foo: ["bar"] })

    expect(form.getErrorsAt("foo")).toEqual(["bar"])
    expect(form.getErrorsAt("bar")).toEqual(undefined)
  })

  it("adds errors at given path", () => {
    const form = new Form()

    form.addErrorsAt("foo", ["bar"])
    form.addErrorsAt("foo", ["yolo"])

    expect(form.getErrors()).toEqual({ foo: ["bar", "yolo"] })

    form.addErrorsAt("bar", ["yolo"])

    expect(form.getErrors()).toEqual({ foo: ["bar", "yolo"], bar: ["yolo"] })

    form.addErrorsAt("bar", "baz")

    expect(form.getErrors()).toEqual({
      foo: ["bar", "yolo"],
      bar: ["yolo", "baz"],
    })
  })

  it("tells if there are any errors at given path", () => {
    const form = new Form()
    form.setErrors({ foo: ["bar"] })

    expect(form.hasErrorsAt("foo")).toBe(true)
    expect(form.hasErrorsAt("bar")).toBe(false)
  })

  it("removes errors at", () => {
    const form = new Form()
    form.setErrors({ foo: ["bar"], yolo: ["swag"] })

    form.clearErrorsAt("yolo")

    expect(form.getErrors()).toEqual({ foo: ["bar"] })

    form.setErrors({ foo: ["bar"], yolo: ["swag"], baz: ["boink"] })

    form.clearErrorsAt(["foo", "yolo"])

    expect(form.getErrors()).toEqual({ baz: ["boink"] })
  })

  it("submits", async () => {
    const handler = jest.fn().mockResolvedValue(true)
    const form = new Form({ foo: "bar" }).config({ validate: false })
    form.handler(handler)
    form.setErrors({ foo: ["bar"] })
    form.setResult({ foo: "bar" })

    const submitting: any[] = []
    form.submitting.listen(
      (value) => {
        submitting.push(value)
      },
      { immediate: true }
    )

    const submitted: any[] = []
    form.submitted.listen(
      (value) => {
        submitted.push(value)
      },
      { immediate: true }
    )

    let result = await form.submit()

    expect(result).toBe(true)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(form)
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false, true])
    expect(form.getErrors()).toEqual(undefined)
    expect(form.getResult()).toEqual(true)
  })

  it("submits without handler", async () => {
    const form = new Form()
    let result = await form.submit()

    expect(result).toBe(undefined)
  })

  it("does not submit if already submitting", async () => {
    const handler = jest.fn()
    const form = createForm().handler(handler)

    form.setSubmitting(true)

    await form.submit()

    expect(handler).not.toHaveBeenCalled()
  })

  it("handles errors during submission", async () => {
    const consoleError = console.error
    console.error = jest.fn()

    const form = createForm().handler(() => {
      throw new Error()
    })

    await expect(() => form.submit()).rejects.toThrow()
    expect(form.isSubmitting()).toBe(false)
    expect(form.isSubmitted()).toBe(false)

    console.error = consoleError
  })

  it("handles errors during validation", async () => {
    const consoleError = console.error
    console.error = jest.fn()

    const form = createForm().validator(() => {
      throw new Error()
    })

    await expect(() => form.submit()).rejects.toThrow()
    expect(form.isSubmitting()).toBe(false)
    expect(form.isSubmitted()).toBe(false)

    await expect(() => form.validate()).rejects.toThrow()
    expect(form.isSubmitting()).toBe(false)
    expect(form.isSubmitted()).toBe(false)

    console.error = consoleError
  })

  it("sets and returns result", () => {
    const form = new Form()

    expect(form.getResult()).toBe(undefined)

    form.setResult("foo")

    expect(form.getResult()).toBe("foo")

    form.clearResult()

    expect(form.getResult()).toBe(undefined)
  })

  it("handles rejections and thrown errors during submit", async () => {
    const errorLog = console.error
    console.error = jest.fn()

    const handler = jest.fn().mockRejectedValue(new Error("test"))
    const form = new Form({ foo: "bar" })
    form.handler(handler)

    const submitting: any[] = []
    form.submitting.listen(
      (value) => {
        submitting.push(value)
      },
      { immediate: true }
    )

    const submitted: any[] = []
    form.submitted.listen(
      (value) => {
        submitted.push(value)
      },
      { immediate: true }
    )

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
    const form = new Form({ foo: "bar" }).schema(
      object({ foo: string().min(4), bar: string().min(8) })
    )

    const errors = (await form.validate())!

    expect(errors.foo.length).toBe(1)
    expect(typeof errors.foo[0] === "string").toBe(true)
    expect(errors.bar.length).toBe(1)
    expect(typeof errors.bar[0] === "string").toBe(true)
  })

  it("sanitizes with schema", async () => {
    const form = new Form({ foo: "bar" }).schema(
      object({
        foo: string().min(4).toDefault("1234"),
        bar: string().min(4).toDefault("5678"),
      })
    )

    expect(form.get()).toEqual({ foo: "bar" })

    const errors = (await form.validate())!

    expect(errors === undefined).toBe(false)
    expect(errors.foo === undefined).toBe(false)

    expect(errors.bar === undefined).toBe(true)
    expect(form.get()).toEqual({ foo: "bar", bar: "5678" })
  })

  it("validates without sanitization", async () => {
    const form = new Form({ foo: "bar" }).schema(
      object({
        foo: string().min(4).toDefault("1234"),
        bar: string().min(4).toDefault("5678"),
      })
    )

    expect(form.get()).toEqual({ foo: "bar" })

    const errors = (await form.validate({ sanitize: false }))!

    expect(!!errors).toBe(true)
    expect(!!errors.foo).toBe(true)
    expect(!!errors.bar).toBe(true)
    expect(form.get()).toEqual({ foo: "bar" })
  })

  it("rethrows errors from schema validator", () => {
    const consoleError = jest.fn()
    console.error = consoleError

    const form = new Form({ foo: "bar" }).schema({
      sanitizeAsync: async () => ({}),
      validateAsync: async () => {
        throw new Error()
      },
    } as any)

    expect(() => form.validate()).rejects.toThrow()

    console.error = consoleError
  })

  it("rethrows errors from schema sanitizer", () => {
    const consoleError = jest.fn()
    console.error = consoleError

    const form = new Form({ foo: "bar" }).schema({
      sanitizeAsync: async () => {
        throw new Error()
      },
      validateAsync: async () => undefined,
    } as any)

    expect(() => form.validate()).rejects.toThrow()

    console.error = consoleError
  })

  it("validates with function", async () => {
    let receivedForm
    const form = new Form({ foo: "bar" }).validator((f) => {
      receivedForm = form
      return { foo: ["error"], bar: ["error"] }
    })

    const errors = (await form.validate())!

    expect(errors.foo.length).toBe(1)
    expect(typeof errors.foo[0] === "string").toBe(true)
    expect(errors.bar.length).toBe(1)
    expect(typeof errors.bar[0] === "string").toBe(true)
    expect(receivedForm).toBe(form)
  })

  it("handles errors during validate", async () => {
    const errorLog = console.error
    console.error = jest.fn()

    const validator = jest.fn().mockRejectedValue(new Error("test"))
    const form = new Form({ foo: "bar" }).validator(validator)

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
      .config({ validate: false })
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

    form.config({ validate: true })

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
      .validator(() => ({ foo: ["error"] }))
      .handler(handler)

    const submitting: any[] = []
    form.submitting.listen(
      (value) => {
        submitting.push(value)
      },
      { immediate: true }
    )

    const submitted: any[] = []
    form.submitted.listen(
      (value) => {
        submitted.push(value)
      },
      { immediate: true }
    )

    const errors: any[] = []
    form.errors.listen(
      (value) => {
        errors.push(value)
      },
      { immediate: true }
    )

    const status = await form.submit()

    expect(status).toBe(undefined)
    expect(handler).not.toHaveBeenCalled()
    expect(errors).toEqual([{}, { foo: ["error"] }])
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false])
  })

  it("validates on submit and submits if there are no validation errors", async () => {
    const handler = jest.fn(() => "result")
    const form = new Form({ foo: "bar" })
      .validator(() => undefined)
      .handler(handler)

    const submitting: any[] = []
    form.submitting.listen(
      (value) => {
        submitting.push(value)
      },
      { immediate: true }
    )

    const submitted: any[] = []
    form.submitted.listen(
      (value) => {
        submitted.push(value)
      },
      { immediate: true }
    )

    const errors: any[] = []
    form.errors.listen(
      (value) => {
        errors.push(value)
      },
      { immediate: true }
    )

    const status = await form.submit()

    expect(status).toBe("result")
    expect(handler).toHaveBeenCalled()
    expect(errors).toEqual([{}])
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false, true])
  })

  it("passes options from submit to validate", async () => {
    const handler = jest.fn(() => "result")
    const form = new Form({ foo: "ba", bar: "ba" })
      .config({ validate: false })
      .handler(handler)
      .schema(object({ foo: string().min(3), bar: string().min(3) }))

    await form.submit()

    expect(form.getErrors()).toBe(undefined)

    await form.submit({ changed: true, validate: true })

    expect(form.getErrors()).toBe(undefined)

    await form.submit({ validate: true })

    expect(!!form.getErrors()).toBe(true)
    expect(Array.isArray(form.getErrors()!.foo)).toBe(true)
    expect(Array.isArray(form.getErrors()!.bar)).toBe(true)
  })

  it("validates changed fields only", async () => {
    const form = new Form({ foo: "ba  ", bar: "ba  " }).schema(
      object({
        foo: string().min(3).toTrimmed(),
        bar: string().min(3).toTrimmed(),
      })
    )

    const errors1 = await form.validate({ changed: true })

    expect(errors1).toBe(undefined)

    form.addChangedFields("foo")

    const errors2 = (await form.validate({ changed: true }))!

    expect(errors2.foo.length).toBe(1)
    expect(typeof errors2.foo[0] === "string").toBe(true)
    expect(form.get().foo).toBe("ba")
    expect(form.get().bar).toBe("ba  ")
  })

  it("validates on change", async () => {
    const form = new Form({ foo: "ba", bar: "ba" }).schema(
      object({ foo: string().min(3), bar: string().min(3) })
    )

    expect(form.getErrors()).toBe(undefined)

    form.setAt("foo", "b")

    await createTimeout(0)

    expect(form.getErrors()).not.toBe(undefined)
    expect(form.getErrors()!.foo.length).toBe(1)
  })

  it("validates on change can be disabled", async () => {
    const form = new Form({ foo: "ba", bar: "ba" })
      .config({ reactive: false })
      .schema(object({ foo: string().min(3), bar: string().min(3) }))

    expect(form.getErrors()).toBe(undefined)

    form.setAt("foo", "b")

    await createTimeout(0)

    expect(form.getErrors()).toBe(undefined)
  })

  it("validates changed fields but keeps previous errors", async () => {
    const form = new Form({ foo: "ba", bar: "ba" }).schema(
      object({ foo: string().min(3), bar: string().min(3) })
    )

    const errors1 = await form.validate({ persist: false })

    expect(errors1 !== undefined).toBe(true)
    expect(errors1?.foo?.length).toBe(1)
    expect(errors1?.bar?.length).toBe(1)

    const errors2 = await form.validate({
      changed: true,
      persist: false,
    })

    expect(errors2 === undefined).toBe(true)

    form.addChangedFields("foo")

    const errors3 = await form.validate({
      changed: true,
      persist: false,
    })

    expect(errors3 !== undefined).toBe(true)
    expect(errors3?.foo?.length).toBe(1)
    expect(errors3?.bar?.length).toBe(undefined)

    const errors4 = await form.validate({
      persist: false,
    })

    expect(errors4 !== undefined).toBe(true)
    expect(errors4?.foo?.length).toBe(1)
    expect(errors4?.bar?.length).toBe(1)

    const errors5 = await form.validate()

    expect(errors5 !== undefined).toBe(true)
    expect(errors5?.foo?.length).toBe(1)
    expect(errors5?.bar?.length).toBe(1)

    const errors6 = await form.validate({ changed: true })

    expect(errors6 !== undefined).toBe(true)
    expect(errors6?.foo?.length).toBe(1)
    expect(errors6?.bar?.length).toBe(1)

    form.setAt("bar", "bar")

    const errors7 = await form.validate({ changed: true })

    expect(errors7 !== undefined).toBe(true)
    expect(errors7?.foo?.length).toBe(1)
    expect(errors7?.bar?.length).toBe(undefined)
  })

  it("validates without persisting errors", async () => {
    const form = new Form({ foo: "ba", bar: "ba" }).schema(
      object({ foo: string().min(3), bar: string().min(3) })
    )

    const errors1 = await form.validate({ persist: false })

    expect(errors1 !== undefined).toBe(true)
    expect(form.getErrors() === undefined).toBe(true)

    const errors2 = await form.validate()

    expect(errors2 !== undefined).toBe(true)
    expect(form.getErrors() !== undefined).toBe(true)
  })

  it("tracks a field as dirty and changed", () => {
    const form = new Form({ foo: "bar" })

    form.setAt("foo", "bar")

    expect(form.getDirtyFields()).toEqual(["foo"])
    expect(form.getChangedFields()).toEqual([])

    form.setAt("foo", "baz")

    expect(form.getDirtyFields()).toEqual(["foo"])
    expect(form.getChangedFields()).toEqual(["foo"])
  })

  it("listens", async () => {
    const form = new Form({ foo: { bar: "baz" } })
    let listener = jest.fn()

    const unsubscribe = form.listen(listener)

    await createTimeout(20)

    expect(listener).toHaveBeenCalledTimes(0)

    form.setAt("foo.bar", "yolo")

    await createTimeout(20)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(form)

    unsubscribe()

    form.setAt("foo.bar", "swag")

    await createTimeout(20)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("listens with immediate", async () => {
    const form = new Form({ foo: { bar: "baz" } })
    let listener = jest.fn()

    const unsubscribe = form.listen(listener, { immediate: true })

    await createTimeout(20)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(form)

    form.setAt("foo.bar", "yolo")

    await createTimeout(20)

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenCalledWith(form)

    unsubscribe()

    form.setAt("foo.bar", "swag")

    await createTimeout(20)

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("listens without debounce", () => {
    const form = new Form({ foo: { bar: "baz" } }).config({ debounce: 0 })
    let listener = jest.fn()

    const unsubscribe = form.listen(listener, { immediate: true })

    expect(listener).toHaveBeenCalledTimes(7)
    expect(listener).toHaveBeenCalledWith(form)

    form.setAt("foo.bar", "yolo")

    expect(listener).toHaveBeenCalledTimes(10)
    expect(listener).toHaveBeenCalledWith(form)

    unsubscribe()

    form.setAt("foo.bar", "swag")

    expect(listener).toHaveBeenCalledTimes(10)
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
      form.configuration.get(),
    ])

    form.setAt("foo", "fooz")

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","bar"]`,
      `[null,null]`,
      `[true,false]`,
      `[true,false]`,
      undefined,
      `false`,
      `false`,
      form.configuration.get(),
    ])

    form.setErrorsAt("foo", ["error"])

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","bar"]`,
      `[["error"],null]`,
      `[true,false]`,
      `[true,false]`,
      undefined,
      `false`,
      `false`,
      form.configuration.get(),
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
      form.configuration.get(),
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
      form.configuration.get(),
    ])

    form.setResult({ status: "ok" })

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","bar"]`,
      `[["error"],null]`,
      `[true,false]`,
      `[true,false]`,
      `{"status":"ok"}`,
      `true`,
      `true`,
      form.configuration.get(),
    ])

    form.setAt("bar", "barz")

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","barz"]`,
      `[["error"],null]`,
      `[true,true]`,
      `[true,true]`,
      `{"status":"ok"}`,
      `true`,
      `true`,
      form.configuration.get(),
    ])

    form.setErrorsAt("bar", ["yolo"])

    expect(form.deps(["foo", "bar"])).toEqual([
      `["fooz","barz"]`,
      `[["error"],["yolo"]]`,
      `[true,true]`,
      `[true,true]`,
      `{"status":"ok"}`,
      `true`,
      `true`,
      form.configuration.get(),
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
      form.configuration.get(),
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
      form.configuration.get(),
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
      form.configuration.get(),
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
      form.configuration.get(),
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
      form.configuration.get(),
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
      form.configuration.get(),
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
    ).toEqual([
      `[]`,
      `[]`,
      `[]`,
      `[]`,
      undefined,
      undefined,
      undefined,
      form.configuration.get(),
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
        config: false,
      })
    ).toEqual([
      `[]`,
      `[]`,
      `[]`,
      `[]`,
      undefined,
      undefined,
      undefined,
      undefined,
    ])

    expect(
      form.deps("foo", {
        result: false,
        submitting: false,
        submitted: false,
        changedFields: false,
        dirtyFields: false,
        errors: false,
        values: false,
        config: false,
      })
    ).toEqual([
      `[]`,
      `[]`,
      `[]`,
      `[]`,
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })

  it("dirty fields and changed fields are empty initially", () => {
    const form = new Form()

    expect(form.getDirtyFields()).toEqual([])
    expect(form.getChangedFields()).toEqual([])
  })

  it("returns and sets dirty and changed fields", () => {
    const form = new Form()

    expect(form.getDirtyFields()).toEqual([])
    expect(form.getChangedFields()).toEqual([])

    form.setDirtyFields(["foo"])
    form.setChangedFields(["bar"])

    expect(form.getDirtyFields()).toEqual(["foo"])
    expect(form.getChangedFields()).toEqual(["bar"])

    form.setDirtyFields("yolo")
    form.setChangedFields("swag")

    expect(form.getDirtyFields()).toEqual(["yolo"])
    expect(form.getChangedFields()).toEqual(["swag"])
  })

  it("tells if a dirty or changed field is set", () => {
    const form = new Form()
    form.setDirtyFields(["foo", "bar"])
    form.setChangedFields(["yolo", "swag"])

    expect(form.isDirtyField("foo")).toBe(true)
    expect(form.isChangedField("yolo")).toBe(true)
    expect(form.isDirtyField("baz")).toBe(false)
  })

  it("adds dirty and changed fields", () => {
    const form = new Form()
    form.addDirtyFields("foo")
    form.addChangedFields("yolo")

    expect(form.getDirtyFields()).toEqual(["foo"])
    expect(form.getChangedFields()).toEqual(["yolo"])

    form.addDirtyFields(["bar"])
    form.addChangedFields(["swag"])

    expect(form.getDirtyFields()).toEqual(["foo", "bar"])
    expect(form.getChangedFields()).toEqual(["yolo", "swag"])
  })

  it("does not allow duplicates inside dirty and changed fields", () => {
    const form = new Form()
    form.setDirtyFields(["foo", "foo"])
    form.setChangedFields(["yolo", "yolo"])

    expect(form.getDirtyFields()).toEqual(["foo"])
    expect(form.getChangedFields()).toEqual(["yolo"])

    form.addDirtyFields(["foo"])
    form.addChangedFields(["yolo"])

    expect(form.getDirtyFields()).toEqual(["foo"])
    expect(form.getChangedFields()).toEqual(["yolo"])
  })

  it("clears dirty and changed fields at specific paths", () => {
    const form = new Form()
    form.setDirtyFields(["foo", "bar"])
    form.setChangedFields(["yolo", "swag"])

    expect(form.getDirtyFields()).toEqual(["foo", "bar"])
    expect(form.getChangedFields()).toEqual(["yolo", "swag"])

    form.clearDirtyField(["bar"])
    form.clearChangedField(["swag"])

    expect(form.getDirtyFields()).toEqual(["foo"])
    expect(form.getChangedFields()).toEqual(["yolo"])

    form.clearDirtyField("foo")
    form.clearChangedField("yolo")

    expect(form.getDirtyFields()).toEqual([])
    expect(form.getChangedFields()).toEqual([])
  })

  it("clears dirty and changed fields fields", () => {
    const form = new Form()

    form.setDirtyFields(["foo"])
    form.setChangedFields(["bar"])

    expect(form.getDirtyFields()).toEqual(["foo"])
    expect(form.getChangedFields()).toEqual(["bar"])

    form.clearDirtyFields()

    expect(form.getDirtyFields()).toEqual([])

    form.clearChangedFields()

    expect(form.getChangedFields()).toEqual([])
  })

  it("tells if form is changed or dirty", () => {
    const form = new Form({ foo: "bar" })

    expect(form.isDirty()).toBe(false)
    expect(form.isChanged()).toBe(false)

    form.setAt("foo", "bar")

    expect(form.isDirty()).toBe(true)
    expect(form.isChanged()).toBe(false)

    form.setAt("foo", "baz")

    expect(form.isDirty()).toBe(true)
    expect(form.isChanged()).toBe(true)
  })

  it("tells if form is submitting", () => {
    const form = new Form({ foo: "bar" })

    expect(form.isSubmitting()).toBe(false)

    form.setSubmitting(true)

    expect(form.isSubmitting()).toBe(true)
  })

  it("tells if form is submitted", () => {
    const form = new Form({ foo: "bar" })

    expect(form.isSubmitted()).toBe(false)

    form.setSubmitted(true)

    expect(form.isSubmitted()).toBe(true)
  })

  it("configured 'reactive' to true by default", async () => {
    const form = new Form({ foo: "a", bar: "b" }).schema(
      object({ foo: string().min(3), bar: string().min(3) })
    )

    expect(form.getErrors() === undefined).toBe(true)

    form.setAt("foo", "aa")

    await createTimeout(0)

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(true)

    await form.validate()

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)

    form.setAt("foo", "aaa")

    await createTimeout(0)

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(false)
  })

  it("accepts 'reactive' false", async () => {
    const form = new Form({ foo: "a", bar: "b" })
      .config({ reactive: false })
      .schema(object({ foo: string().min(3), bar: string().min(3) }))

    expect(form.getErrors() === undefined).toBe(true)

    form.setAt("foo", "aa")

    await createTimeout(0)

    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(true)

    await form.validate()

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)

    form.setAt("foo", "aaa")

    await createTimeout(0)

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)

    await form.validate()

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(false)
  })

  it("configures 'validate' to true by default", async () => {
    const form = new Form({ foo: "a", bar: "b" }).schema(
      object({ foo: string().min(3), bar: string().min(3) })
    )

    await form.submit()

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)

    await form.submit({ validate: false })

    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(true)
  })

  it("accepts 'validate' false", async () => {
    const form = new Form({ foo: "a", bar: "b" })
      .config({ validate: false })
      .schema(object({ foo: string().min(3), bar: string().min(3) }))

    await form.submit()

    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(true)

    await form.submit({ validate: true })

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)
  })

  it("configures 'sanitize' to true by default", async () => {
    const form = new Form({ foo: "a  ", bar: "b  " }).schema(
      object({
        foo: string().min(3).toTrimmed(),
        bar: string().min(3).toTrimmed(),
      })
    )

    await form.submit()

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)
    expect(form.get()).toEqual({ foo: "a", bar: "b" })

    form.set({ foo: "a  ", bar: "b  " })

    await form.submit({ sanitize: false })

    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(true)
    expect(form.get()).toEqual({ foo: "a  ", bar: "b  " })

    await form.validate()

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)
    expect(form.get()).toEqual({ foo: "a", bar: "b" })

    form.set({ foo: "a  ", bar: "b  " })

    await form.validate({ sanitize: false })

    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(true)
    expect(form.get()).toEqual({ foo: "a  ", bar: "b  " })
  })

  it("accepts 'sanitize' false", async () => {
    const form = new Form({ foo: "a  ", bar: "b  " })
      .config({ sanitize: false })
      .schema(
        object({
          foo: string().min(3).toTrimmed(),
          bar: string().min(3).toTrimmed(),
        })
      )

    await form.submit()

    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(true)
    expect(form.get()).toEqual({ foo: "a  ", bar: "b  " })

    await form.submit({ sanitize: true })

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)
    expect(form.get()).toEqual({ foo: "a", bar: "b" })

    form.set({ foo: "a  ", bar: "b  " })

    await form.validate({ sanitize: true })

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)
    expect(form.get()).toEqual({ foo: "a", bar: "b" })
  })

  it("sets 'changed' to false by default", async () => {
    const form = new Form({ foo: "a  ", bar: "b  " }).schema(
      object({
        foo: string().min(3).toTrimmed(),
        bar: string().min(3).toTrimmed(),
      })
    )

    await form.submit()

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)
    expect(form.get()).toEqual({ foo: "a", bar: "b" })

    form.set({ foo: "a  ", bar: "b  " })

    await form.validate()

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(false)
    expect(form.get()).toEqual({ foo: "a", bar: "b" })

    form.set({ foo: "a  ", bar: "b  " })

    await form.submit({ changed: true })

    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(true)
    expect(form.get()).toEqual({ foo: "a  ", bar: "b  " })

    await form.validate({ changed: true })

    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
    expect(form.getErrors()?.bar === undefined).toBe(true)
    expect(form.get()).toEqual({ foo: "a  ", bar: "b  " })

    form.changedFields.set(["foo"])

    await form.submit({ changed: true })

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(true)
    expect(form.get()).toEqual({ foo: "a", bar: "b  " })

    form.clearErrors()
    form.set({ foo: "a  ", bar: "b  " })

    await form.validate({ changed: true })

    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)
    expect(form.getErrors()?.bar === undefined).toBe(true)
    expect(form.get()).toEqual({ foo: "a", bar: "b  " })
  })

  it("sets 'persist' to true by default", async () => {
    const form = new Form({ foo: "a" }).schema(
      object({
        foo: string().min(3),
      })
    )

    const errors1 = await form.validate()

    expect(errors1 === undefined).toBe(false)
    expect(errors1?.foo === undefined).toBe(false)
    expect(form.getErrors() === undefined).toBe(false)
    expect(form.getErrors()?.foo === undefined).toBe(false)

    form.clearErrors()

    const errors2 = await form.validate({ persist: false })

    expect(errors2 === undefined).toBe(false)
    expect(errors2?.foo === undefined).toBe(false)
    expect(form.getErrors() === undefined).toBe(true)
    expect(form.getErrors()?.foo === undefined).toBe(true)
  })
})
