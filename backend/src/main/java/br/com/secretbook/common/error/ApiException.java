package br.com.secretbook.common.error;

import org.springframework.http.HttpStatus;

/**
 * Erro de regra de negócio com status, título e mensagem pensados para o cliente (todos exibidos na resposta).
 */
public class ApiException extends RuntimeException {

	private final HttpStatus status;

	private final String title;

	public ApiException(HttpStatus status, String title, String detail) {
		super(detail);
		this.status = status;
		this.title = title;
	}

	public static ApiException badRequest(String detail) {
		return new ApiException(HttpStatus.BAD_REQUEST, "Requisição inválida", detail);
	}

	public static ApiException conflict(String detail) {
		return new ApiException(HttpStatus.CONFLICT, "Conflito", detail);
	}

	public static ApiException unauthorized(String detail) {
		return new ApiException(HttpStatus.UNAUTHORIZED, "Não autorizado", detail);
	}

	public static ApiException forbidden(String detail) {
		return new ApiException(HttpStatus.FORBIDDEN, "Acesso negado", detail);
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getTitle() {
		return title;
	}

}
