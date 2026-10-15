package br.com.secretbook.account;

import br.com.secretbook.auth.AppUser;
import br.com.secretbook.catalog.Book;
import br.com.secretbook.quiz.QuizAttempt;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** Avaliação do leitor sobre um livro recomendado: combinou ou não, com comentário opcional. */
@Entity
public class RecommendationFeedback {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private AppUser user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "book_id")
	private Book book;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "attempt_id")
	private QuizAttempt attempt;

	@Column(nullable = false)
	private boolean useful;

	private String comment;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected RecommendationFeedback() {
	}

	public RecommendationFeedback(AppUser user, Book book) {
		this.user = user;
		this.book = book;
	}

	public void update(boolean useful, String comment, QuizAttempt attempt) {
		this.useful = useful;
		this.comment = comment;
		if (attempt != null) {
			this.attempt = attempt;
		}
	}

	public Long getId() {
		return id;
	}

	public AppUser getUser() {
		return user;
	}

	public Book getBook() {
		return book;
	}

	public QuizAttempt getAttempt() {
		return attempt;
	}

	public boolean isUseful() {
		return useful;
	}

	public String getComment() {
		return comment;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

}
