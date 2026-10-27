package br.com.secretbook.account.dto;

import br.com.secretbook.account.Plan;
import br.com.secretbook.account.ReadingStatus;
import br.com.secretbook.account.Subscription;
import br.com.secretbook.auth.dto.AuthDtos.UserResponse;
import br.com.secretbook.catalog.dto.BookSummary;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/** Requisições e respostas da área do leitor. */
public final class AccountDtos {

	private AccountDtos() {
	}

	/** Estado completo do livro na biblioteca. Sem status e sem favorito, o livro sai da biblioteca. */
	public record LibraryUpdateRequest(ReadingStatus status, @NotNull(message = "é obrigatório") Boolean favorite) {
	}

	/**
	 * {@code status} vazio e {@code favorite} falso significam que o livro não está na biblioteca. {@code rating},
	 * {@code comment} e {@code reviewedAt} ficam nulos enquanto o leitor não comentar o livro.
	 */
	public record LibraryEntryResponse(BookSummary book, ReadingStatus status, boolean favorite, Instant updatedAt,
			Integer rating, String comment, Instant reviewedAt) {
	}

	/** Comentário sobre um livro lido. A nota é opcional; o texto chega sem espaços nas pontas. */
	public record ReviewRequest(
			@Min(value = 1, message = "deve ser de 1 a 5") @Max(value = 5, message = "deve ser de 1 a 5") Integer rating,
			@NotBlank(message = "é obrigatório") @Size(max = 1000, message = "deve ter no máximo 1000 caracteres") String comment) {

		public ReviewRequest {
			comment = comment == null ? null : comment.strip();
		}

	}

	/** Comentário público de um livro; {@code author} é o nome de usuário de quem comentou. */
	public record BookCommentResponse(String author, Integer rating, String comment, Instant reviewedAt) {
	}

	/**
	 * Preferências do leitor. Cada item chega sem espaços nas pontas; itens vazios são ignorados e repetidos (sem
	 * diferenciar maiúsculas) contam uma vez só, mantendo a primeira ocorrência.
	 */
	public record ReaderProfileRequest(
			@Size(max = 30, message = "use no máximo 30 itens") List<@Size(max = 60, message = "deve ter no máximo 60 caracteres") String> likedGenres,
			@Size(max = 30, message = "use no máximo 30 itens") List<@Size(max = 60, message = "deve ter no máximo 60 caracteres") String> dislikedGenres,
			@Size(max = 30, message = "use no máximo 30 itens") List<@Size(max = 120, message = "deve ter no máximo 120 caracteres") String> favoriteAuthors) {

		public ReaderProfileRequest {
			likedGenres = clean(likedGenres);
			dislikedGenres = clean(dislikedGenres);
			favoriteAuthors = clean(favoriteAuthors);
		}

		private static List<String> clean(List<String> items) {
			if (items == null) {
				return List.of();
			}
			Set<String> seen = new HashSet<>();
			List<String> result = new ArrayList<>();
			for (String item : items) {
				String value = item == null ? "" : item.strip().replaceAll("\\s+", " ");
				if (!value.isEmpty() && seen.add(value.toLowerCase(Locale.ROOT))) {
					result.add(value);
				}
			}
			return List.copyOf(result);
		}

	}

	/** Tipos literários em ordem alfabética; autores na ordem salva pelo leitor. */
	public record ReaderProfileResponse(List<String> likedGenres, List<String> dislikedGenres,
			List<String> favoriteAuthors) {
	}

	/** Exclusão da conta: a senha confirma que é mesmo a dona da conta. */
	public record DeleteAccountRequest(@NotBlank(message = "é obrigatória") String password) {
	}

	/** Tudo o que a aplicação guarda sobre o leitor (direito de acesso e portabilidade da LGPD). */
	public record AccountExport(UserResponse user, Instant privacyAcceptedAt, ReaderProfileResponse readerProfile,
			List<LibraryEntryResponse> library, List<FeedbackResponse> feedback, List<AttemptSummary> quizAttempts,
			SubscriptionResponse subscription) {
	}

	public record FeedbackRequest(@NotNull(message = "é obrigatório") Boolean useful,
			@Size(max = 500, message = "deve ter no máximo 500 caracteres") String comment, UUID attemptId) {
	}

	public record FeedbackResponse(BookSummary book, boolean useful, String comment, UUID attemptId,
			Instant updatedAt) {
	}

	public record AttemptSummary(UUID id, Instant createdAt, String profileName, List<String> recommendedTitles) {
	}

	public record PlanResponse(String slug, String name, int monthlyPriceCents, int booksPerMonth) {

		public static PlanResponse of(Plan plan) {
			return new PlanResponse(plan.getSlug(), plan.getName(), plan.getMonthlyPriceCents(), plan.getBooksPerMonth());
		}

	}

	public record SubscriptionResponse(Long id, PlanResponse plan, Subscription.Status status, Instant startedAt,
			Instant canceledAt) {

		public static SubscriptionResponse of(Subscription subscription) {
			return new SubscriptionResponse(subscription.getId(), PlanResponse.of(subscription.getPlan()),
					subscription.getStatus(), subscription.getStartedAt(), subscription.getCanceledAt());
		}

	}

	public record SubscribeRequest(@NotBlank(message = "é obrigatório") String planSlug) {
	}

}
