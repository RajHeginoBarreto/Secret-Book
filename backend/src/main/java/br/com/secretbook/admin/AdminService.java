package br.com.secretbook.admin;

import br.com.secretbook.account.RecommendationFeedback;
import br.com.secretbook.account.RecommendationFeedbackRepository;
import br.com.secretbook.account.Subscription;
import br.com.secretbook.account.SubscriptionRepository;
import br.com.secretbook.admin.dto.AdminDtos.CountItem;
import br.com.secretbook.admin.dto.AdminDtos.FeedbackRow;
import br.com.secretbook.admin.dto.AdminDtos.RecommendationSettingsRequest;
import br.com.secretbook.admin.dto.AdminDtos.RecommendationSettingsResponse;
import br.com.secretbook.admin.dto.AdminDtos.StatsResponse;
import br.com.secretbook.admin.dto.AdminDtos.SubscriptionRow;
import br.com.secretbook.admin.dto.AdminDtos.UserRow;
import br.com.secretbook.auth.AppUser;
import br.com.secretbook.auth.AppUserRepository;
import br.com.secretbook.auth.AuthenticatedUser;
import br.com.secretbook.auth.Role;
import br.com.secretbook.auth.UserSessionRepository;
import br.com.secretbook.catalog.BookRepository;
import br.com.secretbook.common.PageResponse;
import br.com.secretbook.common.error.ApiException;
import br.com.secretbook.common.error.ResourceNotFoundException;
import br.com.secretbook.quiz.QuizAttemptRepository;
import br.com.secretbook.quiz.RecommendationSettings;
import br.com.secretbook.quiz.RecommendationSettingsRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Visão geral, usuários, avaliações, assinaturas e pesos da recomendação. */
@Service
@Transactional
public class AdminService {

	private static final int MAX_PAGE_SIZE = 50;

	private final AppUserRepository users;

	private final UserSessionRepository sessions;

	private final BookRepository books;

	private final QuizAttemptRepository attempts;

	private final RecommendationFeedbackRepository feedback;

	private final SubscriptionRepository subscriptions;

	private final RecommendationSettingsRepository settings;

	private final Clock clock;

	public AdminService(AppUserRepository users, UserSessionRepository sessions, BookRepository books,
			QuizAttemptRepository attempts, RecommendationFeedbackRepository feedback,
			SubscriptionRepository subscriptions, RecommendationSettingsRepository settings, Clock clock) {
		this.users = users;
		this.sessions = sessions;
		this.books = books;
		this.attempts = attempts;
		this.feedback = feedback;
		this.subscriptions = subscriptions;
		this.settings = settings;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public StatsResponse stats() {
		List<CountItem> byPlan = subscriptions.countActiveByPlan().stream()
			.map(row -> new CountItem((String) row[0], (Long) row[1]))
			.toList();
		List<CountItem> topBooks = attempts.mostRecommendedBooks(PageRequest.of(0, 5)).stream()
			.map(row -> new CountItem((String) row[0], (Long) row[1]))
			.toList();
		return new StatsResponse(users.count(), users.countByRole(Role.READER), users.countByRole(Role.ADMIN),
				books.countByActiveTrue(), books.count(), attempts.count(),
				attempts.countByCreatedAtAfter(clock.instant().minus(Duration.ofDays(30))),
				byPlan.stream().mapToLong(CountItem::count).sum(), byPlan, feedback.countByUseful(true),
				feedback.countByUseful(false), topBooks);
	}

	// ===== Usuários =====

	@Transactional(readOnly = true)
	public PageResponse<UserRow> searchUsers(String query, int page, int size) {
		String pattern = StringUtils.hasText(query) ? "%" + query.trim().toLowerCase(Locale.ROOT) + "%" : null;
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE),
				Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("id")));
		return PageResponse.of(users.search(pattern, pageable), AdminService::toRow);
	}

	/**
	 * Muda papel e/ou acesso de um usuário. Ninguém altera o próprio acesso (evita o painel ficar sem administrador).
	 * Desativar encerra todas as sessões da pessoa na hora.
	 */
	public UserRow updateUser(Long id, Role role, Boolean enabled, AuthenticatedUser actor) {
		if (actor.id().equals(id)) {
			throw ApiException.badRequest("Você não pode alterar o próprio papel ou acesso.");
		}
		AppUser user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
		if (role != null) {
			user.setRole(role);
		}
		if (enabled != null) {
			user.setEnabled(enabled);
			if (!enabled) {
				sessions.revokeAll(user.getId(), null, clock.instant());
				user = users.findById(id).orElseThrow();
			}
		}
		return toRow(user);
	}

	private static UserRow toRow(AppUser user) {
		return new UserRow(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isEnabled(),
				user.getCreatedAt());
	}

	// ===== Avaliações e assinaturas =====

	@Transactional(readOnly = true)
	public PageResponse<FeedbackRow> feedback(int page, int size) {
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE),
				Sort.by(Sort.Direction.DESC, "updatedAt"));
		return PageResponse.of(feedback.findAllWithDetails(pageable), AdminService::toRow);
	}

	private static FeedbackRow toRow(RecommendationFeedback entry) {
		return new FeedbackRow(entry.getId(), entry.getUser().getName(), entry.getUser().getEmail(),
				entry.getBook().getSlug(), entry.getBook().getTitle(), entry.isUseful(), entry.getComment(),
				entry.getAttempt() == null ? null : entry.getAttempt().getId(), entry.getUpdatedAt());
	}

	@Transactional(readOnly = true)
	public PageResponse<SubscriptionRow> subscriptions(int page, int size) {
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE),
				Sort.by(Sort.Direction.DESC, "startedAt"));
		return PageResponse.of(subscriptions.findAllWithDetails(pageable), AdminService::toRow);
	}

	private static SubscriptionRow toRow(Subscription subscription) {
		return new SubscriptionRow(subscription.getId(), subscription.getUser().getName(),
				subscription.getUser().getEmail(), subscription.getPlan().getName(), subscription.getStatus(),
				subscription.getStartedAt(), subscription.getCanceledAt());
	}

	// ===== Recomendação =====

	@Transactional(readOnly = true)
	public RecommendationSettingsResponse recommendationSettings() {
		return toResponse(settings.current());
	}

	public RecommendationSettingsResponse updateRecommendationSettings(RecommendationSettingsRequest request) {
		BigDecimal total = request.genreWeight().add(request.paceWeight()).add(request.toneWeight())
			.add(request.lengthWeight());
		if (total.signum() <= 0) {
			throw ApiException.badRequest("Pelo menos um peso precisa ser maior que zero.");
		}
		RecommendationSettings current = settings.current();
		current.update(request.genreWeight(), request.paceWeight(), request.toneWeight(), request.lengthWeight(),
				request.maxResults(), request.mixThreshold());
		return toResponse(settings.saveAndFlush(current));
	}

	private static RecommendationSettingsResponse toResponse(RecommendationSettings value) {
		return new RecommendationSettingsResponse(value.getGenreWeight(), value.getPaceWeight(), value.getToneWeight(),
				value.getLengthWeight(), value.getMaxResults(), value.getMixThreshold(), value.getUpdatedAt());
	}

}
