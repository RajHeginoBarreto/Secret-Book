package br.com.secretbook.account;

import br.com.secretbook.account.dto.AccountDtos.AccountExport;
import br.com.secretbook.account.dto.AccountDtos.AttemptSummary;
import br.com.secretbook.account.dto.AccountDtos.DeleteAccountRequest;
import br.com.secretbook.account.dto.AccountDtos.FeedbackRequest;
import br.com.secretbook.account.dto.AccountDtos.FeedbackResponse;
import br.com.secretbook.account.dto.AccountDtos.LibraryEntryResponse;
import br.com.secretbook.account.dto.AccountDtos.LibraryUpdateRequest;
import br.com.secretbook.account.dto.AccountDtos.ReaderProfileRequest;
import br.com.secretbook.account.dto.AccountDtos.ReaderProfileResponse;
import br.com.secretbook.account.dto.AccountDtos.ReviewRequest;
import br.com.secretbook.account.dto.AccountDtos.SubscribeRequest;
import br.com.secretbook.account.dto.AccountDtos.SubscriptionResponse;
import br.com.secretbook.auth.AuthService;
import br.com.secretbook.auth.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
@Tag(name = "Minha conta",
		description = "Perfil, biblioteca, comentários, histórico, avaliações, assinatura e dados (LGPD) do leitor logado")
public class AccountController {

	private final AccountService account;

	private final SubscriptionService subscriptions;

	private final ReaderProfileService profiles;

	private final AccountExportService exports;

	private final AuthService auth;

	public AccountController(AccountService account, SubscriptionService subscriptions, ReaderProfileService profiles,
			AccountExportService exports, AuthService auth) {
		this.account = account;
		this.subscriptions = subscriptions;
		this.profiles = profiles;
		this.exports = exports;
		this.auth = auth;
	}

	// ===== Dados da conta (LGPD) =====

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Exclui a conta e todos os dados dela (pede a senha para confirmar)")
	public void deleteAccount(@AuthenticationPrincipal AuthenticatedUser user,
			@Valid @RequestBody DeleteAccountRequest request) {
		auth.deleteAccount(user.id(), request.password());
	}

	@GetMapping("/export")
	@Operation(summary = "Exporta em JSON tudo o que a aplicação guarda sobre o leitor")
	public AccountExport export(@AuthenticationPrincipal AuthenticatedUser user) {
		return exports.export(user.id());
	}

	// ===== Perfil do leitor =====

	@GetMapping("/reader-profile")
	@Operation(summary = "Tipos literários de que o leitor gosta ou não gosta e autores favoritos")
	public ReaderProfileResponse readerProfile(@AuthenticationPrincipal AuthenticatedUser user) {
		return profiles.profile(user.id());
	}

	@PutMapping("/reader-profile")
	@Operation(summary = "Substitui o perfil do leitor (até 30 itens por lista)")
	public ReaderProfileResponse updateReaderProfile(@AuthenticationPrincipal AuthenticatedUser user,
			@Valid @RequestBody ReaderProfileRequest request) {
		return profiles.update(user.id(), request.likedGenres(), request.dislikedGenres(), request.favoriteAuthors());
	}

	// ===== Biblioteca =====

	@GetMapping("/library")
	@Operation(summary = "Livros da biblioteca (com status de leitura e/ou favoritos), do mais recente ao mais antigo")
	public List<LibraryEntryResponse> library(@AuthenticationPrincipal AuthenticatedUser user) {
		return account.library(user.id());
	}

	@GetMapping("/library/{bookSlug}")
	@Operation(summary = "Estado de um livro na biblioteca do leitor")
	public LibraryEntryResponse libraryEntry(@AuthenticationPrincipal AuthenticatedUser user,
			@PathVariable String bookSlug) {
		return account.libraryEntry(user.id(), bookSlug);
	}

	@PutMapping("/library/{bookSlug}")
	@Operation(summary = "Define status de leitura e favorito; sem os dois, o livro sai da biblioteca")
	public LibraryEntryResponse updateLibrary(@AuthenticationPrincipal AuthenticatedUser user,
			@PathVariable String bookSlug, @Valid @RequestBody LibraryUpdateRequest request) {
		return account.updateLibrary(user.id(), bookSlug, request.status(), request.favorite());
	}

	@PutMapping("/library/{bookSlug}/review")
	@Operation(summary = "Comenta (com nota opcional de 1 a 5) um livro marcado como lido")
	public LibraryEntryResponse review(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String bookSlug,
			@Valid @RequestBody ReviewRequest request) {
		return account.review(user.id(), bookSlug, request.rating(), request.comment());
	}

	@DeleteMapping("/library/{bookSlug}/review")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Apaga o comentário de um livro")
	public void deleteReview(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String bookSlug) {
		account.deleteReview(user.id(), bookSlug);
	}

	@GetMapping("/feedback")
	@Operation(summary = "Avaliações que o leitor deu às recomendações")
	public List<FeedbackResponse> feedback(@AuthenticationPrincipal AuthenticatedUser user) {
		return account.feedback(user.id());
	}

	@PutMapping("/feedback/{bookSlug}")
	@Operation(summary = "Avalia uma recomendação; \"não combina\" tira o livro das próximas recomendações")
	public FeedbackResponse giveFeedback(@AuthenticationPrincipal AuthenticatedUser user,
			@PathVariable String bookSlug, @Valid @RequestBody FeedbackRequest request) {
		return account.giveFeedback(user.id(), bookSlug, request.useful(), request.comment(), request.attemptId());
	}

	@DeleteMapping("/feedback/{bookSlug}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Remove a avaliação de um livro")
	public void deleteFeedback(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String bookSlug) {
		account.deleteFeedback(user.id(), bookSlug);
	}

	@GetMapping("/quiz-attempts")
	@Operation(summary = "Histórico de tentativas do quiz, da mais recente à mais antiga")
	public List<AttemptSummary> quizHistory(@AuthenticationPrincipal AuthenticatedUser user) {
		return account.quizHistory(user.id());
	}

	@GetMapping("/subscription")
	@Operation(summary = "Assinatura demonstrativa ativa (204 quando não há)")
	public ResponseEntity<SubscriptionResponse> subscription(@AuthenticationPrincipal AuthenticatedUser user) {
		return subscriptions.current(user.id()).map(ResponseEntity::ok)
			.orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PostMapping("/subscription")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Registra a assinatura demonstrativa de um plano (troca o plano, se já houver uma)")
	public SubscriptionResponse subscribe(@AuthenticationPrincipal AuthenticatedUser user,
			@Valid @RequestBody SubscribeRequest request) {
		return subscriptions.subscribe(user.id(), request.planSlug());
	}

	@DeleteMapping("/subscription")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Cancela a assinatura demonstrativa ativa")
	public void cancelSubscription(@AuthenticationPrincipal AuthenticatedUser user) {
		subscriptions.cancel(user.id());
	}

}
