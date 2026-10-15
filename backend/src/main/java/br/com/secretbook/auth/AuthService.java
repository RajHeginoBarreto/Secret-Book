package br.com.secretbook.auth;

import br.com.secretbook.auth.dto.AuthDtos.AuthResponse;
import br.com.secretbook.auth.dto.AuthDtos.UserResponse;
import br.com.secretbook.common.error.ApiException;
import br.com.secretbook.common.error.ResourceNotFoundException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

	private static final String INVALID_CREDENTIALS = "E-mail ou senha incorretos.";

	private final SecureRandom random = new SecureRandom();

	private final AppUserRepository users;

	private final UserSessionRepository sessions;

	private final PasswordResetTokenRepository resetTokens;

	private final PasswordEncoder passwordEncoder;

	private final TokenService tokens;

	private final PasswordResetNotifier notifier;

	private final AuthProperties properties;

	private final Clock clock;

	/** Hash usado quando o e-mail não existe, para o tempo de resposta não revelar quais contas existem. */
	private final String dummyHash;

	public AuthService(AppUserRepository users, UserSessionRepository sessions, PasswordResetTokenRepository resetTokens,
			PasswordEncoder passwordEncoder, TokenService tokens, PasswordResetNotifier notifier,
			AuthProperties properties, Clock clock) {
		this.users = users;
		this.sessions = sessions;
		this.resetTokens = resetTokens;
		this.passwordEncoder = passwordEncoder;
		this.tokens = tokens;
		this.notifier = notifier;
		this.properties = properties;
		this.clock = clock;
		this.dummyHash = passwordEncoder.encode("senha-que-ninguem-usa-" + UUID.randomUUID());
	}

	public AuthResponse register(String name, String email, String password) {
		if (users.existsByEmail(email.trim())) {
			throw ApiException.conflict("Já existe uma conta com este e-mail.");
		}
		AppUser user = users.save(new AppUser(name.trim(), email, passwordEncoder.encode(password), Role.READER));
		return authResponse(user);
	}

	public AuthResponse login(String email, String password) {
		Optional<AppUser> found = users.findByEmail(email.trim());
		String hash = found.map(AppUser::getPasswordHash).orElse(dummyHash);
		boolean matches = passwordEncoder.matches(password, hash);
		AppUser user = found.filter(candidate -> matches)
			.orElseThrow(() -> ApiException.unauthorized(INVALID_CREDENTIALS));
		if (!user.isEnabled()) {
			throw ApiException.forbidden("Esta conta está desativada. Fale com o suporte.");
		}
		return authResponse(user);
	}

	public void logout(UUID sessionId) {
		sessions.findById(sessionId).ifPresent(session -> session.revoke(clock.instant()));
	}

	@Transactional(readOnly = true)
	public UserResponse me(Long userId) {
		return UserResponse.of(findUser(userId));
	}

	public UserResponse updateProfile(Long userId, String name) {
		AppUser user = findUser(userId);
		user.setName(name.trim());
		return UserResponse.of(user);
	}

	/** Troca a senha e encerra as outras sessões (a atual continua aberta). */
	public void changePassword(Long userId, UUID currentSession, String currentPassword, String newPassword) {
		AppUser user = findUser(userId);
		if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
			throw ApiException.badRequest("A senha atual está incorreta.");
		}
		user.setPasswordHash(passwordEncoder.encode(newPassword));
		sessions.revokeAll(userId, currentSession, clock.instant());
	}

	/**
	 * Gera um link de redefinição, se a conta existir. A resposta para o cliente é sempre a mesma, para não revelar
	 * quais e-mails têm conta.
	 */
	public void requestPasswordReset(String email) {
		users.findByEmail(email.trim()).filter(AppUser::isEnabled).ifPresent(user -> {
			byte[] bytes = new byte[32];
			random.nextBytes(bytes);
			String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
			Instant now = clock.instant();
			resetTokens.save(new PasswordResetToken(user, sha256(token), now, now.plus(properties.passwordResetTtl())));
			notifier.send(user, properties.frontendUrl() + "/redefinir-senha?token=" + token);
		});
	}

	/** Define a nova senha a partir do link e encerra todas as sessões abertas da conta. */
	public void resetPassword(String token, String newPassword) {
		Instant now = clock.instant();
		PasswordResetToken resetToken = resetTokens.findByTokenHash(sha256(token))
			.filter(found -> found.isUsable(now))
			.orElseThrow(() -> ApiException.badRequest(
					"Este link de redefinição é inválido ou expirou. Peça um novo link."));
		AppUser user = resetToken.getUser();
		user.setPasswordHash(passwordEncoder.encode(newPassword));
		resetToken.markUsed(now);
		sessions.revokeAll(user.getId(), null, now);
	}

	private AuthResponse authResponse(AppUser user) {
		TokenService.IssuedToken issued = tokens.issue(user);
		return new AuthResponse(issued.token(), issued.expiresAt(), UserResponse.of(user));
	}

	private AppUser findUser(Long userId) {
		return users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
	}

	static String sha256(String value) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 indisponível na JVM", ex);
		}
	}

}
