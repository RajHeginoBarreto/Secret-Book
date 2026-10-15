package br.com.secretbook.quiz;

import br.com.secretbook.catalog.Book;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.util.List;

/** Um livro recomendado em uma tentativa do quiz, guardado como foi apresentado ao leitor. */
@Embeddable
public class AttemptRecommendation {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "book_id")
	private Book book;

	@Column(nullable = false)
	private int score;

	@Column(nullable = false)
	private int genreMatch;

	@Column(nullable = false)
	private int paceMatch;

	@Column(nullable = false)
	private int toneMatch;

	@Column(nullable = false)
	private int lengthMatch;

	@Column(nullable = false)
	private String reasons;

	protected AttemptRecommendation() {
	}

	public AttemptRecommendation(Book book, int score, int genreMatch, int paceMatch, int toneMatch, int lengthMatch,
			List<String> reasons) {
		this.book = book;
		this.score = score;
		this.genreMatch = genreMatch;
		this.paceMatch = paceMatch;
		this.toneMatch = toneMatch;
		this.lengthMatch = lengthMatch;
		this.reasons = String.join("\n", reasons);
	}

	public Book getBook() {
		return book;
	}

	public int getScore() {
		return score;
	}

	public int getGenreMatch() {
		return genreMatch;
	}

	public int getPaceMatch() {
		return paceMatch;
	}

	public int getToneMatch() {
		return toneMatch;
	}

	public int getLengthMatch() {
		return lengthMatch;
	}

	public List<String> getReasons() {
		return reasons.isEmpty() ? List.of() : List.of(reasons.split("\n"));
	}

}
