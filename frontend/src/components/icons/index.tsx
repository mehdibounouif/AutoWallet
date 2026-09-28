import googleSvg from '../../assets/icons/google.svg'
import languagesSvg from '../../assets/icons/languages.svg'

interface IconProps {
  className?: string
  alt?: string
}

export function GoogleIcon({ className = 'w-5 h-5 shrink-0', alt = 'Google' }: IconProps) {
  return <img src={googleSvg} alt={alt} className={className} />
}

export function LanguagesIcon({ className = 'w-4 h-4 shrink-0', alt = 'Languages' }: IconProps) {
  return <img src={languagesSvg} alt={alt} className={className} />
}
