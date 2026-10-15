package br.com.secretbook.admin;

import br.com.secretbook.admin.dto.AdminDtos.AuthorRequest;
import br.com.secretbook.admin.dto.AdminDtos.AuthorRow;
import br.com.secretbook.admin.dto.AdminDtos.BookRequest;
import br.com.secretbook.admin.dto.AdminDtos.BookResponse;
import br.com.secretbook.admin.dto.AdminDtos.BookRow;
import br.com.secretbook.admin.dto.AdminDtos.FeedbackRow;
import br.com.secretbook.admin.dto.AdminDtos.GenreRequest;
import br.com.secretbook.admin.dto.AdminDtos.GenreRow;
import br.com.secretbook.admin.dto.AdminDtos.RecommendationSettingsRequest;
import br.com.secretbook.admin.dto.AdminDtos.RecommendationSettingsResponse;
import br.com.secretbook.admin.dto.AdminDtos.StatsResponse;
import br.com.secretbook.admin.dto.AdminDtos.SubscriptionRow;
import br.com.secretbook.admin.dto.AdminDtos.UserRow;
import br.com.secretbook.admin.dto.AdminDtos.UserUpdateRequest;
import br.com.secretbook.auth.AuthenticatedUser;
import br.com.secretbook.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Painel administrativo. Todas as rotas exigem o papel ADMIN (ver SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Administração", description = "Painel administrativo (somente administradores)")
public class AdminController {

	private final AdminService admin;

	private final AdminCatalogService catalog;

	public AdminController(AdminService admin, AdminCatalogService catalog) {
		this.admin = admin;
		this.catalog = catalog;
	}

	@GetMapping("/stats")
	@Operation(summary = "Números gerais do protótipo")
	public StatsResponse stats() {
		return admin.stats();
	}

	// ===== Livros =====

	@GetMapping("/books")
	@Operation(summary = "Busca livros (inclusive inativos) por título ou autor")
	public PageResponse<BookRow> books(@RequestParam(required = false) String q,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		return catalog.searchBooks(q, page, size);
	}

	@GetMapping("/books/{id}")
	public BookResponse book(@PathVariable Long id) {
		return catalog.getBook(id);
	}

	@PostMapping("/books")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Cadastra um livro; sem slug, ele é gerado a partir do título")
	public BookResponse createBook(@Valid @RequestBody BookRequest request) {
		return catalog.createBook(request);
	}

	@PutMapping("/books/{id}")
	public BookResponse updateBook(@PathVariable Long id, @Valid @RequestBody BookRequest request) {
		return catalog.updateBook(id, request);
	}

	@DeleteMapping("/books/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Exclui um livro que nunca foi recomendado (os demais só podem ser desativados)")
	public void deleteBook(@PathVariable Long id) {
		catalog.deleteBook(id);
	}

	// ===== Autores =====

	@GetMapping("/authors")
	public List<AuthorRow> authors() {
		return catalog.listAuthors();
	}

	@PostMapping("/authors")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthorRow createAuthor(@Valid @RequestBody AuthorRequest request) {
		return catalog.createAuthor(request);
	}

	@PutMapping("/authors/{id}")
	public AuthorRow updateAuthor(@PathVariable Long id, @Valid @RequestBody AuthorRequest request) {
		return catalog.updateAuthor(id, request);
	}

	@DeleteMapping("/authors/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteAuthor(@PathVariable Long id) {
		catalog.deleteAuthor(id);
	}

	// ===== Gêneros =====

	@GetMapping("/genres")
	public List<GenreRow> genres() {
		return catalog.listGenres();
	}

	@PostMapping("/genres")
	@ResponseStatus(HttpStatus.CREATED)
	public GenreRow createGenre(@Valid @RequestBody GenreRequest request) {
		return catalog.createGenre(request);
	}

	@PutMapping("/genres/{id}")
	@Operation(summary = "Atualiza nome e descrição (o slug não muda: o quiz o usa como referência)")
	public GenreRow updateGenre(@PathVariable Long id, @Valid @RequestBody GenreRequest request) {
		return catalog.updateGenre(id, request);
	}

	@DeleteMapping("/genres/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteGenre(@PathVariable Long id) {
		catalog.deleteGenre(id);
	}

	// ===== Usuários =====

	@GetMapping("/users")
	@Operation(summary = "Busca usuários por nome ou e-mail, dos mais novos aos mais antigos")
	public PageResponse<UserRow> users(@RequestParam(required = false) String q,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		return admin.searchUsers(q, page, size);
	}

	@PatchMapping("/users/{id}")
	@Operation(summary = "Muda o papel e/ou ativa e desativa a conta (desativar encerra as sessões)")
	public UserRow updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request,
			@AuthenticationPrincipal AuthenticatedUser actor) {
		return admin.updateUser(id, request.role(), request.enabled(), actor);
	}

	// ===== Avaliações, assinaturas e recomendação =====

	@GetMapping("/feedback")
	@Operation(summary = "Avaliações dos leitores sobre as recomendações")
	public PageResponse<FeedbackRow> feedback(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return admin.feedback(page, size);
	}

	@GetMapping("/subscriptions")
	@Operation(summary = "Assinaturas demonstrativas (ativas e canceladas)")
	public PageResponse<SubscriptionRow> subscriptions(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return admin.subscriptions(page, size);
	}

	@GetMapping("/recommendation-settings")
	public RecommendationSettingsResponse recommendationSettings() {
		return admin.recommendationSettings();
	}

	@PutMapping("/recommendation-settings")
	@Operation(summary = "Ajusta os pesos do motor de recomendação (valem para as próximas tentativas do quiz)")
	public RecommendationSettingsResponse updateRecommendationSettings(
			@Valid @RequestBody RecommendationSettingsRequest request) {
		return admin.updateRecommendationSettings(request);
	}

}
