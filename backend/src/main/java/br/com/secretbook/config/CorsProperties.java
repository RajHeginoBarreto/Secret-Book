package br.com.secretbook.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Origens (esquema + host + porta) que podem chamar a API a partir do navegador.
 */
@ConfigurationProperties("secretbook.cors")
public record CorsProperties(List<String> allowedOrigins) {

	public CorsProperties {
		allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
	}

}
