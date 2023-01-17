import { ObservableForm, ObservableFormField, FormDepsOptions } from "./types"

export class FormField<TForm extends ObservableForm>
  implements ObservableFormField<TForm> {
  form: TForm
  key: string

  constructor(form: TForm, key: string) {
    this.form = form
    this.key = key
  }

  getValue(): any {
    return this.form.getAt(this.key)
  }

  setValue(value: any): void {
    this.form.setAt(this.key, value)
  }

  getKey(): string {
    return this.key
  }

  getErrors(): string[] | undefined {
    return this.form.getErrorsAt(this.key)
  }

  setErrors(newErrors: string | string[]): void {
    this.form.setErrorsAt(this.key, newErrors)
  }

  hasErrors(): boolean {
    return this.form.hasErrorsAt(this.key)
  }

  addErrors(newErrors: string | string[]): void {
    this.form.addErrorsAt(this.key, newErrors)
  }

  clearErrors(): void {
    this.form.clearErrorsAt(this.key)
  }

  isDirty(): boolean {
    return this.form.isDirtyAt(this.key)
  }

  setDirty(): void {
    this.form.setDirtyAt(this.key)
  }

  clearDirty(): void {
    this.form.clearDirtyAt(this.key)
  }

  isChanged(): boolean {
    return this.form.isChangedAt(this.key)
  }

  setChanged(): void {
    this.form.setChangedAt(this.key)
  }

  clearChanged(): void {
    this.form.clearChangedAt(this.key)
  }

  getForm(): TForm {
    return this.form
  }

  getDeps(options?: FormDepsOptions): any[] {
    return this.form.getDeps(this.getKey(), options)
  }
}
