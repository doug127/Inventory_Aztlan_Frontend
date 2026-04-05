export const parsePaginated = (response) => {
  return {
    data: response.data ?? [],
    total: response.meta?.total ?? 0,
    page: response.meta?.page ?? 1,
    limit: response.meta?.limit ?? 20,
    pageCount: response.meta?.totalPages ?? 1, // ← totalPages del backend
    hasNextPage: response.meta?.hasNextPage ?? false,
    hasPreviousPage: response.meta?.hasPreviousPage ?? false,
  }
}

export const paginationParams = ({ page = 1, limit = 20, filters = {} } = {}) => {
  return {
    page,
    limit,
    ...filters,
  }
}
