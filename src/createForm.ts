import { CreateForm } from "./types"
import { Form } from "./Form"

export const createForm: CreateForm = (initialValue) => new Form(initialValue)
