package br.com.secretbook.admin;

import br.com.secretbook.admin.dto.AdminDtos.AuthorRequest;
import br.com.secretbook.admin.dto.AdminDtos.AuthorRow;
import br.com.secretbook.admin.dto.AdminDtos.BookRequest;
import br.com.secretbook.admin.dto.AdminDtos.BookResponse;
import br.com.secretbook.admin.dto.AdminDtos.BookRow;
import br.com.secretbook.admin.dto.AdminDtos.GenreRequest;
import br.com.secretbook.admin.dto.AdminDtos.GenreRow;
import br.com.secretbook.catalog.Author;
import br.com.secretbook.catalog.AuthorRepository;
import br.com.secretbook.catalog.Book;
import br.com.secretbook.catalog.BookRepository;
import br.com.secretbook.catalog.BookSpecifications;
import br.com.secretbook.catalog.ContentNote;
import br.com.secretbook.catalog.Genre;
import br.com.secretbook.catalog.GenreRepository;
import br.com.secretbook.common.PageResponse;
import br.com.secretbook.common.Slugs;
import br.com.secretbook.common.error.ApiException;
import br.com.secretbook.common.error.ResourceNotFoundException;
import br.com.secretbook.quiz.QuizAttemptRepository;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Cadastro do catálogo pelo painel: livros (inclusive inativos), autores e gêneros. */
@Service
@Transactional
public class AdminCatalogService {

	private final BookRepository books;

	private final AuthorRepository authors;

	private final GenreRepository genres;

	private final QuizAttemptRepository attempts;

	public AdminCatalogService(BookRepository books, AuthorRepository authors, GenreRepository genres,
			QuizAttemptRepository attempts) {
		this.books = books;
		this.authors = authors;
		this.genres = genres;
		this.attempts = attempts;
	}

	// ===== Livros =====

