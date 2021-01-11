export const isEmptyErrorsObject = (errors: object | undefined): boolean => {
  return !errors || Object.keys(errors).length === 0
}
