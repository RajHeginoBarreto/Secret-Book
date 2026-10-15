package br.com.secretbook.catalog;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class CatalogApiTest extends IntegrationTest {

	@Autowired
	private BookRepository books;

	@Test
	void listsGenresWithActiveBookCount() throws Exception {
		mockMvc.perform(get("/api/genres"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(4))
			.andExpect(jsonPath("$[?(@.slug == 'misterio')].bookCount").value(9))
			.andExpect(jsonPath("$[?(@.slug == 'romance')].name").value("Romance"));
	}

	@Test
	void pagesBooksInAlphabeticalOrder() throws Exception {
		mockMvc.perform(get("/api/books").param("size", "5"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.totalElements").value(24))
			.andExpect(jsonPath("$.totalPages").value(5))
			.andExpect(jsonPath("$.content.length()").value(5))
			.andExpect(jsonPath("$.content[0].title").value("A Bruxa do Brejo Verde"))
			.andExpect(jsonPath("$.content[0].length").value("SHORT"))
			.andExpect(jsonPath("$.content[0].authors[0].name").value("Benedito Saraiva"));
	}

	@Test
	void filtersByGenreWithoutDuplicates() throws Exception {
		mockMvc.perform(get("/api/books").param("genre", "romance").param("size", "48"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.totalElements").value(9))
			.andExpect(jsonPath("$.content[*].genres[*].slug", hasItem("romance")));
	}

	@Test
	void searchesByTitleOrAuthorIgnoringCase() throws Exception {
		mockMvc.perform(get("/api/books").param("q", "MARTE"))
			.andExpect(jsonPath("$.totalElements").value(1))
			.andExpect(jsonPath("$.content[0].slug").value("o-detetive-de-marte"));

		mockMvc.perform(get("/api/books").param("q", "monteverde"))
			.andExpect(jsonPath("$.totalElements").value(3));
	}

	@Test
	void searchTreatsWildcardsAsText() throws Exception {
		mockMvc.perform(get("/api/books").param("q", "%"))
			.andExpect(jsonPath("$.totalElements").value(0));
	}

	@Test
	void bookDetailIncludesSynopsisNotesAndCluesInOrder() throws Exception {
		mockMvc.perform(get("/api/books/segredos-de-seda"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("Segredos de Seda"))
			.andExpect(jsonPath("$.authors[0].slug").value("joaquim-pires"))
			.andExpect(jsonPath("$.authors[1].slug").value("lia-monteverde"))
			.andExpect(jsonPath("$.contentNotes[0]").value("VIOLENCE"))
			.andExpect(jsonPath("$.clues.length()").value(3))
			.andExpect(jsonPath("$.clues[0]").value("Um vestido de noiva roubado"));
	}

	@Test
	void inactiveBooksAreHiddenFromThePublicCatalog() throws Exception {
		Book book = books.findBySlug("protocolo-aurora").orElseThrow();
		book.setActive(false);
		books.flush();

		mockMvc.perform(get("/api/books/protocolo-aurora")).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/books").param("size", "48"))
			.andExpect(jsonPath("$.totalElements").value(23))
			.andExpect(jsonPath("$.content[*].slug", everyItem(not("protocolo-aurora"))));
	}

	@Test
	void unknownBookIsNotFound() throws Exception {
		mockMvc.perform(get("/api/books/nao-existe"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.detail").value("Livro não encontrado."));
	}

	@Test
	void authorPageListsTheirBooks() throws Exception {
		mockMvc.perform(get("/api/authors/lia-monteverde"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Lia Monteverde"))
			.andExpect(jsonPath("$.books.length()").value(3));
	}

}
