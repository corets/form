import { ObjectSchema, ValidationResult } from "@corets/schema"
import { ObjectAccessor } from "@corets/accessor"

export type CreateForm = <TValue extends object = any, TResult = any>(
  initialValue?: TValue
) => ObservableForm<TValue, TResult>

export type CreateFormFromSchema = <TValue extends object = any, TResult = any>(
  schemaOrSchemaFactory: FormSchema<TValue>
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
  value?: boolean
  isDirty?: boolean
  isChanged?: boolean
  isSubmitting?: boolean
  isSubmitted?: boolean
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

export type FormSchema<TValue extends object> =
  | ObjectSchema<TValue>
  | ((form: ObservableForm<TValue>) => ObjectSchema<TValue>)

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
  isDirtyAt(field: string): boolean
  getDirty(): string[]
  setDirtyAt(newFields: string | string[]): void
  addDirtyAt(newFields: string | string[]): void
  clearDirty(): void
  clearDirtyAt(fields: string | string[]): void

  isChanged(): boolean
  isChangedAt(field: string): boolean
  getChanged(): string[]
  setChangedAt(newFields: string | string[]): void
  addChangedAt(newFields: string | string[]): void
  clearChanged(): void
  clearChangedAt(fields: string | string[]): void

  getResult(): TResult | undefined
  setResult(newValue: TResult | undefined): void
  clearResult(): void

  isSubmitting(): boolean
  setIsSubmitting(submitted: boolean): void
  isSubmitted(): boolean
  setIsSubmitted(submitted: boolean): void

  submit(options?: FormSubmitOptions): Promise<TResult | undefined>
  validate(options?: FormValidateOptions): Promise<ValidationResult | undefined>

  configure(config: Partial<FormConfig<TValue, TResult>>): this
  validator(validator: FormValidator<TValue, TResult>): this
  schema(schemaOrSchemaFactory: FormSchema<TValue>): this
  handler(handler: FormHandler<TValue, TResult>): this

  listen(
    callback: FormListener<TValue, TResult>,
    options?: FormListenOptions
  ): FormListenerUnsubscribe

  getDeps(field: string | string[], options?: FormDepsOptions): any[]

  getFields(): ObjectAccessor<
    TValue,
    ObservableFormField<ObservableForm<TValue, TResult>>
  >
}

export interface ObservableFormField<
  TForm extends ObservableForm = ObservableForm
> {
  getValue(): any
  setValue(value: any): void
  getKey(): string

  getErrors(): string[] | undefined
  setErrors(newErrors: string | string[]): void
  addErrors(newErrors: string | string[]): void
  hasErrors(): boolean
  clearErrors(): void

  isDirty(): boolean
  setDirty(): void
  clearDirty(): void

  isChanged(): boolean
  setChanged(): void
  clearChanged(): void

  getForm(): TForm
  getDeps(options?: FormDepsOptions): any[]
}
