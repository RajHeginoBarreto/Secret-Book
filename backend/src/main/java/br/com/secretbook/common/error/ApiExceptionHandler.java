package br.com.secretbook.common.error;

import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Converte exceções em respostas no formato Problem Details (RFC 9457), sempre em português.
 *
 * <p>Os erros padrão do Spring MVC (rota inexistente, JSON mal formatado, método não suportado...) são tratados pela
 * classe base; seus títulos e mensagens vêm de {@code messages.properties}.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

	@ExceptionHandler(ResourceNotFoundException.class)
	ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
		problem.setTitle("Recurso não encontrado");
		return problem;
	}

	@ExceptionHandler(Exception.class)
	ProblemDetail handleUnexpected(Exception ex) {
		// O detalhe técnico fica só no log: nunca expor mensagens internas ao cliente.
		log.error("Erro inesperado ao processar a requisição", ex);
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
				"Ocorreu um erro inesperado. Tente novamente mais tarde.");
		problem.setTitle("Erro interno");
		return problem;
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldViolation> violations = ex.getBindingResult().getFieldErrors().stream()
			.map(error -> new FieldViolation(error.getField(), error.getDefaultMessage()))
			.sorted(Comparator.comparing(FieldViolation::field).thenComparing(FieldViolation::message))
			.toList();

		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, "Um ou mais campos estão inválidos.");
		problem.setTitle("Dados inválidos");
		problem.setProperty("errors", violations);
		return handleExceptionInternal(ex, problem, headers, status, request);
	}

}
