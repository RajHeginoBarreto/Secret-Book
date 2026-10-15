package br.com.secretbook.auth;

import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;

/**
 * Depois de validar a assinatura e a validade do JWT, confere no banco se a sessão continua ativa e se o usuário
 * ainda está habilitado. Assim, logout, troca de senha, desativação e mudança de papel valem na hora.
 */
public class SessionAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

	private final UserSessionRepository sessions;

	private final Clock clock;

	public SessionAuthenticationConverter(UserSessionRepository sessions, Clock clock) {
		this.sessions = sessions;
		this.clock = clock;
	}

	@Override
	@Transactional(readOnly = true)
	public AbstractAuthenticationToken convert(Jwt jwt) {
		UserSession session = parseId(jwt.getId())
			.flatMap(sessions::findWithUser)
			.filter(found -> found.isActive(clock.instant()))
			.orElseThrow(() -> new BadCredentialsException("Sessão encerrada ou expirada."));

		AppUser user = session.getUser();
		if (!user.isEnabled() || !user.getId().toString().equals(jwt.getSubject())) {
			throw new BadCredentialsException("Sessão inválida.");
		}

		var principal = new AuthenticatedUser(user.getId(), user.getEmail(), user.getName(), user.getRole(),
				session.getId());
		var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
		return UsernamePasswordAuthenticationToken.authenticated(principal, jwt, authorities);
	}

	private static Optional<UUID> parseId(String id) {
		try {
			return Optional.ofNullable(id).map(UUID::fromString);
		}
		catch (IllegalArgumentException ex) {
			return Optional.empty();
		}
	}

}
