type ButtonProps = {
  children: React.ReactNode
  type?: 'button' | 'submit'
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function Button({ children, type = 'button', className = '', onClick, disabled = false }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md bg-green-500 px-6 py-2 font-semibold text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}
