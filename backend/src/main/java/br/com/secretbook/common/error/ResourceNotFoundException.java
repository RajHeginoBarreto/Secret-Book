package br.com.secretbook.common.error;

/**
 * Lançada quando o recurso pedido não existe. Vira uma resposta 404; a mensagem é exibida ao cliente.
 */
public class ResourceNotFoundException extends RuntimeException {

	public ResourceNotFoundException(String message) {
		super(message);
	}

}
