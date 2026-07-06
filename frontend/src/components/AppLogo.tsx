import logoSrc from '../assets/logo.png'

type AppLogoProps = {
  className?: string
}

export function AppLogo({ className = '' }: AppLogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Logo de SobreSeguro"
      className={`object-contain ${className}`}
      style={{ width: '140px', height: '140px', objectFit: 'contain' }}
    />
  )
}
