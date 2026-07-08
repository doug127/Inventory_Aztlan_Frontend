export const Button = ({
  children,
  type = 'button',
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-[var(--color-cta)] hover:bg-[var(--color-cta-hover)] cursor-pointer text-primary-foreground',
    secondary: 'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-hover)] cursor-pointer',
    danger: 'bg-[var(--color-error)] text-white hover:bg-[var(--color-error-hover)] cursor-pointer',
    neutral: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 cursor-pointer',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