	@Transactional(readOnly = true)
	public PageResponse<BookRow> searchBooks(String query, int page, int size) {
		Specification<Book> spec = StringUtils.hasText(query) ? BookSpecifications.matches(query)
				: Specification.unrestricted();
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
				Sort.by("title").and(Sort.by("id")));
		return PageResponse.of(books.findAll(spec, pageable), AdminCatalogService::toRow);
	}

	@Transactional(readOnly = true)
	public BookResponse getBook(Long id) {
		return toResponse(findBook(id));
	}

	public BookResponse createBook(BookRequest request) {
		String slug = slugFor(request.slug(), request.title());
		if (books.existsBySlug(slug)) {
			throw ApiException.conflict("Já existe um livro com o identificador \"" + slug + "\".");
		}
		Book book = new Book(slug, request.title().trim());
		apply(book, request);
		return toResponse(books.saveAndFlush(book));
	}

	public BookResponse updateBook(Long id, BookRequest request) {
		Book book = findBook(id);
		String slug = slugFor(request.slug(), request.title());
		if (!slug.equals(book.getSlug()) && books.existsBySlug(slug)) {
			throw ApiException.conflict("Já existe um livro com o identificador \"" + slug + "\".");
		}
		book.setSlug(slug);
		book.setTitle(request.title().trim());
		apply(book, request);
		return toResponse(books.saveAndFlush(book));
	}

	/** Livros que já apareceram em recomendações ficam no histórico dos leitores: só podem ser desativados. */
	public void deleteBook(Long id) {
		Book book = findBook(id);
		if (attempts.wasRecommended(book.getId())) {
			throw ApiException.conflict("Este livro já apareceu em recomendações do quiz e não pode ser excluído. "
					+ "Desative-o para tirá-lo do catálogo.");
		}
		books.delete(book);
	}

	private void apply(Book book, BookRequest request) {
		book.setSynopsis(request.synopsis().trim());
		book.setPublicationYear(request.publicationYear());
		book.setPages(request.pages());
		book.setPace(request.pace());
		book.setTone(request.tone());
		book.setCoverColor(request.coverColor().toLowerCase());
		book.setActive(request.active());
		book.setAuthors(resolveAuthors(request.authorSlugs()));
		book.setGenres(resolveGenres(request.genreSlugs()));
		book.setContentNotes(request.contentNotes() == null || request.contentNotes().isEmpty()
				? EnumSet.noneOf(ContentNote.class) : EnumSet.copyOf(request.contentNotes()));
		book.setClues(request.clues() == null ? List.of() : request.clues().stream().map(String::trim).toList());
	}

	private List<Author> resolveAuthors(List<String> slugs) {
		List<String> distinct = slugs.stream().distinct().toList();
		Map<String, Author> found = authors.findBySlugIn(distinct).stream()
			.collect(Collectors.toMap(Author::getSlug, Function.identity()));
		if (found.size() != distinct.size()) {
			throw ApiException.badRequest("Um ou mais autores escolhidos não existem.");
		}
		return distinct.stream().map(found::get).toList();
	}

	private Set<Genre> resolveGenres(Set<String> slugs) {
		List<Genre> found = genres.findBySlugIn(slugs);
		if (found.size() != slugs.size()) {
			throw ApiException.badRequest("Um ou mais gêneros escolhidos não existem.");
		}
		return new LinkedHashSet<>(found);
	}

	private Book findBook(Long id) {
		return books.findById(id).orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado."));
	}

	private static BookRow toRow(Book book) {
		return new BookRow(book.getId(), book.getSlug(), book.getTitle(),
				book.getAuthors().stream().map(Author::getName).toList(),
				book.getGenres().stream().map(Genre::getName).sorted().toList(), book.isActive(), book.getUpdatedAt());
	}

	private static BookResponse toResponse(Book book) {
		return new BookResponse(book.getId(), book.getSlug(), book.getTitle(), book.getSynopsis(),
				book.getPublicationYear(), book.getPages(), book.getPace(), book.getTone(), book.getCoverColor(),
				book.isActive(), book.getAuthors().stream().map(Author::getSlug).toList(),
				book.getGenres().stream().map(Genre::getSlug).sorted().toList(),
				book.getContentNotes().stream().sorted().toList(), List.copyOf(book.getClues()), book.getCreatedAt(),
				book.getUpdatedAt());
	}

	// ===== Autores =====

	@Transactional(readOnly = true)
	public List<AuthorRow> listAuthors() {
		Map<String, Long> counts = toCounts(authors.countBooksBySlug());
		return authors.findAllByOrderByNameAsc().stream()
			.map(author -> toRow(author, counts.getOrDefault(author.getSlug(), 0L)))
			.toList();
	}

	public AuthorRow createAuthor(AuthorRequest request) {
		String slug = slugFor(request.slug(), request.name());
		if (authors.existsBySlug(slug)) {
			throw ApiException.conflict("Já existe um autor com o identificador \"" + slug + "\".");
		}
		Author author = authors.save(new Author(slug, request.name().trim(), trimToEmpty(request.bio())));
		return toRow(author, 0);
	}

	public AuthorRow updateAuthor(Long id, AuthorRequest request) {
		Author author = authors.findById(id).orElseThrow(() -> new ResourceNotFoundException("Autor não encontrado."));
		String slug = slugFor(request.slug(), request.name());
		if (!slug.equals(author.getSlug()) && authors.existsBySlug(slug)) {
			throw ApiException.conflict("Já existe um autor com o identificador \"" + slug + "\".");
		}
		author.setSlug(slug);
		author.setName(request.name().trim());
		author.setBio(trimToEmpty(request.bio()));
		Map<String, Long> counts = toCounts(authors.countBooksBySlug());
		return toRow(author, counts.getOrDefault(slug, 0L));
	}

	public void deleteAuthor(Long id) {
		Author author = authors.findById(id).orElseThrow(() -> new ResourceNotFoundException("Autor não encontrado."));
		if (books.existsByAuthor(author)) {
			throw ApiException.conflict("Este autor tem livros no catálogo. Remova-o dos livros antes de excluir.");
		}
		authors.delete(author);
	}

	private static AuthorRow toRow(Author author, long bookCount) {
		return new AuthorRow(author.getId(), author.getSlug(), author.getName(), author.getBio(), bookCount);
	}

	// ===== Gêneros =====

	@Transactional(readOnly = true)
	public List<GenreRow> listGenres() {
		Map<String, Long> counts = toCounts(genres.countAllBooksBySlug());
		return genres.findAllByOrderByNameAsc().stream()
			.map(genre -> toRow(genre, counts.getOrDefault(genre.getSlug(), 0L)))
			.toList();
	}

	public GenreRow createGenre(GenreRequest request) {
		String slug = slugFor(request.slug(), request.name());
		if (genres.existsBySlug(slug)) {
			throw ApiException.conflict("Já existe um gênero com o identificador \"" + slug + "\".");
		}
		Genre genre = genres.save(new Genre(slug, request.name().trim(), trimToEmpty(request.description())));
		return toRow(genre, 0);
	}

	/** Só nome e descrição mudam: o slug é usado como referência pelas opções do quiz. */
	public GenreRow updateGenre(Long id, GenreRequest request) {
		Genre genre = genres.findById(id).orElseThrow(() -> new ResourceNotFoundException("Gênero não encontrado."));
		genre.setName(request.name().trim());
		genre.setDescription(trimToEmpty(request.description()));
		Map<String, Long> counts = toCounts(genres.countAllBooksBySlug());
		return toRow(genre, counts.getOrDefault(genre.getSlug(), 0L));
	}

	public void deleteGenre(Long id) {
		Genre genre = genres.findById(id).orElseThrow(() -> new ResourceNotFoundException("Gênero não encontrado."));
		if (books.existsByGenre(genre)) {
			throw ApiException.conflict("Este gênero tem livros no catálogo. Troque o gênero desses livros antes.");
		}
		if (genres.isUsedByQuiz(genre.getSlug())) {
			throw ApiException.conflict("Este gênero é usado pelas perguntas do quiz e não pode ser excluído.");
		}
		genres.delete(genre);
	}

	private GenreRow toRow(Genre genre, long bookCount) {
		return new GenreRow(genre.getId(), genre.getSlug(), genre.getName(), genre.getDescription(), bookCount,
				genres.isUsedByQuiz(genre.getSlug()));
	}

	// ===== Utilitários =====

	/** Usa o slug informado ou gera um a partir do nome/título. */
	private static String slugFor(String requested, String fallbackText) {
		String slug = StringUtils.hasText(requested) ? requested.trim() : Slugs.of(fallbackText);
		if (slug.isEmpty()) {
			throw ApiException.badRequest("Não foi possível gerar um identificador: use letras ou números no nome.");
		}
		return slug;
	}

	private static String trimToEmpty(String text) {
		return text == null ? "" : text.trim();
	}

	private static Map<String, Long> toCounts(List<Object[]> rows) {
		return rows.stream().collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
	}

}
