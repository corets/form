import { FormErrorsCallback, ObservableErrors } from "./types"
import { ValidationResult } from "@corets/schema"
import { createStore, ObservableStore } from "@corets/store"
import { get } from "lodash-es"
import { isEmptyErrorsObject } from "./isEmptyErrorsObject"
import { isEmptyErrorsArray } from "./isEmptyErrorsArray"

export class FormErrors implements ObservableErrors {
  value: ObservableStore<ValidationResult>

  constructor(initialValue?: ValidationResult) {
    this.value = createStore({})

    if (initialValue) {
      this.set(initialValue)
    }
  }

  get(): ValidationResult | undefined | any {
    const errors = this.value.get()

    if (isEmptyErrorsObject(errors)) {
      return undefined
    }

    return errors
  }

  getAt(path: string): string[] | undefined {
    const errors = get(this.value.get(), path)

    if (isEmptyErrorsArray(errors)) {
      return undefined
    }

    return errors
  }

  set(newErrors: ValidationResult | undefined): void {
    this.value.set(newErrors || {})
  }

  setAt(path: string, newErrors: string[]): void {
    const errors = this.value.get()
    errors[path] = newErrors

    this.value.set(errors)
  }

  add(newErrors: Partial<ValidationResult> | undefined): void {
    this.value.add(newErrors || {})
  }

  addAt(path: string, newErrors: string | string[]): void {
    if (!Array.isArray(newErrors)) {
      newErrors = [newErrors]
    }

    const errors = this.getAt(path) || []
    errors.push(...newErrors)

    this.setAt(path, errors)
  }

  has(): boolean {
    return this.get() !== undefined
  }

  hasAt(path: string | string[]): boolean {
    if (!Array.isArray(path)) {
      path = [path]
    }

    const hasErrors = path.map((p) => this.getAt(p) !== undefined)

    return hasErrors.includes(true)
  }

  clearAt(path: string | string[]): void {
    if (!Array.isArray(path)) {
      path = [path]
    }

    const errors = this.value.get()

    if (errors) {
      path.forEach((p) => delete errors[p])

      this.set(errors)
    }
  }

  clear(): void {
    this.value.reset()
  }

  listen(callback: FormErrorsCallback, notifyImmediately?: boolean): void {
    const wrappedCallback = (errors: ValidationResult) =>
      callback(isEmptyErrorsObject(errors) ? undefined : errors)

    this.value.listen(wrappedCallback, notifyImmediately)
  }
}
