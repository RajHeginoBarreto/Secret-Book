package br.com.secretbook.auth.dto;

import br.com.secretbook.auth.AppUser;
import br.com.secretbook.auth.Role;
import br.com.secretbook.auth.Usernames;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Requisições e respostas da autenticação. */
public final class AuthDtos {

	private AuthDtos() {
	}

	/**
	 * Cadastro sem e-mail (minimização de dados). O nome de usuário chega já normalizado (sem espaços nas pontas e com
	 * espaços internos reduzidos a um só) antes da validação.
	 */
	public record RegisterRequest(
			@NotBlank(message = "é obrigatório") @Pattern(regexp = Usernames.REGEX, message = Usernames.MESSAGE) String username,
			@ValidPassword String password,
			@NotNull(message = "é preciso aceitar a política de privacidade") @AssertTrue(message = "é preciso aceitar a política de privacidade") Boolean acceptPrivacy) {

		public RegisterRequest {
			username = Usernames.normalize(username);
		}

	}

	/** {@code username} também aceita o e-mail de contas antigas (quando contém "@"). */
	public record LoginRequest(@NotBlank(message = "é obrigatório") String username,
			@NotBlank(message = "é obrigatória") String password) {
	}

	public record UpdateProfileRequest(
			@NotBlank(message = "é obrigatório") @Size(max = 120, message = "deve ter no máximo 120 caracteres") String name) {
	}

	public record ChangePasswordRequest(@NotBlank(message = "é obrigatória") String currentPassword,
			@ValidPassword String newPassword) {
	}

	public record ForgotPasswordRequest(
			@NotBlank(message = "é obrigatório") @Email(message = "deve ser um e-mail válido") String email) {
	}

	public record ResetPasswordRequest(@NotBlank(message = "é obrigatório") String token,
			@ValidPassword String newPassword) {
	}

	/** {@code email} é nulo em contas criadas só com nome de usuário. */
	public record UserResponse(Long id, String name, String username, String email, Role role, Instant createdAt) {

		public static UserResponse of(AppUser user) {
			return new UserResponse(user.getId(), user.getName(), user.getUsername(), user.getEmail(), user.getRole(),
					user.getCreatedAt());
		}

	}

	public record AuthResponse(String token, Instant expiresAt, UserResponse user) {
	}

	public record MessageResponse(String message) {
	}

}
