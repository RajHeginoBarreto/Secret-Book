package br.com.secretbook.catalog;

import br.com.secretbook.catalog.dto.AuthorDetail;
import br.com.secretbook.catalog.dto.BookDetail;
import br.com.secretbook.catalog.dto.BookSummary;
import br.com.secretbook.catalog.dto.GenreResponse;
import br.com.secretbook.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Catálogo", description = "Livros, autores e gêneros (dados demonstrativos)")
public class CatalogController {

	private final CatalogService catalog;

	public CatalogController(CatalogService catalog) {
		this.catalog = catalog;
	}

	@GetMapping("/genres")
	@Operation(summary = "Lista os gêneros com a quantidade de livros de cada um")
	public List<GenreResponse> genres() {
		return catalog.listGenres();
	}

	@GetMapping("/books")
	@Operation(summary = "Busca livros por gênero e por texto (título ou autor), em ordem alfabética")
	public PageResponse<BookSummary> books(@RequestParam(required = false) String genre,
			@RequestParam(required = false) String q, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "12") int size) {
		return catalog.searchBooks(genre, q, page, size);
	}

	@GetMapping("/books/{slug}")
	@Operation(summary = "Detalhes de um livro, com sinopse, temas sensíveis e pistas")
	public BookDetail book(@PathVariable String slug) {
		return catalog.getBook(slug);
	}

	@GetMapping("/authors/{slug}")
	@Operation(summary = "Autor e seus livros")
	public AuthorDetail author(@PathVariable String slug) {
		return catalog.getAuthor(slug);
	}

}
