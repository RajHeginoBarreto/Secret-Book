package br.com.secretbook.auth;

import java.util.UUID;

/**
 * Usuário da requisição atual. Use {@code @AuthenticationPrincipal AuthenticatedUser user} nos controllers; em rotas
 * públicas o valor é null quando ninguém está logado.
 */
public record AuthenticatedUser(Long id, String username, String name, Role role, UUID sessionId) {

	public boolean isAdmin() {
		return role == Role.ADMIN;
	}

}
