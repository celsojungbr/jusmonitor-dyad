export function getSiteUrl() {
  const envUrl = typeof import.meta.env.VITE_SITE_URL === 'string' ? import.meta.env.VITE_SITE_URL : ''
  const trimmed = envUrl?.trim()
  if (trimmed && /^https?:\/\//.test(trimmed)) {
    return trimmed.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  // Fallback de desenvolvimento padrão
  return 'http://localhost:8080'
}

export function getOAuthCallbackUrl() {
  return `${getSiteUrl()}/auth/callback`
}

export function getEmailRedirectUrl(path = '/dashboard/consultas') {
  const base = getSiteUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}