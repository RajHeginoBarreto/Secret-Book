package br.com.secretbook.admin.dto;

import br.com.secretbook.account.Subscription;
import br.com.secretbook.auth.Role;
import br.com.secretbook.catalog.ContentNote;
import br.com.secretbook.catalog.Pace;
import br.com.secretbook.catalog.Tone;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Requisições e respostas do painel administrativo. */
public final class AdminDtos {

	private static final String SLUG_REGEX = "^[a-z0-9]+(-[a-z0-9]+)*$";

	private static final String SLUG_MESSAGE = "deve ter só letras minúsculas, números e hífens";

	private AdminDtos() {
	}

	// ===== Visão geral =====

	public record StatsResponse(long users, long readers, long admins, long activeBooks, long totalBooks,
			long quizAttempts, long quizAttemptsLast30Days, long activeSubscriptions, List<CountItem> subscriptionsByPlan,
			long usefulFeedback, long notUsefulFeedback, List<CountItem> mostRecommendedBooks) {
	}

	public record CountItem(String label, long count) {
	}

	// ===== Livros =====

	public record BookRequest(
			@Size(max = 160) @Pattern(regexp = SLUG_REGEX, message = SLUG_MESSAGE) String slug,
			@NotBlank(message = "é obrigatório") @Size(max = 200, message = "deve ter no máximo 200 caracteres") String title,
			@NotBlank(message = "é obrigatória") @Size(max = 4000, message = "deve ter no máximo 4000 caracteres") String synopsis,
			@Min(value = 1000, message = "deve ser um ano válido") @Max(value = 2100, message = "deve ser um ano válido") Integer publicationYear,
			@NotNull(message = "é obrigatório") @Positive(message = "deve ser maior que zero") @Max(value = 5000, message = "deve ser no máximo 5000") Integer pages,
			@NotNull(message = "é obrigatório") Pace pace,
			@NotNull(message = "é obrigatório") Tone tone,
			@NotNull(message = "é obrigatória") @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "deve estar no formato #rrggbb") String coverColor,
			@NotNull(message = "é obrigatório") Boolean active,
			@NotEmpty(message = "escolha pelo menos um autor") List<@NotBlank String> authorSlugs,
			@NotEmpty(message = "escolha pelo menos um gênero") Set<@NotBlank String> genreSlugs,
			Set<ContentNote> contentNotes,
			@Size(max = 5, message = "use no máximo 5 pistas") List<@NotBlank(message = "não pode ficar vazia") @Size(max = 200, message = "deve ter no máximo 200 caracteres") String> clues) {
	}

	public record BookRow(Long id, String slug, String title, List<String> authors, List<String> genres, boolean active,
			Instant updatedAt) {
	}

	public record BookResponse(Long id, String slug, String title, String synopsis, Integer publicationYear, int pages,
			Pace pace, Tone tone, String coverColor, boolean active, List<String> authorSlugs, List<String> genreSlugs,
			List<ContentNote> contentNotes, List<String> clues, Instant createdAt, Instant updatedAt) {
	}

	// ===== Autores e gêneros =====

	public record AuthorRequest(
			@Size(max = 120) @Pattern(regexp = SLUG_REGEX, message = SLUG_MESSAGE) String slug,
			@NotBlank(message = "é obrigatório") @Size(max = 150, message = "deve ter no máximo 150 caracteres") String name,
			@Size(max = 2000, message = "deve ter no máximo 2000 caracteres") String bio) {
	}

	public record AuthorRow(Long id, String slug, String name, String bio, long bookCount) {
	}

	/** O slug do gênero só é definido na criação: o quiz o usa como referência. */
	public record GenreRequest(
			@Size(max = 60) @Pattern(regexp = SLUG_REGEX, message = SLUG_MESSAGE) String slug,
			@NotBlank(message = "é obrigatório") @Size(max = 80, message = "deve ter no máximo 80 caracteres") String name,
			@Size(max = 500, message = "deve ter no máximo 500 caracteres") String description) {
	}

	public record GenreRow(Long id, String slug, String name, String description, long bookCount, boolean usedByQuiz) {
	}

	// ===== Usuários =====

	/** {@code email} é nulo em contas criadas só com nome de usuário. */
	public record UserRow(Long id, String name, String username, String email, Role role, boolean enabled,
			Instant createdAt) {
	}

	public record UserUpdateRequest(Role role, Boolean enabled) {
	}

	// ===== Avaliações e assinaturas =====

	public record FeedbackRow(Long id, String userName, String username, String userEmail, String bookSlug, String bookTitle,
			boolean useful, String comment, UUID attemptId, Instant updatedAt) {
	}

	public record SubscriptionRow(Long id, String userName, String username, String userEmail, String planName,
			Subscription.Status status, Instant startedAt, Instant canceledAt) {
	}

	// ===== Recomendação =====

	public record RecommendationSettingsRequest(
			@NotNull @DecimalMin(value = "0", message = "não pode ser negativo") @DecimalMax(value = "10", message = "deve ser no máximo 10") @Digits(integer = 2, fraction = 2) BigDecimal genreWeight,
			@NotNull @DecimalMin(value = "0", message = "não pode ser negativo") @DecimalMax(value = "10", message = "deve ser no máximo 10") @Digits(integer = 2, fraction = 2) BigDecimal paceWeight,
			@NotNull @DecimalMin(value = "0", message = "não pode ser negativo") @DecimalMax(value = "10", message = "deve ser no máximo 10") @Digits(integer = 2, fraction = 2) BigDecimal toneWeight,
			@NotNull @DecimalMin(value = "0", message = "não pode ser negativo") @DecimalMax(value = "10", message = "deve ser no máximo 10") @Digits(integer = 2, fraction = 2) BigDecimal lengthWeight,
			@NotNull @Min(value = 1, message = "deve ser pelo menos 1") @Max(value = 12, message = "deve ser no máximo 12") Integer maxResults,
			@NotNull @DecimalMin(value = "0.5", message = "deve ser pelo menos 0,5") @DecimalMax(value = "10", message = "deve ser no máximo 10") @Digits(integer = 2, fraction = 2) BigDecimal mixThreshold) {
	}

	public record RecommendationSettingsResponse(BigDecimal genreWeight, BigDecimal paceWeight, BigDecimal toneWeight,
			BigDecimal lengthWeight, int maxResults, BigDecimal mixThreshold, Instant updatedAt) {
	}

}
