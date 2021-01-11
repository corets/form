import { CreateFormValues } from "./types"
import { FormValues } from "./FormValues"

export const createFormValues: CreateFormValues = (
  initialValues,
  dirtyFields,
  changedFields
) => new FormValues(initialValues, dirtyFields, changedFields)
