import { ObservableValue } from "@corets/value"
import { ObjectSchema, ValidationResult } from "@corets/schema"
import { ObservableStore } from "@corets/store"

export type CreateForm = <TValue extends object = any, TResult = any>(
  initialValue?: TValue
) => ObservableForm<TValue, TResult>

export type CreateFormFromSchema = <TValue extends object = any, TResult = any>(
  schema: ObjectSchema<TValue>
) => ObservableForm<TValue, TResult>

export type FormValidator<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => Promise<ValidationResult | undefined> | ValidationResult | undefined

export type FormCallback<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => void

export type FormCallbackUnsubscribe = () => void

export type FormHandler<TValue extends object, TResult> = (
  form: ObservableForm<TValue, TResult>
) => Promise<TResult | undefined> | TResult | undefined

export type FormValidateOptions = {
  validateChangedFieldsOnly?: boolean
  keepPreviousErrors?: boolean
  persistErrors?: boolean
  sanitize?: boolean
}

export type FormSubmitOptions = FormValidateOptions & { validate?: boolean }

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
  validateOnSubmit: boolean
  validateChangedFieldsOnly: boolean
  validateOnChange: boolean
  debounceChanges: number
}

export interface ObservableForm<TValue extends object = any, TResult = any> {
  configuration: ObservableStore<FormConfig<TValue, TResult>>
  values: ObservableStore<TValue>
  errors: ObservableStore<ValidationResult>
  result: ObservableValue<TResult | undefined>
  dirtyFields: ObservableValue<string[]>
  changedFields: ObservableValue<string[]>
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>

  get(): TValue
  getAt(path: string): any
  set(newValues: TValue): void
  setAt(path: string, value: any): void
  put(newValues: Partial<TValue>): void
  clear(initialValues?: TValue): void

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
  isSubmitted(): boolean

  submit(options?: FormSubmitOptions): Promise<TResult | undefined>
  validate(options?: FormValidateOptions): Promise<ValidationResult | undefined>

  config(config: Partial<FormConfig<TValue, TResult>>): this
  validator(validator: FormValidator<TValue, TResult>): this
  schema(schema: ObjectSchema<TValue>): this
  handler(handler: FormHandler<TValue, TResult>): this

  listen(
    callback: FormCallback<TValue, TResult>,
    notifyImmediately?: boolean
  ): FormCallbackUnsubscribe

  deps(field: string | string[], options?: FormDepsOptions): any[]
}
