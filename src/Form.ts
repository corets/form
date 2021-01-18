import {
  DepsOptions,
  FormCallback,
  FormConfig,
  FormHandler,
  FormSubmitOptions,
  FormValidateOptions,
  FormValidator,
  ObservableErrors,
  ObservableForm,
  ObservableFormFields,
  ObservableFormValues,
} from "./types"
import { createValue, ObservableValue } from "@corets/value"
import { createFormValues } from "./createFormValues"
import { createFormFields } from "./createFormFields"
import { createFormErrors } from "./createFormErrors"
import { merge } from "lodash-es"
import {
  createValidationResult,
  ObjectSchema,
  ValidationResult,
} from "@corets/schema"
import { isEmptyErrorsObject } from "./isEmptyErrorsObject"

export class Form<TValues extends object = any, TResult = any>
  implements ObservableForm<TValues, TResult> {
  config: FormConfig<TValues, TResult>
  values: ObservableFormValues<TValues>
  dirtyFields: ObservableFormFields
  changedFields: ObservableFormFields
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>
  errors: ObservableErrors
  result: ObservableValue<TResult | undefined>

  constructor(initialValues: TValues) {
    this.config = {
      handler: () => undefined,
      validators: [],
      schemas: [],
      validateChangedFieldsOnly: false,
      validateOnChange: true,
      validateOnSubmit: true,
    }

    this.dirtyFields = createFormFields()
    this.changedFields = createFormFields()
    this.values = createFormValues(
      initialValues,
      this.dirtyFields,
      this.changedFields
    )
    this.submitting = createValue<boolean>(false)
    this.submitted = createValue<boolean>(false)
    this.errors = createFormErrors()
    this.result = createValue<TResult | undefined>(undefined)

    this.setupValidateOnChange()
  }

  reset(initialValues?: TValues): void {
    this.values.reset(initialValues)
    this.submitting.reset()
    this.submitted.reset()
    this.dirtyFields.clear()
    this.changedFields.clear()
    this.errors.clear()
    this.result.reset()
  }

  listen(
    callback: FormCallback<TValues, TResult>,
    notifyImmediately?: boolean
  ): this {
    const formCallback = () => callback(this)

    this.values.listen(formCallback, notifyImmediately)
    this.submitting.listen(formCallback, notifyImmediately)
    this.submitted.listen(formCallback, notifyImmediately)
    this.dirtyFields.listen(formCallback, notifyImmediately)
    this.changedFields.listen(formCallback, notifyImmediately)
    this.errors.listen(formCallback, notifyImmediately)
    this.result.listen(formCallback, notifyImmediately)

    return this
  }

  configure(config: Partial<FormConfig<TValues, TResult>>): this {
    this.config = { ...this.config, ...config }

    return this
  }

  handler(handler: FormHandler<TValues, TResult>): this {
    this.config.handler = handler

    return this
  }

  validator(handler: FormValidator<TValues, TResult>): this {
    this.config.validators.push(handler)

    return this
  }

  schema(handler: ObjectSchema<TValues>): this {
    this.config.schemas.push(handler)

    return this
  }

  async submit(options?: FormSubmitOptions): Promise<TResult | undefined> {
    if (this.submitting.get() === true) {
      return
    }

    const validate =
      options?.validate === true ||
      (this.config.validateOnSubmit && options?.validate !== false)

    this.result.reset()
    this.errors.clear()

    this.submitting.set(true)

    if (validate) {
      const errors = await this.validate()

      if (errors) {
        this.submitting.set(false)

        return
      }
    }

    if (this.config.handler) {
      try {
        const result = await this.config.handler(this)
        this.result.set(result)
      } catch (error) {
        console.error(`There was an error in form handler:`, error)

        this.submitting.set(false)

        throw error
      }
    }

    this.submitting.set(false)
    this.submitted.set(true)

    return this.result.get()
  }

  async validate(
    options?: FormValidateOptions
  ): Promise<ValidationResult | undefined> {
    const changedFieldsOnly =
      options?.changedFieldsOnly === true ||
      (this.config.validateChangedFieldsOnly &&
        options?.changedFieldsOnly !== false)
    const keepPreviousErrors = options?.keepPreviousErrors !== false
    const persistErrors = options?.persistErrors !== false

    const validatorErrors = await Promise.all(
      this.config.validators.map(async (validator, index) => {
        try {
          return await validator(this)
        } catch (error) {
          console.error(
            `There was an error in form validator #${index}:`,
            error
          )
          throw error
        }
      })
    )

    const schemaErrors = await Promise.all(
      this.config.schemas.map(async (schema, index) => {
        try {
          return createValidationResult(
            await schema.validateAsync(this.values.get())
          )
        } catch (error) {
          console.error(`There was an error in form schema #${index}:`, error)
          throw error
        }
      })
    )

    const errorsFromDifferentSources = [...validatorErrors, ...schemaErrors]

    const newErrors = errorsFromDifferentSources.reduce((errors, errorSet) => {
      return merge({}, errors, errorSet)
    }, {})!

    if (changedFieldsOnly) {
      const oldErrorKeys = Object.keys(this.errors.get() || {})
      const newErrorKeys = Object.keys(newErrors)
      const changedFields = this.changedFields.get()

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
      this.errors.set(newErrors)
    }

    return isEmptyErrorsObject(newErrors) ? undefined : newErrors
  }

  deps(field: string | string[], options: DepsOptions = {}): any[] {
    const fields = Array.isArray(field) ? field : [field]
    const values =
      options.values === false
        ? []
        : fields.map((field) => this.values.getAt(field))
    const errors =
      options.errors === false
        ? []
        : fields.map((field) => this.errors.getAt(field))
    const dirtyFields =
      options.dirtyFields === false
        ? []
        : fields.map((field) => this.dirtyFields.has(field))
    const changedFields =
      options.changedFields === false
        ? []
        : fields.map((field) => this.changedFields.has(field))
    const result = options.result === false ? undefined : this.result.get()
    const submitting =
      options.submitting === false ? undefined : this.submitting.get()
    const submitted =
      options.submitted === false ? undefined : this.submitted.get()

    const deps = [
      JSON.stringify(values),
      JSON.stringify(errors),
      JSON.stringify(dirtyFields),
      JSON.stringify(changedFields),
      JSON.stringify(result),
      JSON.stringify(submitting),
      JSON.stringify(submitted),
    ]

    return deps
  }

  protected setupValidateOnChange() {
    this.values.listen(() => {
      if (this.config.validateOnChange) {
        try {
          this.validate({ changedFieldsOnly: true })
        } catch (error) {}
      }
    }, false)
  }
}
