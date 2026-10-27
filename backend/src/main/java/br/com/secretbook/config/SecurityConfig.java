package br.com.secretbook.config;

import br.com.secretbook.auth.SessionAuthenticationConverter;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

/**
 * Segurança da API: sem sessão HTTP nem formulário de login. Quem está logado envia o token no cabeçalho
 * {@code Authorization: Bearer ...}. O que não estiver liberado abaixo é negado.
 */
@Configuration
@EnableConfigurationProperties(CorsProperties.class)
public class SecurityConfig {

	private static final String[] DOCS = { "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
			"/actuator/health", "/error" };

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, SessionAuthenticationConverter sessionConverter,
			@Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) throws Exception {
		// 401/403 passam pelo ApiExceptionHandler, para terem o mesmo formato (e idioma) dos outros erros.
		AuthenticationEntryPoint entryPoint = (request, response, ex) -> resolver.resolveException(request, response,
				null, ex);
		AccessDeniedHandler deniedHandler = (request, response, ex) -> resolver.resolveException(request, response,
				null, ex);

		return http
			// O token vai em um cabeçalho, não em cookie: não há o que proteger com CSRF.
			.csrf(AbstractHttpConfigurer::disable)
			.cors(Customizer.withDefaults())
			.httpBasic(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable)
			.logout(AbstractHttpConfigurer::disable)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.oauth2ResourceServer(oauth -> oauth
				.jwt(jwt -> jwt.jwtAuthenticationConverter(sessionConverter))
				.authenticationEntryPoint(entryPoint)
				.accessDeniedHandler(deniedHandler))
			.exceptionHandling(handling -> handling.authenticationEntryPoint(entryPoint)
				.accessDeniedHandler(deniedHandler))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(DOCS).permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/password/forgot",
						"/api/auth/password/reset")
				.permitAll()
				.requestMatchers(HttpMethod.GET, "/api/genres", "/api/books", "/api/books/*", "/api/authors/*",
						"/api/books/*/comments", "/api/quiz", "/api/quiz/attempts/*", "/api/plans")
				.permitAll()
				.requestMatchers(HttpMethod.POST, "/api/quiz/attempts").permitAll()
				.requestMatchers("/api/admin/**").hasRole("ADMIN")
				.requestMatchers("/api/auth/**", "/api/me", "/api/me/**").authenticated()
				.anyRequest().denyAll())
			.build();
	}

	/** BCrypt, com prefixo de algoritmo ({bcrypt}…) para permitir migrar de algoritmo no futuro. */
	@Bean
	PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(properties.allowedOrigins());
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("Content-Type", "Authorization"));
		config.setMaxAge(Duration.ofHours(1));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", config);
		return source;
	}

}
