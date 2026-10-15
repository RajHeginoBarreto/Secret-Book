package br.com.secretbook.common.error;

/**
 * Um campo inválido dentro de uma resposta de erro de validação.
 */
public record FieldViolation(String field, String message) {
}
