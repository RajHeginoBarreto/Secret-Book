package br.com.secretbook.catalog;

import br.com.secretbook.catalog.dto.AuthorDetail;
import br.com.secretbook.catalog.dto.BookDetail;
import br.com.secretbook.catalog.dto.BookSummary;
import br.com.secretbook.catalog.dto.GenreResponse;
import br.com.secretbook.common.PageResponse;
import br.com.secretbook.common.error.ResourceNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Consultas públicas do catálogo: só livros ativos aparecem. */
@Service
@Transactional(readOnly = true)
public class CatalogService {

	public static final int MAX_PAGE_SIZE = 48;

	private final BookRepository books;

	private final AuthorRepository authors;

	private final GenreRepository genres;

	public CatalogService(BookRepository books, AuthorRepository authors, GenreRepository genres) {
		this.books = books;
		this.authors = authors;
		this.genres = genres;
	}

	public List<GenreResponse> listGenres() {
		Map<String, Long> counts = genres.countActiveBooksBySlug().stream()
			.collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
		return genres.findAllByOrderByNameAsc().stream()
			.map(genre -> new GenreResponse(genre.getSlug(), genre.getName(), genre.getDescription(),
					counts.getOrDefault(genre.getSlug(), 0L)))
			.toList();
	}

	public PageResponse<BookSummary> searchBooks(String genre, String query, int page, int size) {
		Specification<Book> spec = BookSpecifications.active();
		if (StringUtils.hasText(genre)) {
			spec = spec.and(BookSpecifications.inGenre(genre.trim()));
		}
		if (StringUtils.hasText(query)) {
			spec = spec.and(BookSpecifications.matches(query));
		}
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE),
				Sort.by("title").and(Sort.by("id")));
		return PageResponse.of(books.findAll(spec, pageable), CatalogMapper::toSummary);
	}

	public BookDetail getBook(String slug) {
		return books.findBySlugAndActiveTrue(slug)
			.map(CatalogMapper::toDetail)
			.orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado."));
	}

	public AuthorDetail getAuthor(String slug) {
		Author author = authors.findBySlug(slug)
			.orElseThrow(() -> new ResourceNotFoundException("Autor não encontrado."));
		List<BookSummary> authorBooks = books.findActiveByAuthor(author).stream().map(CatalogMapper::toSummary).toList();
		return new AuthorDetail(author.getSlug(), author.getName(), author.getBio(), authorBooks);
	}

}
