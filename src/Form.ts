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
  FormListenOptions,
} from "./types"
import { debounce, difference, get, isEqual, merge, set, uniq } from "lodash-es"
import { ObjectSchema, ValidationResult } from "@corets/schema"
import { isEmptyErrorsObject } from "./isEmptyErrorsObject"
import { createStore, ObservableStore } from "@corets/store"
import { createValue, ObservableValue } from "@corets/value"
import { isEmptyErrorsArray } from "./isEmptyErrorsArray"

export class Form<TValue extends object = any, TResult = any>
  implements ObservableForm<TValue, TResult> {
  initialValue: TValue
  configuration: ObservableStore<FormConfig<TValue, TResult>>
  value: ObservableStore<TValue>
  errors: ObservableStore<ValidationResult>
  result: ObservableValue<TResult | undefined>
  dirtyFields: ObservableValue<string[]>
  changedFields: ObservableValue<string[]>
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>

  constructor(initialValue: TValue = {} as TValue) {
    this.configuration = createStore({
      handler: undefined,
      validator: undefined,
      schema: undefined,
      validateChangedFieldsOnly: false,
      sanitizeChangedFieldsOnly: false,
      validateOnChange: true,
      validateOnSubmit: true,
      debounce: 10,
      sanitize: true,
    })
    this.initialValue = initialValue
    this.value = createStore(initialValue)
    this.errors = createStore({})
    this.result = createValue(undefined)
    this.dirtyFields = createValue([])
    this.changedFields = createValue([])
    this.submitting = createValue(false)
    this.submitted = createValue(false)

    this.setupValidateOnChange()
  }

  get(): TValue {
    return this.value.get()
  }

  getAt(path: string): any {
    return get(this.get(), path)
  }

  set(newValues: TValue): void {
    this.value.set(newValues)
  }

  setAt(path: string, newValue: any): void {
    const newValues = set(this.get(), path, newValue)

    this.set(newValues)

    const oldValue = get(this.initialValue, path)

    if (!isEqual(oldValue, newValue)) {
      this.addChangedFields(path)
    }

    this.addDirtyFields(path)
  }

  put(newValues: Partial<TValue>): void {
    this.value.put(newValues)
  }

  clear(initialValue?: TValue): void {
    if (initialValue) {
      this.initialValue = initialValue
    }

    this.value.set(this.initialValue)
    this.submitting.set(false)
    this.submitted.set(false)
    this.clearDirtyFields()
    this.clearChangedFields()
    this.clearErrors()
    this.clearResult()
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
    this.errors.set({})
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
    this.dirtyFields.set([])
  }

  clearDirtyField(fields: string | string[]): void {
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
    this.changedFields.set([])
  }

  clearChangedField(fields: string | string[]): void {
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
    this.result.set(undefined)
  }

  isSubmitting(): boolean {
    return this.submitting.get()
  }

  setSubmitting(submitting: boolean) {
    this.submitting.set(submitting)
  }

  isSubmitted(): boolean {
    return this.submitted.get()
  }

  setSubmitted(submitted: boolean) {
    this.submitted.set(submitted)
  }

  listen(
    callback: FormCallback<TValue, TResult>,
    options?: FormListenOptions
  ): FormCallbackUnsubscribe {
    const debounceChanges =
      options?.debounce ?? this.configuration.get().debounce
    const immediate = options?.immediate

    const listener =
      debounceChanges > 0
        ? debounce(() => callback(this), debounceChanges)
        : () => callback(this)

    const unsubscribeCallbacks = [
      this.configuration.listen(listener, { immediate }),
      this.value.listen(listener, { immediate }),
      this.result.listen(listener, { immediate }),
      this.errors.listen(listener, { immediate }),
      this.dirtyFields.listen(listener, { immediate }),
      this.changedFields.listen(listener, { immediate }),
      this.submitting.listen(listener, { immediate }),
      this.submitted.listen(listener, { immediate }),
    ]

    const unsubscribe = () =>
      unsubscribeCallbacks.forEach((unsubscribeCallback) =>
        unsubscribeCallback()
      )

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

    this.clearResult()
    this.clearErrors()

    this.submitting.set(true)

    try {
      if (validate) {
        const errors = await this.validate(options)

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

    const validateChangedFieldsOnly =
      options?.validateChangedFieldsOnly ?? config.validateChangedFieldsOnly
    const sanitizeChangedFieldsOnly =
      options?.sanitizeChangedFieldsOnly ?? config.sanitizeChangedFieldsOnly
    const keepPreviousErrors = options?.keepPreviousErrors !== false
    const persistErrors = options?.persistErrors !== false
    const sanitize = options?.sanitize ?? config.sanitize

    if (sanitize) {
      await this.runSchemaSanitizer(sanitizeChangedFieldsOnly)
    }

    const schemaErrors = await this.runSchemaValidator()
    const validatorErrors = await this.runValidator()
    const errorsFromDifferentSources = [validatorErrors, schemaErrors]
    const newErrors = errorsFromDifferentSources.reduce((errors, errorSet) => {
      return merge({}, errors, errorSet)
    }, {})!

    if (validateChangedFieldsOnly) {
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
    this.value.listen(() => {
      if (this.configuration.get().validateOnChange) {
        try {
          this.validate({ validateChangedFieldsOnly: true, sanitize: false })
        } catch (error) {}
      }
    })
  }

  protected async runValidator(): Promise<ValidationResult | undefined> {
    const configuration = this.configuration.get()

    if (!configuration.validator) return

    try {
      return configuration.validator!(this)
    } catch (error) {
      console.error("There was an error in form validator:", error)
      throw error
    }
  }

  protected async runSchemaSanitizer(
    sanitizeChangedFieldsOnly: boolean
  ): Promise<void> {
    const configuration = this.configuration.get()

    if (!configuration.schema) return

    try {
      if (sanitizeChangedFieldsOnly) {
        if (this.changedFields.get().length > 0) {
          const sanitizedValues = await configuration.schema!.sanitizeAsync<TValue>(
            this.get()
          )

          this.changedFields.get().forEach((field) => {
            this.setAt(field, get(sanitizedValues, field))
          })
        }
      } else {
        const sanitizedValues = await configuration.schema!.sanitizeAsync<TValue>(
          this.get()
        )
        this.set(sanitizedValues)
      }
    } catch (error) {
      console.error("There was an error in form schema sanitizer:", error)
      throw error
    }
  }

  protected async runSchemaValidator(): Promise<ValidationResult | undefined> {
    const configuration = this.configuration.get()

    if (!configuration.schema) return

    try {
      return await configuration.schema!.validateAsync(this.get())
    } catch (error) {
      console.error("There was an error in form schema validator:", error)
      throw error
    }
  }

  protected async runHandler(): Promise<TResult | undefined> {
    const configuration = this.configuration.get()

    if (configuration.handler) {
      try {
        return await configuration.handler!(this)
      } catch (error) {
        console.error("There was an error in form handler:", error)
        throw error
      }
    }
  }
}
