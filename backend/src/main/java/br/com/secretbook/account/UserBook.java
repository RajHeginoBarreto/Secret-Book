package br.com.secretbook.account;

import br.com.secretbook.auth.AppUser;
import br.com.secretbook.catalog.Book;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import java.io.Serializable;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** Um livro na biblioteca do leitor: status de leitura e/ou favorito. */
@Entity
public class UserBook {

	@EmbeddedId
	private Id id;

	@MapsId("userId")
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	private AppUser user;

	@MapsId("bookId")
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "book_id")
	private Book book;

	@Enumerated(EnumType.STRING)
	private ReadingStatus status;

	@Column(nullable = false)
	private boolean favorite;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected UserBook() {
	}

	public UserBook(AppUser user, Book book) {
		this.id = new Id(user.getId(), book.getId());
		this.user = user;
		this.book = book;
	}

	public Book getBook() {
		return book;
	}

	public ReadingStatus getStatus() {
		return status;
	}

	public void setStatus(ReadingStatus status) {
		this.status = status;
	}

	public boolean isFavorite() {
		return favorite;
	}

	public void setFavorite(boolean favorite) {
		this.favorite = favorite;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	@Embeddable
	public record Id(Long userId, Long bookId) implements Serializable {
	}

}
