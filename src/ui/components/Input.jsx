export const Input = ({ id, type = 'text', placeholder, value, onChange }) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-[var(--color-border)] rounded p-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    />
  )
}