package br.com.secretbook.auth;

import br.com.secretbook.auth.dto.AuthDtos.AuthResponse;
import br.com.secretbook.auth.dto.AuthDtos.ChangePasswordRequest;
import br.com.secretbook.auth.dto.AuthDtos.ForgotPasswordRequest;
import br.com.secretbook.auth.dto.AuthDtos.LoginRequest;
import br.com.secretbook.auth.dto.AuthDtos.MessageResponse;
import br.com.secretbook.auth.dto.AuthDtos.RegisterRequest;
import br.com.secretbook.auth.dto.AuthDtos.ResetPasswordRequest;
import br.com.secretbook.auth.dto.AuthDtos.UpdateProfileRequest;
import br.com.secretbook.auth.dto.AuthDtos.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Cadastro, login, logout e recuperação de senha")
public class AuthController {

	private final AuthService auth;

	public AuthController(AuthService auth) {
		this.auth = auth;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Cria uma conta de leitor (nome de usuário e senha, sem e-mail) e já abre uma sessão")
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return auth.register(request.username(), request.password());
	}

	@PostMapping("/login")
	@Operation(summary = "Abre uma sessão com nome de usuário (ou e-mail, em contas antigas) e devolve o token (Bearer)")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return auth.login(request.username(), request.password());
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Encerra a sessão atual: o token deixa de valer na hora")
	public void logout(@AuthenticationPrincipal AuthenticatedUser user) {
		auth.logout(user.sessionId());
	}

	@GetMapping("/me")
	@Operation(summary = "Dados do usuário logado")
	public UserResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
		return auth.me(user.id());
	}

	@PatchMapping("/me")
	@Operation(summary = "Atualiza o nome do usuário logado")
	public UserResponse updateMe(@AuthenticationPrincipal AuthenticatedUser user,
			@Valid @RequestBody UpdateProfileRequest request) {
		return auth.updateProfile(user.id(), request.name());
	}

	@PostMapping("/password/change")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Troca a senha e encerra as outras sessões abertas")
	public void changePassword(@AuthenticationPrincipal AuthenticatedUser user,
			@Valid @RequestBody ChangePasswordRequest request) {
		auth.changePassword(user.id(), user.sessionId(), request.currentPassword(), request.newPassword());
	}

	@PostMapping("/password/forgot")
	@ResponseStatus(HttpStatus.ACCEPTED)
	@Operation(summary = "Envia um link de redefinição, se o e-mail tiver conta (a resposta é sempre a mesma)")
	public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		auth.requestPasswordReset(request.email());
		return new MessageResponse(
				"Se existir uma conta com este e-mail, enviaremos um link para redefinir a senha.");
	}

	@PostMapping("/password/reset")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Define uma nova senha a partir do link recebido e encerra todas as sessões")
	public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		auth.resetPassword(request.token(), request.newPassword());
	}

}
