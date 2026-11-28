// Hojas imprimibles: todas las filas de un listado paginado, no solo la página visible.

/** Máximo de páginas de 100 filas que trae una hoja imprimible (10 000 filas). */
const PRINT_MAX_PAGES = 100

/**
 * Recorre las páginas de un listado (de 100 en 100) y devuelve { rows, meta, truncated }: todas las
 * filas, el meta de la primera página (resumen y filtros) y si se cortó por el máximo.
 * fetchPage(params) devuelve el sobre completo { data, meta }.
 */
export const fetchAllPages = async (fetchPage, params) => {
  const first = await fetchPage({ ...params, page: 1, limit: 100 })
  const rows = [...(first.data ?? [])]
  const totalPages = first.meta?.pagination?.totalPages ?? 1
  const last = Math.min(totalPages, PRINT_MAX_PAGES)
  for (let page = 2; page <= last; page += 1) {
    const next = await fetchPage({ ...params, page, limit: 100 })
    rows.push(...(next.data ?? []))
  }
  return { rows, meta: first.meta, truncated: totalPages > PRINT_MAX_PAGES }
}
