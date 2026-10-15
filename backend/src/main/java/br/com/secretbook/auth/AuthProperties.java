package br.com.secretbook.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param jwtSecret chave HMAC dos tokens (mínimo de 32 caracteres)
 * @param tokenTtl duração de uma sessão após o login
 * @param passwordResetTtl validade do link de redefinição de senha
 * @param frontendUrl endereço do frontend, usado para montar o link de redefinição
 */
@ConfigurationProperties("secretbook.auth")
public record AuthProperties(String jwtSecret, Duration tokenTtl, Duration passwordResetTtl, String frontendUrl) {

	public AuthProperties {
		if (jwtSecret == null || jwtSecret.length() < 32) {
			throw new IllegalStateException("secretbook.auth.jwt-secret (JWT_SECRET) precisa ter pelo menos 32 caracteres.");
		}
		tokenTtl = tokenTtl == null ? Duration.ofHours(12) : tokenTtl;
		passwordResetTtl = passwordResetTtl == null ? Duration.ofMinutes(30) : passwordResetTtl;
		frontendUrl = frontendUrl == null ? "http://localhost:5173" : frontendUrl.replaceAll("/+$", "");
	}

}
