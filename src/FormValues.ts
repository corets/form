import { ObservableFormFields, ObservableFormValues } from "./types"
import { createStore, ObservableStore, StoreCallback } from "@corets/store"
import get from "lodash/get"
import has from "lodash/has"
import set from "lodash/set"
import isEqual from "lodash/isEqual"

export class FormValues<TValue extends object>
  implements ObservableFormValues<TValue> {
  value: ObservableStore<TValue>
  dirtyFields: ObservableFormFields
  changedFields: ObservableFormFields

  constructor(
    initialValue: TValue | undefined,
    dirtyFields: ObservableFormFields,
    changedFields: ObservableFormFields
  ) {
    this.value = createStore(initialValue || ({} as any))
    this.dirtyFields = dirtyFields
    this.changedFields = changedFields
  }

  get(): TValue {
    return this.value.get()
  }

  set(newValues: TValue): void {
    this.value.set(newValues)
  }

  add(newValues: Partial<TValue>): void {
    this.value.add(newValues)
  }

  reset(initialValue?: TValue): void {
    this.value.reset(initialValue)
  }

  getAt(path: string): any {
    return get(this.value.get(), path)
  }

  setAt(path: string, newValue: any): void {
    const newValues = set(this.value.get(), path, newValue)

    this.value.set(newValues)

    const oldValue = get(this.value.initialValue, path)

    if (!isEqual(oldValue, newValue)) {
      this.changedFields.add(path)
    }

    this.dirtyFields.add(path)
  }

  hasAt(path: string): boolean {
    return has(this.value.get(), path)
  }

  listen(callback: StoreCallback<TValue>, notifyImmediately?: boolean): void {
    this.value.listen(callback, notifyImmediately)
  }
}
