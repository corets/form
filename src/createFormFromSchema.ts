import { createForm } from "./createForm"
import { CreateFormFromSchema, FormSchema } from "./types"

export const createFormFromSchema: CreateFormFromSchema = <
  TValue extends object = any,
  TResult = any
>(
  schemaOrSchemaFactory: FormSchema<TValue>
) => {
  const form = createForm<TValue, TResult>()
  const schema =
    typeof schemaOrSchemaFactory === "function"
      ? schemaOrSchemaFactory(form)
      : schemaOrSchemaFactory

  form.clear(schema.sanitize({}))
  form.schema(schema)

  return form
}
