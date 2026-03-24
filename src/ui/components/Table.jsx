export default function Table({ columns, data }) {
  return (
    <table className="min-w-full bg-white rounded shadow overflow-hidden">
      <thead className="bg-[var(--color-primary)] text-white">
        <tr>
          {columns.map(col => (
            <th key={col.accessor} className="p-2 text-left">{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b last:border-none">
            {columns.map(col => (
              <td key={col.accessor} className="p-2">{row[col.accessor]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}