import {
  FormConfig,
  FormDepsOptions,
  FormHandler,
  FormListener,
  FormListenerUnsubscribe,
  FormListenOptions,
  FormSubmitOptions,
  FormValidateOptions,
  FormValidator,
  ObservableForm,
  ObservableFormField,
} from "./types"
import debounce from "lodash/debounce"
import difference from "lodash/difference"
import get from "lodash/get"
import merge from "lodash/merge"
import set from "lodash/set"
import uniq from "lodash/uniq"
import isEqual from "fast-deep-equal"
import { ObjectSchema, ValidationResult } from "@corets/schema"
import { isEmptyErrorsObject } from "./isEmptyErrorsObject"
import { createStore, ObservableStore } from "@corets/store"
import { createValue, ObservableValue } from "@corets/value"
import { isEmptyErrorsArray } from "./isEmptyErrorsArray"
import { FormField } from "./FormField"
import { createAccessor, ObjectAccessor } from "@corets/accessor"

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
    this.configuration = createStore<FormConfig<TValue, TResult>>({
      handler: undefined,
      validator: undefined,
      schema: undefined,
      debounce: 10,
      reactive: true,
      validate: true,
      sanitize: true,
    })

    this.initialValue = initialValue
    this.value = createStore(initialValue)
    this.errors = createStore({})
    this.result = createValue<TResult | undefined>(undefined)
    this.dirtyFields = createValue<string[]>([])
    this.changedFields = createValue<string[]>([])
    this.submitting = createValue<boolean>(false)
    this.submitted = createValue<boolean>(false)

    this.setupReactiveBehaviour()
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

    this.setDirtyAt(path)

    const oldValue = get(this.initialValue, path)

    if (!isEqual(oldValue, newValue)) {
      this.setChangedAt(path)
    } else {
      this.clearChangedAt(path)
    }
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
    this.clearDirty()
    this.clearChanged()
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
    return this.getDirty().length > 0
  }

  isDirtyAt(field: string): boolean {
    return this.getDirty().includes(field)
  }

  getDirty(): string[] {
    return this.dirtyFields.get()
  }

  setDirtyAt(newFields: string | string[]): void {
    if (!Array.isArray(newFields)) {
      newFields = [newFields]
    }

    this.dirtyFields.set(uniq([...this.getDirty(), ...newFields]))
  }

  addDirtyAt(newFields: string | string[]): void {
    if (!Array.isArray(newFields)) {
      newFields = [newFields]
    }

    this.setDirtyAt([...this.getDirty(), ...newFields])
  }

  clearDirty(): void {
    this.dirtyFields.set([])
  }

  clearDirtyAt(fields: string | string[]): void {
    if (!Array.isArray(fields)) {
      fields = [fields]
    }

    const dirtyFields = difference(this.getDirty(), fields)

    this.clearDirty()
    this.setDirtyAt(dirtyFields)
  }

  isChanged(): boolean {
    return this.getChanged().length > 0
  }

  isChangedAt(field: string): boolean {
    return this.getChanged().includes(field)
  }

  getChanged(): string[] {
    return this.changedFields.get()
  }

  setChangedAt(newFields: string | string[]): void {
    if (!Array.isArray(newFields)) {
      newFields = [newFields]
    }

    this.changedFields.set(uniq([...this.getChanged(), ...newFields]))
  }

  addChangedAt(newFields: string | string[]): void {
    if (!Array.isArray(newFields)) {
      newFields = [newFields]
    }

    this.setChangedAt([...this.getChanged(), ...newFields])
  }

  clearChanged(): void {
    this.changedFields.set([])
  }

  clearChangedAt(fields: string | string[]): void {
    if (!Array.isArray(fields)) {
      fields = [fields]
    }

    const changedFields = difference(this.getChanged(), fields)

    this.clearChanged()
    this.setChangedAt(changedFields)
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

  setIsSubmitting(submitting: boolean) {
    this.submitting.set(submitting)
  }

  isSubmitted(): boolean {
    return this.submitted.get()
  }

  setIsSubmitted(submitted: boolean) {
    this.submitted.set(submitted)
  }

  listen(
    callback: FormListener<TValue, TResult>,
    options?: FormListenOptions
  ): FormListenerUnsubscribe {
    const debounceChanges =
      options?.debounce ?? this.configuration.get().debounce
    const immediate = options?.immediate

    const listener =
      debounceChanges > 0
        ? debounce(() => callback(this), debounceChanges)
        : () => callback(this)

    const unsubscribeCallbacks = [
      this.configuration.listen(listener, { immediate }),
      this.value.listen(() => callback(this), { immediate }),
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

    const validate = options?.validate ?? config.validate
    const sanitize = options?.sanitize ?? config.sanitize
    const changed = options?.changed ?? false

    this.clearResult()
    this.clearErrors()

    this.submitting.set(true)

    try {
      if (sanitize) {
        await this.runSchemaSanitizer(changed)
      }

      if (validate) {
        const errors = await this.validate({
          changed,
          persist: true,
          sanitize: false,
        })

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

    const changed = options?.changed ?? false
    const sanitize = options?.sanitize ?? config.sanitize
    const persist = options?.persist ?? true

    if (sanitize) {
      await this.runSchemaSanitizer(changed)
    }

    const schemaErrors = await this.runSchemaValidator()
    const validatorErrors = await this.runValidator()
    const errorsFromDifferentSources = [validatorErrors, schemaErrors]
    const newErrors = errorsFromDifferentSources.reduce((errors, errorSet) => {
      return merge({}, errors, errorSet)
    }, {})!

    if (changed) {
      const oldErrorKeys = Object.keys(this.getErrors() || {})
      const newErrorKeys = Object.keys(newErrors)
      const changedFields = this.getChanged()

      newErrorKeys.map((key) => {
        const fieldHasChanged = changedFields.includes(key)
        const fieldAlreadyHadAnError = oldErrorKeys.includes(key)

        if (fieldHasChanged) {
          // keep
        } else if (fieldAlreadyHadAnError) {
          // keep
        } else {
          delete newErrors[key]
        }
      })
    }

    if (persist) {
      this.setErrors(newErrors)
    }

    return isEmptyErrorsObject(newErrors) ? undefined : newErrors
  }

  deps(field: string | string[], options: FormDepsOptions = {}): any[] {
    const fields = Array.isArray(field) ? field : [field]
    const values =
      options.value === false ? [] : fields.map((field) => this.getAt(field))
    const errors =
      options.errors === false
        ? []
        : fields.map((field) => this.getErrorsAt(field))
    const result = options.result === false ? undefined : this.getResult()
    const dirtyFields =
      options.isDirty === false
        ? []
        : fields.map((field) => this.isDirtyAt(field))
    const changedFields =
      options.isChanged === false
        ? []
        : fields.map((field) => this.isChangedAt(field))
    const submitting =
      options.isSubmitting === false ? undefined : this.isSubmitting()
    const submitted =
      options.isSubmitted === false ? undefined : this.isSubmitted()

    const { validate, debounce, reactive, sanitize } = this.configuration.get()
    const config =
      options.config === false
        ? undefined
        : { validate, debounce, reactive, sanitize }

    const deps = [
      JSON.stringify(values),
      JSON.stringify(errors),
      JSON.stringify(dirtyFields),
      JSON.stringify(changedFields),
      JSON.stringify(result),
      JSON.stringify(submitting),
      JSON.stringify(submitted),
      JSON.stringify(config),
    ]

    return deps
  }

  fields(): ObjectAccessor<TValue, ObservableFormField<ObservableForm>> {
    return createAccessor(
      this.get(),
      (source, key) => new FormField(this as ObservableForm, key!.toString())
    )
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
    changedFieldsOnly: boolean
  ): Promise<void> {
    const config = this.configuration.get()

    if (!config.schema) return

    try {
      if (changedFieldsOnly) {
        if (this.changedFields.get().length > 0) {
          const sanitizedValues = await config.schema!.sanitizeAsync<TValue>(
            this.get()
          )

          this.changedFields.get().forEach((field) => {
            this.setAt(field, get(sanitizedValues, field))
          })
        }
      } else {
        const sanitizedValues = await config.schema!.sanitizeAsync<TValue>(
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

  protected setupReactiveBehaviour() {
    this.value.listen(async () => {
      try {
        const reactive = this.configuration.get().reactive
        const validate = this.configuration.get().validate

        if (reactive) {
          if (validate) {
            await this.validate({
              sanitize: false,
              persist: true,
              changed: true,
            })
          }
        }
      } catch (err) {}
    })
  }
}
