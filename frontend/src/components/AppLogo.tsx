import logoSrc from '../assets/logo-sobreseguro.png'

type AppLogoProps = {
  className?: string
}

export function AppLogo({ className = '' }: AppLogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Logo de SobreSeguro"
      className={`object-contain ${className}`}
    />
  )
}
