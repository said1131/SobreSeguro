type TextFieldProps = {
  label: string
  name?: string
  type?: string
  placeholder?: string
  defaultValue?: string
  required?: boolean
  disabled?: boolean
}

export function TextField({
  label,
  name,
  type = 'text',
  placeholder,
  defaultValue,
  required = false,
  disabled = false,
}: TextFieldProps) {
  return (
    <label className="block w-full">
      <span className="mb-1 block font-medium text-gray-800">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        className="w-full rounded-md border border-gray-400 px-3 py-2 outline-none focus:border-green-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </label>
  )
}
