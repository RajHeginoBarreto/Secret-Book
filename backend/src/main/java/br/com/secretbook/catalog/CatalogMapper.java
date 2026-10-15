package br.com.secretbook.catalog;

import br.com.secretbook.catalog.dto.AuthorRef;
import br.com.secretbook.catalog.dto.BookDetail;
import br.com.secretbook.catalog.dto.BookSummary;
import br.com.secretbook.catalog.dto.GenreRef;
import java.util.Comparator;
import java.util.List;

/** Converte entidades do catálogo nas respostas da API. */
public final class CatalogMapper {

	private CatalogMapper() {
	}

	public static BookSummary toSummary(Book book) {
		return new BookSummary(book.getSlug(), book.getTitle(), authors(book), genres(book), book.getPages(),
				book.getLength(), book.getPace(), book.getTone(), book.getPublicationYear(), book.getCoverColor());
	}

	public static BookDetail toDetail(Book book) {
		return new BookDetail(book.getSlug(), book.getTitle(), authors(book), genres(book), book.getPages(),
				book.getLength(), book.getPace(), book.getTone(), book.getPublicationYear(), book.getCoverColor(),
				book.getSynopsis(), book.getContentNotes().stream().sorted().toList(), List.copyOf(book.getClues()));
	}

	private static List<AuthorRef> authors(Book book) {
		return book.getAuthors().stream().map(author -> new AuthorRef(author.getSlug(), author.getName())).toList();
	}

	private static List<GenreRef> genres(Book book) {
		return book.getGenres().stream()
			.sorted(Comparator.comparing(Genre::getName))
			.map(genre -> new GenreRef(genre.getSlug(), genre.getName()))
			.toList();
	}

}
