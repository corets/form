import { ObservableValue, ValueCallback } from "@corets/value"
import { ValidationResult, ObjectSchema } from "@corets/schema"
import { ObservableStore, StoreCallback } from "@corets/store"

export type CreateForm = <TValue extends object = any, TResult = any>(
  initialValue: TValue
) => ObservableForm<TValue, TResult>
export type CreateFormFromSchema = <TValue extends object = any, TResult = any>(
  schema: ObjectSchema<TValue>
) => ObservableForm<TValue, TResult>
export type CreateFormErrors = (
  initialValue?: ValidationResult
) => ObservableErrors
export type CreateFormFields = (initialValue?: string[]) => ObservableFormFields
export type CreateFormValues = <TValue extends object>(
  initialValue: TValue | undefined,
  dirtyFields: ObservableFormFields,
  changedFields: ObservableFormFields
) => ObservableFormValues<TValue>
export type FormValidator<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => Promise<ValidationResult | undefined> | ValidationResult | undefined
export type FormCallback<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => void
export type FormHandler<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => Promise<TResult | undefined> | TResult | undefined
export type FormValidateOptions = {
  changedFieldsOnly?: boolean
  keepPreviousErrors?: boolean
  persistErrors?: boolean
}
export type FormSubmitOptions = { validate?: boolean }
export type FormErrorsCallback = (
  newErrors: ValidationResult | undefined
) => void

export type DepsOptions = {
  values?: boolean
  dirtyFields?: boolean
  changedFields?: boolean
  submitting?: boolean
  submitted?: boolean
  errors?: boolean
  result?: boolean
}

export type FormConfig<TValue extends object, TResult> = {
  validators: FormValidator<TValue, TResult>[]
  schemas: ObjectSchema<TValue>[]
  handler: FormHandler<TValue, TResult> | undefined
  validateOnSubmit: boolean
  validateChangedFieldsOnly: boolean
  validateOnChange: boolean
}

export interface ObservableFormFields {
  value: ObservableValue<string[]>

  get(): string[]
  has(newFields: string | string[]): boolean
  set(newFields: string[]): void
  add(newFields: string | string[]): void
  remove(fields: string | string[]): void
  clear(): void

  listen(callback?: ValueCallback<string[]>, notifyImmediately?: boolean): void
}

export interface ObservableErrors {
  value: ObservableStore<ValidationResult>

  get(): ValidationResult | undefined
  set(newErrors: ValidationResult | undefined): void
  add(newErrors: Partial<ValidationResult> | undefined): void
  has(): boolean
  clear(): void

  getAt(path: string): string[] | undefined
  setAt(path: string, newErrors: string[]): void
  addAt(path: string, newErrors: string | string[]): void
  hasAt(path: string | string[]): boolean
  clearAt(path: string | string[]): void

  listen(callback: FormErrorsCallback, notifyImmediately?: boolean): void
}

export interface ObservableFormValues<TValue extends object> {
  value: ObservableStore<TValue>

  get(): TValue
  set(newValues: TValue): void
  add(newValues: Partial<TValue>): void
  reset(initialValue?: TValue): void

  getAt(path: string): any
  setAt(path: string, value: any): void
  hasAt(path: string): boolean

  listen(callback: StoreCallback<TValue>, notifyImmediately?: boolean): void
}

export interface ObservableForm<TValue extends object = any, TResult = any> {
  config: FormConfig<TValue, TResult>
  values: ObservableFormValues<TValue>
  dirtyFields: ObservableFormFields
  changedFields: ObservableFormFields
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>
  errors: ObservableErrors
  result: ObservableValue<TResult | undefined>

  reset(initialValues?: TValue): void
  submit(options?: FormSubmitOptions): Promise<TResult | undefined>
  validate(options?: FormValidateOptions): Promise<ValidationResult | undefined>

  configure(config: Partial<FormConfig<TValue, TResult>>): this
  validator(handler: FormValidator<TValue, TResult>): this
  schema(handler: ObjectSchema<TValue>): this
  handler(handler: FormHandler<TValue, TResult>): this

  listen(
    callback: FormCallback<TValue, TResult>,
    notifyImmediately?: boolean
  ): this

  deps(field: string | string[], options?: DepsOptions): any[]
}
