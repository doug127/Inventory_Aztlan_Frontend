export const Button = ({ children, type = 'button', onClick, variant = 'primary', className }) => {
  const base = "px-4 py-2 rounded font-medium transition-colors"
  const variants = {
    primary: "bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta-hover)]",
    secondary: "bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-hover)]",
    danger: "bg-[var(--color-error)] text-white hover:bg-[var(--color-error-hover)]",
  }

  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}