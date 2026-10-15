import type { ApiError } from './client'

/** Primeira mensagem de erro da API para cada campo, no formato "campo → mensagem". */
export function fieldErrorsOf(error: ApiError | undefined | null): Record<string, string> {
  const result: Record<string, string> = {}
  for (const violation of error?.fieldErrors ?? []) {
    result[violation.field] ??= violation.message
  }
  return result
}
