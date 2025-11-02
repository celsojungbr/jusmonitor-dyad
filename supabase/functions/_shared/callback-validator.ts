// ============================================
// Validação de Callbacks (Webhooks)
// ============================================

/**
 * Valida callback da API JUDiT usando HMAC-SHA256
 *
 * @param body - Corpo da requisição (string)
 * @param signature - Assinatura recebida no header X-JUDiT-Signature
 * @param secret - Secret key configurada no JUDiT
 * @returns true se válido, false caso contrário
 */
export async function validateJuditCallback(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    console.error('[Callback Validator] JUDiT signature missing')
    return false
  }

  try {
    // Criar chave HMAC
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Calcular HMAC do body
    const bodyData = encoder.encode(body)
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyData)

    // Converter para hex string
    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
    const expectedSignature = signatureArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Comparar (case-insensitive)
    const isValid = expectedSignature.toLowerCase() === signature.toLowerCase()

    if (!isValid) {
      console.error('[Callback Validator] JUDiT signature mismatch')
      console.error('Expected:', expectedSignature)
      console.error('Received:', signature)
    }

    return isValid
  } catch (error) {
    console.error('[Callback Validator] Error validating JUDiT callback:', error)
    return false
  }
}

/**
 * Valida callback da API Escavador usando token simples
 *
 * @param receivedToken - Token recebido no body do callback
 * @param expectedToken - Token esperado (configurado no Escavador)
 * @returns true se válido, false caso contrário
 */
export function validateEscavadorCallback(
  receivedToken: string | null,
  expectedToken: string
): boolean {
  if (!receivedToken) {
    console.error('[Callback Validator] Escavador token missing')
    return false
  }

  const isValid = receivedToken === expectedToken

  if (!isValid) {
    console.error('[Callback Validator] Escavador token mismatch')
  }

  return isValid
}

/**
 * Valida timestamp do callback (evita replay attacks)
 *
 * @param timestamp - Timestamp do callback (milliseconds ou ISO string)
 * @param maxAgeMinutes - Idade máxima permitida em minutos (default: 5)
 * @returns true se timestamp é recente, false se muito antigo
 */
export function validateCallbackTimestamp(
  timestamp: number | string,
  maxAgeMinutes: number = 5
): boolean {
  try {
    const callbackTime = typeof timestamp === 'string'
      ? new Date(timestamp).getTime()
      : timestamp

    const now = Date.now()
    const ageMs = Math.abs(now - callbackTime)
    const maxAgeMs = maxAgeMinutes * 60 * 1000

    const isValid = ageMs <= maxAgeMs

    if (!isValid) {
      console.error(`[Callback Validator] Timestamp too old: ${ageMs}ms (max: ${maxAgeMs}ms)`)
    }

    return isValid
  } catch (error) {
    console.error('[Callback Validator] Error validating timestamp:', error)
    return false
  }
}

/**
 * Interface para resultado de validação completa
 */
export interface CallbackValidationResult {
  isValid: boolean
  error?: string
  details?: {
    signatureValid?: boolean
    timestampValid?: boolean
    tokenValid?: boolean
  }
}

/**
 * Validação completa de callback JUDiT
 */
export async function validateJuditCallbackComplete(
  body: string,
  signature: string | null,
  timestamp: number | string,
  secret: string
): Promise<CallbackValidationResult> {
  const signatureValid = await validateJuditCallback(body, signature, secret)
  const timestampValid = validateCallbackTimestamp(timestamp)

  const isValid = signatureValid && timestampValid

  if (!isValid) {
    return {
      isValid: false,
      error: !signatureValid ? 'Invalid signature' : 'Timestamp too old',
      details: { signatureValid, timestampValid }
    }
  }

  return {
    isValid: true,
    details: { signatureValid, timestampValid }
  }
}

/**
 * Validação completa de callback Escavador
 */
export function validateEscavadorCallbackComplete(
  receivedToken: string | null,
  timestamp: number | string,
  expectedToken: string
): CallbackValidationResult {
  const tokenValid = validateEscavadorCallback(receivedToken, expectedToken)
  const timestampValid = validateCallbackTimestamp(timestamp)

  const isValid = tokenValid && timestampValid

  if (!isValid) {
    return {
      isValid: false,
      error: !tokenValid ? 'Invalid token' : 'Timestamp too old',
      details: { tokenValid, timestampValid }
    }
  }

  return {
    isValid: true,
    details: { tokenValid, timestampValid }
  }
}
