import { FormErrors } from "./FormErrors"

describe("FormErrors", () => {
  it("returns and sets errors", () => {
    const errors = new FormErrors()

    expect(errors.get()).toBe(undefined)

    errors.set({ foo: ["bar"] })

    expect(errors.get()).toEqual({ foo: ["bar"] })

    errors.set({ foo: ["baz"] })

    expect(errors.get()).toEqual({ foo: ["baz"] })
  })

  it("returns initial errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    expect(errors.get()).toEqual({ foo: ["bar"] })
  })

  it("tells if there are any errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    expect(errors.has()).toBe(true)

    errors.clear()

    expect(errors.has()).toBe(false)
  })

  it("takes new errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })
    errors.set({ bar: ["foo"] })

    expect(errors.get()).toEqual({ bar: ["foo"] })
  })

  it("adds new errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })
    errors.add({ bar: ["foo"] })

    expect(errors.get()).toEqual({ foo: ["bar"], bar: ["foo"] })
  })

  it("clears errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })
    errors.clear()

    expect(errors.get()).toBe(undefined)
  })

  it("returns error at given path", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    expect(errors.getAt("foo")).toEqual(["bar"])
    expect(errors.getAt("bar")).toEqual(undefined)
  })

  it("adds errors at given path", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    errors.addAt("foo", ["yolo"])

    expect(errors.get()).toEqual({ foo: ["bar", "yolo"] })

    errors.addAt("bar", ["yolo"])

    expect(errors.get()).toEqual({ foo: ["bar", "yolo"], bar: ["yolo"] })

    errors.addAt("bar", "baz")

    expect(errors.get()).toEqual({ foo: ["bar", "yolo"], bar: ["yolo", "baz"] })
  })

  it("tells if there are any errors at given path", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    expect(errors.hasAt("foo")).toBe(true)
    expect(errors.hasAt("bar")).toBe(false)
    expect(errors.hasAt(["foo", "bar"])).toBe(true)
    expect(errors.hasAt(["bar", "baz"])).toBe(false)
  })

  it("removes errors at", () => {
    const errors = new FormErrors({ foo: ["bar"], yolo: ["swag"] })

    errors.clearAt("yolo")

    expect(errors.get()).toEqual({ foo: ["bar"] })

    errors.set({ foo: ["bar"], yolo: ["swag"], baz: ["boink"] })

    errors.clearAt(["foo", "yolo"])

    expect(errors.get()).toEqual({ baz: ["boink"] })
  })

  it("listens to changes", () => {
    const errors = new FormErrors({ foo: ["bar"] })
    const callback = jest.fn()

    errors.listen(callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ foo: ["bar"] })

    errors.addAt("bar", "baz")

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith({ foo: ["bar"], bar: ["baz"] })

    errors.set({ field: ["error"] })

    expect(callback).toHaveBeenCalledTimes(3)
    expect(callback).toHaveBeenCalledWith({ field: ["error"] })

    errors.setAt("field2", ["error2"])

    expect(callback).toHaveBeenCalledTimes(4)
    expect(callback).toHaveBeenCalledWith({
      field: ["error"],
      field2: ["error2"],
    })

    errors.clearAt("field2")

    expect(callback).toHaveBeenCalledTimes(5)
    expect(callback).toHaveBeenCalledWith({ field: ["error"] })

    errors.clear()

    expect(callback).toHaveBeenCalledTimes(6)
    expect(callback).toHaveBeenCalledWith(undefined)
  })

  it("it modifies errors even if error object is not initialized yet", () => {
    const errors1 = new FormErrors()
    expect(errors1.get()).toBe(undefined)
    errors1.set({ field: ["error"] })
    expect(errors1.get()).toEqual({ field: ["error"] })

    const errors2 = new FormErrors()
    expect(errors2.get()).toBe(undefined)
    errors2.setAt("field", ["error"])
    expect(errors2.get()).toEqual({ field: ["error"] })

    const errors3 = new FormErrors()
    expect(errors3.get()).toBe(undefined)
    errors3.add({ field: ["error"] })
    expect(errors3.get()).toEqual({ field: ["error"] })

    const errors4 = new FormErrors()
    expect(errors4.get()).toBe(undefined)
    errors4.addAt("field", ["error"])
    expect(errors4.get()).toEqual({ field: ["error"] })
  })
})
