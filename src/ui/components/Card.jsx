export const Card = ({ children, className }) => {
  return (
    <div className={`bg-[var(--color-surface)] p-4 rounded-lg shadow ${className}`}>
      {children}
    </div>
  )
}