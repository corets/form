import {
  FormDepsOptions,
  FormCallback,
  FormConfig,
  FormHandler,
  FormSubmitOptions,
  FormValidateOptions,
  FormValidator,
  ObservableForm,
  FormCallbackUnsubscribe,
} from "./types"
import { debounce, difference, get, isEqual, merge, set, uniq } from "lodash-es"
import {
  createValidationResult,
  ObjectSchema,
  ValidationResult,
} from "@corets/schema"
import { isEmptyErrorsObject } from "./isEmptyErrorsObject"
import { createStore, ObservableStore } from "@corets/store"
import { createValue, ObservableValue } from "@corets/value"
import { isEmptyErrorsArray } from "./isEmptyErrorsArray"

export class Form<TValue extends object = any, TResult = any>
  implements ObservableForm<TValue, TResult> {
  configuration: ObservableStore<FormConfig<TValue, TResult>>
  values: ObservableStore<TValue>
  errors: ObservableStore<ValidationResult>
  result: ObservableValue<TResult | undefined>
  dirtyFields: ObservableValue<string[]>
  changedFields: ObservableValue<string[]>
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>

  constructor(initialValues: TValue = {} as TValue) {
    this.configuration = createStore({
      handler: undefined,
      validator: undefined,
      schema: undefined,
      validateChangedFieldsOnly: false,
      validateOnChange: true,
      validateOnSubmit: true,
      debounceChanges: 10,
    })
    this.values = createStore(initialValues)
    this.errors = createStore({})
    this.result = createValue(undefined)
    this.dirtyFields = createValue([])
    this.changedFields = createValue([])
    this.submitting = createValue(false)
    this.submitted = createValue(false)

    this.setupValidateOnChange()
  }

  get(): TValue {
    return this.values.get()
  }

  getAt(path: string): any {
    return get(this.get(), path)
  }

  set(newValues: TValue): void {
    this.values.set(newValues)
  }

  setAt(path: string, newValue: any): void {
    const newValues = set(this.get(), path, newValue)

    this.set(newValues)

    const oldValue = get(this.values.initialValue, path)

    if (!isEqual(oldValue, newValue)) {
      this.addChangedFields(path)
    }

    this.addDirtyFields(path)
  }

  put(newValues: Partial<TValue>): void {
    this.values.put(newValues)
  }

  reset(initialValues?: TValue): void {
    this.values.reset(initialValues)
    this.submitting.reset()
    this.submitted.reset()
    this.dirtyFields.reset()
    this.changedFields.reset()
    this.errors.reset()
    this.result.reset()
  }

  getErrors(): ValidationResult | undefined {
    const errors = this.errors.get()

    if (isEmptyErrorsObject(errors)) {
      return undefined
    }

    return errors
  }

  getErrorsAt(path: string): string[] | undefined {
    const errors = get(this.getErrors(), path)

    if (isEmptyErrorsArray(errors)) {
      return undefined
    }

    return errors
  }

  setErrors(newErrors: ValidationResult | undefined): void {
    this.errors.set(newErrors || {})
  }

  setErrorsAt(path: string, newErrors: string | string[]): void {
    if (!Array.isArray(newErrors)) {
      newErrors = [newErrors]
    }

    const errors = this.getErrors() || {}
    errors[path] = newErrors

    this.setErrors(errors)
  }

  addErrors(newErrors: Partial<ValidationResult> | undefined): void {
    this.errors.put(newErrors || {})
  }

  addErrorsAt(path: string, newErrors: string | string[]): void {
    if (!Array.isArray(newErrors)) {
      newErrors = [newErrors]
    }

    const errors = this.getErrorsAt(path) || []
    errors.push(...newErrors)

    this.setErrorsAt(path, errors)
  }

  hasErrors(): boolean {
    return this.getErrors() !== undefined
  }

  hasErrorsAt(path: string): boolean {
    return this.getErrorsAt(path) !== undefined
  }

  clearErrors(): void {
    this.errors.reset()
  }

  clearErrorsAt(path: string | string[]): void {
    if (!Array.isArray(path)) {
      path = [path]
    }

    const errors = this.getErrors()

    if (errors) {
      path.forEach((p) => delete errors[p])

      this.setErrors(errors)
    }
  }

  isDirty(): boolean {
    return this.getDirtyFields().length > 0
  }

  isDirtyField(field: string): boolean {
    return this.getDirtyFields().includes(field)
  }

  getDirtyFields(): string[] {
    return this.dirtyFields.get()
  }

  setDirtyFields(newFields: string | string[]): void {
    if (!Array.isArray(newFields)) {
      newFields = [newFields]
    }

    this.dirtyFields.set(uniq(newFields))
  }

  addDirtyFields(newFields: string | string[]): void {
    if (!Array.isArray(newFields)) {
      newFields = [newFields]
    }

    this.setDirtyFields([...this.getDirtyFields(), ...newFields])
  }

  clearDirtyFields(): void {
    this.dirtyFields.reset()
  }

  clearDirtyFieldsAt(fields: string | string[]): void {
    if (!Array.isArray(fields)) {
      fields = [fields]
    }

    this.setDirtyFields(difference(this.getDirtyFields(), fields))
  }

  isChanged(): boolean {
    return this.getChangedFields().length > 0
  }

  isChangedField(field: string): boolean {
    return this.getChangedFields().includes(field)
  }

  getChangedFields(): string[] {
    return this.changedFields.get()
  }

  setChangedFields(newFields: string | string[]): void {
    if (!Array.isArray(newFields)) {
      newFields = [newFields]
    }

    this.changedFields.set(uniq(newFields))
  }

  addChangedFields(newFields: string | string[]): void {
    if (!Array.isArray(newFields)) {
      newFields = [newFields]
    }

    this.setChangedFields([...this.getChangedFields(), ...newFields])
  }

  clearChangedFields(): void {
    this.changedFields.reset()
  }

  clearChangedFieldsAt(fields: string | string[]): void {
    if (!Array.isArray(fields)) {
      fields = [fields]
    }

    this.setChangedFields(difference(this.getChangedFields(), fields))
  }

  getResult(): TResult | undefined {
    return this.result.get()
  }

  setResult(newValue: TResult | undefined): void {
    this.result.set(newValue)
  }

  clearResult(): void {
    this.result.reset()
  }

  isSubmitting(): boolean {
    return this.submitting.get()
  }

  isSubmitted(): boolean {
    return this.submitted.get()
  }

  listen(
    callback: FormCallback<TValue, TResult>,
    notifyImmediately?: boolean
  ): FormCallbackUnsubscribe {
    const listener =
      this.configuration.get().debounceChanges > 0
        ? debounce(
            () => callback(this),
            this.configuration.get().debounceChanges
          )
        : () => callback(this)

    const unsubscribeCallbacks = [
      this.configuration.listen(listener, notifyImmediately),
      this.values.listen(listener, notifyImmediately),
      this.result.listen(listener, notifyImmediately),
      this.errors.listen(listener, notifyImmediately),
      this.dirtyFields.listen(listener, notifyImmediately),
      this.changedFields.listen(listener, notifyImmediately),
      this.submitting.listen(listener, notifyImmediately),
      this.submitted.listen(listener, notifyImmediately),
    ]

    const unsubscribe = () => {
      unsubscribeCallbacks.forEach((unsubscribeCallback) =>
        unsubscribeCallback()
      )
    }

    return unsubscribe
  }

  config(config: Partial<FormConfig<TValue, TResult>>): this {
    this.configuration.put(config)

    return this
  }

  handler(handler: FormHandler<TValue, TResult>): this {
    this.configuration.put({ handler })

    return this
  }

  validator(validator: FormValidator<TValue, TResult>): this {
    this.configuration.put({ validator })

    return this
  }

  schema(schema: ObjectSchema<TValue>): this {
    this.configuration.put({ schema })

    return this
  }

  async submit(options?: FormSubmitOptions): Promise<TResult | undefined> {
    if (this.isSubmitting()) {
      return
    }

    const config = this.configuration.get()

    const validate =
      options?.validate === true ||
      (config.validateOnSubmit && options?.validate !== false)

    this.result.reset()
    this.errors.reset()

    this.submitting.set(true)

    try {
      if (validate) {
        const errors = await this.validate()

        if (errors) {
          this.submitting.set(false)

          return
        }
      }
    } catch (err) {
      this.submitting.set(false)
      throw err
    }

    try {
      const result = await this.runHandler()

      this.setResult(result)
    } catch (err) {
      this.submitting.set(false)
      throw err
    }

    this.submitting.set(false)
    this.submitted.set(true)

    return this.getResult()
  }

  async validate(
    options?: FormValidateOptions
  ): Promise<ValidationResult | undefined> {
    const config = this.configuration.get()

    const changedFieldsOnly =
      options?.changedFieldsOnly === true ||
      (config.validateChangedFieldsOnly && options?.changedFieldsOnly !== false)
    const keepPreviousErrors = options?.keepPreviousErrors !== false
    const persistErrors = options?.persistErrors !== false

    const validatorErrors = await this.runValidator()
    const schemaErrors = await this.runSchema()
    const errorsFromDifferentSources = [validatorErrors, schemaErrors]
    const newErrors = errorsFromDifferentSources.reduce((errors, errorSet) => {
      return merge({}, errors, errorSet)
    }, {})!

    if (changedFieldsOnly) {
      const oldErrorKeys = Object.keys(this.getErrors() || {})
      const newErrorKeys = Object.keys(newErrors)
      const changedFields = this.getChangedFields()

      newErrorKeys.map((key) => {
        const fieldHasChanged = changedFields.includes(key)
        const fieldAlreadyHadAnError = oldErrorKeys.includes(key)

        if (fieldHasChanged) {
          // keep
        } else if (fieldAlreadyHadAnError && keepPreviousErrors) {
          // keep
        } else {
          delete newErrors[key]
        }
      })
    }

    if (persistErrors) {
      this.setErrors(newErrors)
    }

    return isEmptyErrorsObject(newErrors) ? undefined : newErrors
  }

  deps(field: string | string[], options: FormDepsOptions = {}): any[] {
    const fields = Array.isArray(field) ? field : [field]
    const config =
      options.config === false ? undefined : this.configuration.get()
    const values =
      options.values === false ? [] : fields.map((field) => this.getAt(field))
    const errors =
      options.errors === false
        ? []
        : fields.map((field) => this.getErrorsAt(field))
    const result = options.result === false ? undefined : this.getResult()
    const dirtyFields =
      options.dirtyFields === false
        ? []
        : fields.map((field) => this.isDirtyField(field))
    const changedFields =
      options.changedFields === false
        ? []
        : fields.map((field) => this.isChangedField(field))
    const submitting =
      options.submitting === false ? undefined : this.isSubmitting()
    const submitted =
      options.submitted === false ? undefined : this.isSubmitted()

    const deps = [
      JSON.stringify(values),
      JSON.stringify(errors),
      JSON.stringify(dirtyFields),
      JSON.stringify(changedFields),
      JSON.stringify(result),
      JSON.stringify(submitting),
      JSON.stringify(submitted),
      config,
    ]

    return deps
  }

  protected setupValidateOnChange() {
    this.values.listen(() => {
      if (this.configuration.get().validateOnChange) {
        try {
          this.validate({ changedFieldsOnly: true })
        } catch (error) {}
      }
    }, false)
  }

  protected async runValidator(): Promise<ValidationResult | undefined> {
    if (!this.configuration.get().validator) return

    try {
      return this.configuration.get().validator!(this)
    } catch (error) {
      console.error("There was an error in form validator:", error)
      throw error
    }
  }

  protected async runSchema(): Promise<ValidationResult | undefined> {
    if (!this.configuration.get().schema) return

    try {
      return createValidationResult(
        await this.configuration.get().schema!.validateAsync(this.get())
      )
    } catch (error) {
      console.error("There was an error in form schema:", error)
      throw error
    }
  }

  protected async runHandler(): Promise<TResult | undefined> {
    if (this.configuration.get().handler) {
      try {
        return await this.configuration.get().handler!(this)
      } catch (error) {
        console.error("There was an error in form handler:", error)
        throw error
      }
    }
  }
}
