// Validadores de dados

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false // Todos os dígitos iguais

  let sum = 0
  let remainder

  // Validar primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false

  sum = 0

  // Validar segundo dígito verificador
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false

  return true
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let length = cleaned.length - 2
  let numbers = cleaned.substring(0, length)
  const digits = cleaned.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  length = length + 1
  numbers = cleaned.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

export function validateCPForCNPJ(doc: string): boolean {
  const cleaned = doc.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return validateCPF(cleaned)
  } else if (cleaned.length === 14) {
    return validateCNPJ(cleaned)
  }

  return false
}

export function validateCNJ(cnj: string): boolean {
  const cleaned = cnj.replace(/\D/g, '')

  // CNJ tem 20 dígitos: NNNNNNN-DD.AAAA.J.TR.OOOO
  if (cleaned.length !== 20) return false

  // Validação básica: verificar se todos são números
  if (!/^\d{20}$/.test(cleaned)) return false

  // Podemos adicionar validação mais complexa se necessário
  return true
}

export function validateOAB(oab: string): boolean {
  // Formato: OAB/UF NÚMERO ou apenas NÚMERO
  const cleaned = oab.replace(/[^\dA-Z]/g, '')

  // Deve ter pelo menos números e opcionalmente UF (2 letras)
  const match = cleaned.match(/^([A-Z]{2})?(\d+)$/)

  return !!match && match[2].length >= 3 && match[2].length <= 8
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')

  // 10 dígitos (fixo) ou 11 dígitos (celular)
  return cleaned.length === 10 || cleaned.length === 11
}

export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('A senha deve ter no mínimo 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function getDocumentType(doc: string): 'cpf' | 'cnpj' | 'cnj' | 'oab' | 'invalid' {
  const cleaned = doc.replace(/\D/g, '')

  if (cleaned.length === 11 && validateCPF(cleaned)) return 'cpf'
  if (cleaned.length === 14 && validateCNPJ(cleaned)) return 'cnpj'
  if (cleaned.length === 20 && validateCNJ(cleaned)) return 'cnj'

  // OAB é diferente, pode ter letras
  if (validateOAB(doc)) return 'oab'

  return 'invalid'
}
