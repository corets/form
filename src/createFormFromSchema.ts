import { createForm } from "./createForm"
import { ObjectSchema } from "@corets/schema"
import { CreateFormFromSchema } from "./types"

export const createFormFromSchema: CreateFormFromSchema = <
  TValue extends object = any,
  TResult = any
>(
  schema: ObjectSchema<TValue>
) => createForm<TValue, TResult>(schema.sanitize({})).schema(schema)
