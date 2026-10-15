package br.com.secretbook.auth;

import java.time.Clock;
import java.time.Instant;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Abre sessões e emite o token correspondente. */
@Service
public class TokenService {

	static final String ISSUER = "secretbook-api";

	private final JwtEncoder encoder;

	private final UserSessionRepository sessions;

	private final AuthProperties properties;

	private final Clock clock;

	public TokenService(JwtEncoder encoder, UserSessionRepository sessions, AuthProperties properties, Clock clock) {
		this.encoder = encoder;
		this.sessions = sessions;
		this.properties = properties;
		this.clock = clock;
	}

	public record IssuedToken(String token, Instant expiresAt) {
	}

	@Transactional
	public IssuedToken issue(AppUser user) {
		Instant now = clock.instant();
		UserSession session = sessions.save(new UserSession(user, now, now.plus(properties.tokenTtl())));
		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(ISSUER)
			.subject(user.getId().toString())
			.id(session.getId().toString())
			.issuedAt(now)
			.expiresAt(session.getExpiresAt())
			.claim("role", user.getRole().name())
			.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
		return new IssuedToken(token, session.getExpiresAt());
	}

}
