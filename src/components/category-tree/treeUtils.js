// Utilidades de los árboles de categorías (productos y activos).

export const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`

/** Recorre el árbol en profundidad, en el orden en que se muestra. */
export const flattenTree = (nodes, out = []) => {
  for (const node of nodes) {
    out.push(node)
    flattenTree(node.children, out)
  }
  return out
}

/** Ids de un nodo y de toda su rama (no puede moverse dentro de ninguno de ellos). */
export const subtreeIds = (node) => new Set(flattenTree([node]).map((n) => n.id))

/**
 * Filtra el árbol: queda un nodo si cumple el criterio o si alguna descendiente lo cumple (así se
 * ve la ruta hasta cada resultado).
 */
export const filterTree = (nodes, matches) =>
  nodes.flatMap((node) => {
    const children = filterTree(node.children, matches)
    return matches(node) || children.length ? [{ ...node, children }] : []
  })

/** Sangría de un <option> según su profundidad: "   └ TRACTOR · Tractor". */
export const optionIndent = (depth) => `${'   '.repeat(depth)}${depth > 0 ? '└ ' : ''}`
