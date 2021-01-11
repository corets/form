import { FormFields } from "./FormFields"
import { CreateFormFields } from "./types"

export const createFormFields: CreateFormFields = (initialValue?: string[]) =>
  new FormFields(initialValue)
