package br.com.secretbook.account;

import br.com.secretbook.account.dto.AccountDtos.AttemptSummary;
import br.com.secretbook.account.dto.AccountDtos.FeedbackResponse;
import br.com.secretbook.account.dto.AccountDtos.LibraryEntryResponse;
import br.com.secretbook.auth.AppUser;
import br.com.secretbook.auth.AppUserRepository;
import br.com.secretbook.catalog.Book;
import br.com.secretbook.catalog.BookRepository;
import br.com.secretbook.catalog.CatalogMapper;
import br.com.secretbook.common.error.ResourceNotFoundException;
import br.com.secretbook.quiz.AttemptRecommendation;
import br.com.secretbook.quiz.QuizAttempt;
import br.com.secretbook.quiz.QuizAttemptRepository;
import br.com.secretbook.quiz.ReaderHistory;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Biblioteca, favoritos, avaliações das recomendações e histórico do quiz de cada leitor. */
@Service
@Transactional
public class AccountService implements ReaderHistory {

	private final UserBookRepository library;

	private final RecommendationFeedbackRepository feedback;

	private final QuizAttemptRepository attempts;

	private final BookRepository books;

	private final AppUserRepository users;

	public AccountService(UserBookRepository library, RecommendationFeedbackRepository feedback,
			QuizAttemptRepository attempts, BookRepository books, AppUserRepository users) {
		this.library = library;
		this.feedback = feedback;
		this.attempts = attempts;
		this.books = books;
		this.users = users;
	}

	// ===== Biblioteca =====

	@Transactional(readOnly = true)
	public List<LibraryEntryResponse> library(Long userId) {
		return library.findByUser(userId).stream().map(AccountService::toEntry).toList();
	}

	@Transactional(readOnly = true)
	public LibraryEntryResponse libraryEntry(Long userId, String bookSlug) {
		Book book = findBook(bookSlug);
		return library.findById(new UserBook.Id(userId, book.getId()))
			.map(AccountService::toEntry)
			.orElseGet(() -> new LibraryEntryResponse(CatalogMapper.toSummary(book), null, false, null));
	}

	/** Grava o estado do livro na biblioteca; sem status e sem favorito, o livro é removido. */
	public LibraryEntryResponse updateLibrary(Long userId, String bookSlug, ReadingStatus status, boolean favorite) {
		Book book = findBook(bookSlug);
		UserBook.Id id = new UserBook.Id(userId, book.getId());
		if (status == null && !favorite) {
			library.deleteById(id);
			return new LibraryEntryResponse(CatalogMapper.toSummary(book), null, false, null);
		}
		UserBook entry = library.findById(id).orElseGet(() -> new UserBook(users.getReferenceById(userId), book));
		entry.setStatus(status);
		entry.setFavorite(favorite);
		return toEntry(library.saveAndFlush(entry));
	}

	// ===== Avaliações das recomendações =====

	@Transactional(readOnly = true)
	public List<FeedbackResponse> feedback(Long userId) {
		return feedback.findByUser(userId).stream().map(AccountService::toFeedback).toList();
	}

	public FeedbackResponse giveFeedback(Long userId, String bookSlug, boolean useful, String comment,
			UUID attemptId) {
		Book book = findBook(bookSlug);
		AppUser user = users.getReferenceById(userId);
		QuizAttempt attempt = attemptId == null ? null
				: attempts.findById(attemptId)
					.filter(found -> found.getUser() != null && found.getUser().getId().equals(userId))
					.orElseThrow(() -> new ResourceNotFoundException("Resultado do quiz não encontrado."));
		RecommendationFeedback entry = feedback.findByUserAndBook(userId, book.getId())
			.orElseGet(() -> new RecommendationFeedback(user, book));
		entry.update(useful, StringUtils.hasText(comment) ? comment.trim() : null, attempt);
		return toFeedback(feedback.saveAndFlush(entry));
	}

	public void deleteFeedback(Long userId, String bookSlug) {
		Book book = findBook(bookSlug);
		feedback.findByUserAndBook(userId, book.getId()).ifPresent(feedback::delete);
	}

	// ===== Histórico do quiz =====

	@Transactional(readOnly = true)
	public List<AttemptSummary> quizHistory(Long userId) {
		return attempts.findByUser(userId).stream()
			.map(attempt -> new AttemptSummary(attempt.getId(), attempt.getCreatedAt(), attempt.getProfileName(),
					attempt.getRecommendations().stream().map(AttemptRecommendation::getBook).map(Book::getTitle)
						.toList()))
			.toList();
	}

	/** Livros lidos ou avaliados como "não combina" deixam de ser recomendados para o leitor. */
	@Override
	@Transactional(readOnly = true)
	public Set<Long> handledBookIds(Long userId) {
		Set<Long> ids = new HashSet<>(library.findBookIdsByStatus(userId, ReadingStatus.READ));
		ids.addAll(feedback.findRejectedBookIds(userId));
		return ids;
	}

	private Book findBook(String slug) {
		return books.findBySlug(slug).orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado."));
	}

	private static LibraryEntryResponse toEntry(UserBook entry) {
		return new LibraryEntryResponse(CatalogMapper.toSummary(entry.getBook()), entry.getStatus(), entry.isFavorite(),
				entry.getUpdatedAt());
	}

	private static FeedbackResponse toFeedback(RecommendationFeedback entry) {
		return new FeedbackResponse(CatalogMapper.toSummary(entry.getBook()), entry.isUseful(), entry.getComment(),
				entry.getAttempt() == null ? null : entry.getAttempt().getId(), entry.getUpdatedAt());
	}

}
