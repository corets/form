export const isEmptyErrorsArray = (errors: any[] | undefined): boolean => {
  return !errors || errors.length === 0
}
