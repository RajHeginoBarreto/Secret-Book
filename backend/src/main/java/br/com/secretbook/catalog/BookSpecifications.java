package br.com.secretbook.catalog;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

/** Filtros combináveis da busca de livros. Subconsultas evitam linhas duplicadas na paginação. */
public final class BookSpecifications {

	private BookSpecifications() {
	}

	public static Specification<Book> active() {
		return (root, query, cb) -> cb.isTrue(root.get("active"));
	}

	public static Specification<Book> inGenre(String genreSlug) {
		return (root, query, cb) -> {
			Subquery<Long> sub = query.subquery(Long.class);
			Root<Book> book = sub.correlate(root);
			Join<Book, Genre> genre = book.join("genres");
			sub.select(cb.literal(1L)).where(cb.equal(genre.get("slug"), genreSlug));
			return cb.exists(sub);
		};
	}

	/** Busca o texto no título ou no nome de algum autor, sem diferenciar maiúsculas. */
	public static Specification<Book> matches(String text) {
		String pattern = "%" + escapeLike(text.trim().toLowerCase(Locale.ROOT)) + "%";
		return (root, query, cb) -> {
			Subquery<Long> sub = query.subquery(Long.class);
			Root<Book> book = sub.correlate(root);
			Join<Book, Author> author = book.join("authors");
			sub.select(cb.literal(1L)).where(cb.like(cb.lower(author.get("name")), pattern, '\\'));
			return cb.or(cb.like(cb.lower(root.get("title")), pattern, '\\'), cb.exists(sub));
		};
	}

	private static String escapeLike(String text) {
		return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}

}
