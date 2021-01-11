import { FormFields } from "./FormFields"

describe("FormFields", () => {
  it("returns and sets form fields", () => {
    const fields = new FormFields()

    expect(fields.get()).toEqual([])

    fields.set(["foo"])

    expect(fields.get()).toEqual(["foo"])
  })

  it("returns initial form fields", () => {
    const fields = new FormFields(["foo"])

    expect(fields.get()).toEqual(["foo"])
  })

  it("tells if given field is set", () => {
    const fields = new FormFields(["foo", "bar"])

    expect(fields.has("foo")).toBe(true)
    expect(fields.has(["foo", "bar"])).toBe(true)
    expect(fields.has(["foo", "baz"])).toBe(false)
  })

  it("adds fields", () => {
    const fields = new FormFields(["foo"])
    fields.add(["bar"])

    expect(fields.get()).toEqual(["foo", "bar"])

    fields.add("baz")

    expect(fields.get()).toEqual(["foo", "bar", "baz"])
  })

  it("does not allow duplicates", () => {
    const fields = new FormFields(["foo"])
    fields.add(["foo"])

    expect(fields.get()).toEqual(["foo"])

    fields.set(["foo", "foo"])

    expect(fields.get()).toEqual(["foo"])
  })

  it("removes fields", () => {
    const fields = new FormFields(["foo", "bar", "yolo", "swag"])
    fields.remove("foo")

    expect(fields.get()).toEqual(["bar", "yolo", "swag"])

    fields.remove(["bar", "yolo"])

    expect(fields.get()).toEqual(["swag"])
  })

  it("clears fields", () => {
    const fields = new FormFields(["foo"])

    fields.clear()

    expect(fields.get()).toEqual([])
  })

  it("listens to changes", () => {
    const fields = new FormFields(["foo"])
    const callback = jest.fn()

    fields.listen(callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(["foo"])

    fields.add("bar")

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith(["foo", "bar"])
  })
})
