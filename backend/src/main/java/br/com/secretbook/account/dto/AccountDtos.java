package br.com.secretbook.account.dto;

import br.com.secretbook.account.Plan;
import br.com.secretbook.account.ReadingStatus;
import br.com.secretbook.account.Subscription;
import br.com.secretbook.catalog.dto.BookSummary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Requisições e respostas da área do leitor. */
public final class AccountDtos {

	private AccountDtos() {
	}

	/** Estado completo do livro na biblioteca. Sem status e sem favorito, o livro sai da biblioteca. */
	public record LibraryUpdateRequest(ReadingStatus status, @NotNull(message = "é obrigatório") Boolean favorite) {
	}

	/** {@code status} vazio e {@code favorite} falso significam que o livro não está na biblioteca. */
	public record LibraryEntryResponse(BookSummary book, ReadingStatus status, boolean favorite, Instant updatedAt) {
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
