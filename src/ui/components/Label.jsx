export default function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block mb-1 text-sm font-medium text-[var(--color-text-primary)]">
      {children}
    </label>
  )
}