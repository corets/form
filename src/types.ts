import { ObjectSchema, ValidationResult } from "@corets/schema"

export type CreateForm = <TValue extends object = any, TResult = any>(
  initialValue?: TValue
) => ObservableForm<TValue, TResult>

export type CreateFormFromSchema = <TValue extends object = any, TResult = any>(
  schema: ObjectSchema<TValue>
) => ObservableForm<TValue, TResult>

export type FormValidator<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => Promise<ValidationResult | undefined> | ValidationResult | undefined

export type FormListener<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => void

export type FormListenerUnsubscribe = () => void

export type FormHandler<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => Promise<TResult | undefined> | TResult | undefined

export type FormValidateOptions = {
  changed?: boolean
  sanitize?: boolean
  persist?: boolean
}

export type FormSubmitOptions = {
  validate?: boolean
  sanitize?: boolean
  changed?: boolean
}

export type FormDepsOptions = {
  config?: boolean
  values?: boolean
  dirtyFields?: boolean
  changedFields?: boolean
  submitting?: boolean
  submitted?: boolean
  errors?: boolean
  result?: boolean
}

export type FormConfig<TValue extends object, TResult> = {
  validator: FormValidator<TValue, TResult> | undefined
  schema: ObjectSchema<TValue> | undefined
  handler: FormHandler<TValue, TResult> | undefined
  debounce: number
  reactive: boolean
  validate: boolean
  sanitize: boolean
}

export type FormListenOptions = {
  immediate?: boolean
  debounce?: number
}

export interface ObservableForm<TValue extends object = any, TResult = any> {
  get(): TValue
  getAt(path: string): any
  set(newValues: TValue): void
  setAt(path: string, value: any): void
  put(newValues: Partial<TValue>): void
  clear(initialValue?: TValue): void

  getErrors(): ValidationResult | undefined
  getErrorsAt(path: string): string[] | undefined
  setErrors(newErrors: ValidationResult | undefined): void
  setErrorsAt(path: string, newErrors: string | string[]): void
  addErrors(newErrors: ValidationResult | undefined): void
  addErrorsAt(path: string, newErrors: string | string[]): void
  hasErrors(): boolean
  hasErrorsAt(path: string): boolean
  clearErrors(): void
  clearErrorsAt(path: string | string[]): void

  isDirty(): boolean
  isDirtyField(field: string): boolean
  getDirtyFields(): string[]
  setDirtyFields(newFields: string | string[]): void
  addDirtyFields(newFields: string | string[]): void
  clearDirtyFields(): void
  clearDirtyField(fields: string | string[]): void

  isChanged(): boolean
  isChangedField(field: string): boolean
  getChangedFields(): string[]
  setChangedFields(newFields: string | string[]): void
  addChangedFields(newFields: string | string[]): void
  clearChangedFields(): void
  clearChangedField(fields: string | string[]): void

  getResult(): TResult | undefined
  setResult(newValue: TResult | undefined): void
  clearResult(): void

  isSubmitting(): boolean
  setSubmitting(submitted: boolean): void
  isSubmitted(): boolean
  setSubmitted(submitted: boolean): void

  submit(options?: FormSubmitOptions): Promise<TResult | undefined>
  validate(options?: FormValidateOptions): Promise<ValidationResult | undefined>

  config(config: Partial<FormConfig<TValue, TResult>>): this
  validator(validator: FormValidator<TValue, TResult>): this
  schema(schema: ObjectSchema<TValue>): this
  handler(handler: FormHandler<TValue, TResult>): this

  listen(
    callback: FormListener<TValue, TResult>,
    options?: FormListenOptions
  ): FormListenerUnsubscribe

  deps(field: string | string[], options?: FormDepsOptions): any[]
}
