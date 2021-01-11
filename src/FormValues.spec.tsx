import { FormValues } from "./FormValues"
import { createFormFields } from "./createFormFields"

describe("FormValues", () => {
  it("sets and returns state", () => {
    const values = new FormValues<any>(
      {},
      createFormFields(),
      createFormFields()
    )

    expect(values.get()).toEqual({})

    values.set({ foo: "bar" })

    expect(values.get()).toEqual({ foo: "bar" })

    values.set({ yolo: "swag" })

    expect(values.get()).toEqual({ yolo: "swag" })
  })

  it("returns initial state", () => {
    const values = new FormValues(
      { foo: "bar" },
      createFormFields(),
      createFormFields()
    )

    expect(values.get()).toEqual({ foo: "bar" })
  })

  it("adds new state", () => {
    const values = new FormValues<any>(
      { foo: "bar" },
      createFormFields(),
      createFormFields()
    )
    values.add({ bar: "baz" })

    expect(values.get()).toEqual({ foo: "bar", bar: "baz" })
  })

  it("resets to initial state", () => {
    const values = new FormValues<any>(
      { foo: "bar" },
      createFormFields(),
      createFormFields()
    )

    values.add({ bar: "baz" })
    values.reset()

    expect(values.get()).toEqual({ foo: "bar" })

    values.add({ bar: "baz" })
    values.reset({ yolo: "swag" })

    expect(values.get()).toEqual({ yolo: "swag" })

    values.add({ bar: "baz" })
    values.reset()

    expect(values.get()).toEqual({ yolo: "swag" })
  })

  it("returns state at", () => {
    const values = new FormValues<any>(
      { foo: "bar" },
      createFormFields(),
      createFormFields()
    )

    expect(values.getAt("foo")).toBe("bar")
    expect(values.getAt("bar")).toBe(undefined)
  })

  it("sets state at", () => {
    const values = new FormValues<any>(
      { foo: "bar" },
      createFormFields(),
      createFormFields()
    )

    values.setAt("foo", "baz")
    values.setAt("yolo", "swag")

    expect(values.get()).toEqual({ foo: "baz", yolo: "swag" })
  })

  it("tells if state is set at", () => {
    const values = new FormValues<any>(
      { foo: "bar" },
      createFormFields(),
      createFormFields()
    )

    expect(values.hasAt("foo")).toBe(true)
    expect(values.hasAt("bar")).toBe(false)
  })

  it("listens to changes", () => {
    const values = new FormValues(
      { foo: "bar", baz: { yolo: "swag" } },
      createFormFields(),
      createFormFields()
    )
    const callback = jest.fn()

    values.listen(callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ foo: "bar", baz: { yolo: "swag" } })

    values.setAt("foo", "baz")

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith({ foo: "baz", baz: { yolo: "swag" } })

    values.setAt("baz.yolo", "bar")

    expect(callback).toHaveBeenCalledTimes(3)
    expect(callback).toHaveBeenCalledWith({ foo: "baz", baz: { yolo: "bar" } })
  })
})
