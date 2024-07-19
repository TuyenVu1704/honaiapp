export const queryString = (queries: any) => {
  const excludeFields = ['page', 'limit', 'sort', 'fields']
  excludeFields.forEach((el) => delete queries[el])
  let queryString = JSON.stringify(queries)
  queryString = queryString.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`)
  return JSON.parse(queryString)
}
