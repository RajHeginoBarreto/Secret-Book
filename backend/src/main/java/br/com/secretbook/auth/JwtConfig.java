package br.com.secretbook.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/** Tokens JWT assinados com HMAC-SHA256 pela própria API (sem provedor de identidade externo). */
@Configuration
@EnableConfigurationProperties(AuthProperties.class)
public class JwtConfig {

	private final SecretKey key;

	public JwtConfig(AuthProperties properties) {
		this.key = new SecretKeySpec(properties.jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
	}

	@Bean
	JwtEncoder jwtEncoder() {
		return new NimbusJwtEncoder(new ImmutableSecret<>(key));
	}

	@Bean
	JwtDecoder jwtDecoder() {
		return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
	}

	/** Declarado aqui (e não com @Component) porque todo Converter seria carregado nos testes de fatia web. */
	@Bean
	SessionAuthenticationConverter sessionAuthenticationConverter(UserSessionRepository sessions, Clock clock) {
		return new SessionAuthenticationConverter(sessions, clock);
	}

}
