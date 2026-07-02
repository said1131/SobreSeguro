type ButtonProps = {
  children: React.ReactNode
  type?: 'button' | 'submit'
  className?: string
  onClick?: () => void
}

export function Button({ children, type = 'button', className = '', onClick }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-md bg-green-500 px-6 py-2 font-semibold text-white hover:bg-green-600 ${className}`}
    >
      {children}
    </button>
  )
}
