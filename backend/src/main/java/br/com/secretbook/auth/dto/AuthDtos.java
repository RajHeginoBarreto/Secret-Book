package br.com.secretbook.auth.dto;

import br.com.secretbook.auth.AppUser;
import br.com.secretbook.auth.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Requisições e respostas da autenticação. */
public final class AuthDtos {

	private AuthDtos() {
	}

	public record RegisterRequest(
			@NotBlank(message = "é obrigatório") @Size(max = 120, message = "deve ter no máximo 120 caracteres") String name,
			@NotBlank(message = "é obrigatório") @Email(message = "deve ser um e-mail válido") @Size(max = 254) String email,
			@ValidPassword String password) {
	}

	public record LoginRequest(@NotBlank(message = "é obrigatório") String email,
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

	public record UserResponse(Long id, String name, String email, Role role, Instant createdAt) {

		public static UserResponse of(AppUser user) {
			return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt());
		}

	}

	public record AuthResponse(String token, Instant expiresAt, UserResponse user) {
	}

	public record MessageResponse(String message) {
	}

}
