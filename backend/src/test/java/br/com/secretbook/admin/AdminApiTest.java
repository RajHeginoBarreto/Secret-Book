package br.com.secretbook.admin;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.IntegrationTest;
import br.com.secretbook.auth.AppUser;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class AdminApiTest extends IntegrationTest {

	private static final String NEW_BOOK = """
			{"title": "O Farol das Coisas Perdidas", "synopsis": "Um farol que devolve objetos esquecidos.",
			 "publicationYear": 2025, "pages": 210, "pace": "MODERATE", "tone": "LIGHT", "coverColor": "#2A6F97",
			 "active": true, "authorSlugs": ["lia-monteverde"], "genreSlugs": ["fantasia"],
			 "contentNotes": [], "clues": ["Um farol que não ilumina navios", "Objetos que voltam para casa"]}""";

	private String admin;

	@BeforeEach
	void loginAsAdmin() throws Exception {
		admin = loginAsNewAdmin("admin-painel");
	}

	@Test
	void statsSummarizeThePrototype() throws Exception {
		registerReader("estatistica");
		mockMvc.perform(get("/api/admin/stats").with(bearer(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.totalBooks").value(24))
			.andExpect(jsonPath("$.activeBooks").value(24))
			.andExpect(jsonPath("$.admins").value(1))
			.andExpect(jsonPath("$.readers").value(1));
	}

	@Test
	void createsABookWithGeneratedSlugAndShowsItInThePublicCatalog() throws Exception {
		mockMvc.perform(post("/api/admin/books").with(bearer(admin)).contentType(MediaType.APPLICATION_JSON)
				.content(NEW_BOOK))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.slug").value("o-farol-das-coisas-perdidas"))
			.andExpect(jsonPath("$.coverColor").value("#2a6f97"))
			.andExpect(jsonPath("$.clues.length()").value(2));

		mockMvc.perform(get("/api/books/o-farol-das-coisas-perdidas"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.authors[0].name").value("Lia Monteverde"));

		mockMvc.perform(post("/api/admin/books").with(bearer(admin)).contentType(MediaType.APPLICATION_JSON)
				.content(NEW_BOOK))
			.andExpect(status().isConflict());
	}

	@Test
	void validatesBooks() throws Exception {
		mockMvc.perform(post("/api/admin/books").with(bearer(admin)).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"title": "", "synopsis": "x", "pages": 0, "pace": "FAST", "tone": "LIGHT",
						 "coverColor": "azul", "active": true, "authorSlugs": [], "genreSlugs": ["fantasia"]}"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors[*].field", hasItem("title")))
			.andExpect(jsonPath("$.errors[*].field", hasItem("pages")))
			.andExpect(jsonPath("$.errors[*].field", hasItem("coverColor")))
			.andExpect(jsonPath("$.errors[*].field", hasItem("authorSlugs")));

		mockMvc.perform(post("/api/admin/books").with(bearer(admin)).contentType(MediaType.APPLICATION_JSON)
				.content(NEW_BOOK.replace("lia-monteverde", "autor-fantasma")))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("Um ou mais autores escolhidos não existem."));
	}

	@Test
	void updatesAndDeactivatesBooks() throws Exception {
		String created = mockMvc.perform(post("/api/admin/books").with(bearer(admin))
			.contentType(MediaType.APPLICATION_JSON).content(NEW_BOOK)).andReturn().getResponse().getContentAsString();
		Integer id = JsonPath.read(created, "$.id");

		mockMvc.perform(put("/api/admin/books/{id}", id).with(bearer(admin)).contentType(MediaType.APPLICATION_JSON)
				.content(NEW_BOOK.replace("\"active\": true", "\"active\": false")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.active").value(false));

		mockMvc.perform(get("/api/books/o-farol-das-coisas-perdidas")).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/admin/books").with(bearer(admin)).param("q", "farol"))
			.andExpect(jsonPath("$.totalElements").value(1))
			.andExpect(jsonPath("$.content[0].active").value(false));

		mockMvc.perform(delete("/api/admin/books/{id}", id).with(bearer(admin))).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/admin/books/{id}", id).with(bearer(admin))).andExpect(status().isNotFound());
	}

	@Test
	void booksAlreadyRecommendedCannotBeDeleted() throws Exception {
		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content("""
				{"answers": {"noite-livre": ["aventura"], "historia-que-prende": ["magia"], "tipo-de-magia": ["romantica"],
				 "lugar": ["europa"], "final": ["batalha"], "ritmo": ["rapido"], "clima": ["leve"],
				 "tamanho": ["medio"], "evitar": ["nenhum"]}}""")).andExpect(status().isCreated());
		String body = mockMvc.perform(get("/api/admin/books").with(bearer(admin)).param("q", "feiticeira"))
			.andReturn().getResponse().getContentAsString();
		Integer id = JsonPath.read(body, "$.content[0].id");

		mockMvc.perform(delete("/api/admin/books/{id}", id).with(bearer(admin)))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.startsWith("Este livro já apareceu")));
	}

	@Test
	void managesAuthorsAndProtectsThoseWithBooks() throws Exception {
		String created = mockMvc.perform(post("/api/admin/authors").with(bearer(admin))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"Íris Calado\", \"bio\": \"Fictícia.\"}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.slug").value("iris-calado"))
			.andReturn().getResponse().getContentAsString();
		Integer id = JsonPath.read(created, "$.id");

		mockMvc.perform(delete("/api/admin/authors/{id}", id).with(bearer(admin))).andExpect(status().isNoContent());

		String authors = mockMvc.perform(get("/api/admin/authors").with(bearer(admin)))
			.andExpect(jsonPath("$[?(@.slug == 'lia-monteverde')].bookCount").value(3))
			.andReturn().getResponse().getContentAsString();
		Integer lia = JsonPath.<java.util.List<Integer>>read(authors, "$[?(@.slug == 'lia-monteverde')].id").getFirst();
		mockMvc.perform(delete("/api/admin/authors/{id}", lia).with(bearer(admin))).andExpect(status().isConflict());
	}

	@Test
	void genresUsedByTheQuizCannotBeDeleted() throws Exception {
		String created = mockMvc.perform(post("/api/admin/genres").with(bearer(admin))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"Poesia\"}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.usedByQuiz").value(false))
			.andReturn().getResponse().getContentAsString();
		Integer id = JsonPath.read(created, "$.id");
		mockMvc.perform(delete("/api/admin/genres/{id}", id).with(bearer(admin))).andExpect(status().isNoContent());

		String genres = mockMvc.perform(get("/api/admin/genres").with(bearer(admin)))
			.andReturn().getResponse().getContentAsString();
		Integer romance = JsonPath.<java.util.List<Integer>>read(genres, "$[?(@.slug == 'romance')].id").getFirst();
		mockMvc.perform(delete("/api/admin/genres/{id}", romance).with(bearer(admin))).andExpect(status().isConflict());
	}

	@Test
	void managesUsersButNotTheirOwnAccess() throws Exception {
		String readerToken = registerReader("gerenciada");
		AppUser reader = users.findByUsername("gerenciada").orElseThrow();
		AppUser self = users.findByUsername("admin-painel").orElseThrow();

		mockMvc.perform(get("/api/admin/users").with(bearer(admin)).param("q", "GERENCIADA"))
			.andExpect(jsonPath("$.totalElements").value(1))
			.andExpect(jsonPath("$.content[0].username").value("gerenciada"))
			.andExpect(jsonPath("$.content[0].email").doesNotExist());

		mockMvc.perform(patch("/api/admin/users/{id}", reader.getId()).with(bearer(admin))
				.contentType(MediaType.APPLICATION_JSON).content("{\"enabled\": false}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.enabled").value(false));
		mockMvc.perform(get("/api/auth/me").with(bearer(readerToken))).andExpect(status().isUnauthorized());

		mockMvc.perform(patch("/api/admin/users/{id}", self.getId()).with(bearer(admin))
				.contentType(MediaType.APPLICATION_JSON).content("{\"role\": \"READER\"}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void promotingAReaderGivesAdminAccessImmediately() throws Exception {
		String readerToken = registerReader("promovida");
		AppUser reader = users.findByUsername("promovida").orElseThrow();
		mockMvc.perform(get("/api/admin/stats").with(bearer(readerToken))).andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/admin/users/{id}", reader.getId()).with(bearer(admin))
				.contentType(MediaType.APPLICATION_JSON).content("{\"role\": \"ADMIN\"}"))
			.andExpect(status().isOk());
		mockMvc.perform(get("/api/admin/stats").with(bearer(readerToken))).andExpect(status().isOk());
	}

	@Test
	void recommendationWeightsChangeTheNextResults() throws Exception {
		mockMvc.perform(put("/api/admin/recommendation-settings").with(bearer(admin))
				.contentType(MediaType.APPLICATION_JSON).content("""
						{"genreWeight": 0, "paceWeight": 0, "toneWeight": 0, "lengthWeight": 0,
						 "maxResults": 5, "mixThreshold": 2}"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("Pelo menos um peso precisa ser maior que zero."));

		mockMvc.perform(put("/api/admin/recommendation-settings").with(bearer(admin))
				.contentType(MediaType.APPLICATION_JSON).content("""
						{"genreWeight": 1, "paceWeight": 0, "toneWeight": 0, "lengthWeight": 0,
						 "maxResults": 3, "mixThreshold": 2}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.maxResults").value(3));

		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content("""
				{"answers": {"noite-livre": ["aventura"], "historia-que-prende": ["segredos"],
				 "lugar": ["ilha"], "final": ["revelacao"], "ritmo": ["rapido"], "clima": ["leve"],
				 "tamanho": ["medio"], "evitar": ["nenhum"]}}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.recommendations.length()").value(3));
	}

	@Test
	void listsFeedbackAndSubscriptions() throws Exception {
		String reader = registerReader("opina");
		mockMvc.perform(put("/api/me/feedback/um-verao-em-paraty").with(bearer(reader))
			.contentType(MediaType.APPLICATION_JSON).content("{\"useful\": true, \"comment\": \"Amei\"}"));
		mockMvc.perform(post("/api/me/subscription").with(bearer(reader)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"planSlug\": \"leitor-casual\"}"));

		mockMvc.perform(get("/api/admin/feedback").with(bearer(admin)))
			.andExpect(jsonPath("$.content[0].username").value("opina"))
			.andExpect(jsonPath("$.content[0].bookTitle").value("Um Verão em Paraty"))
			.andExpect(jsonPath("$.content[0].comment").value("Amei"));
		mockMvc.perform(get("/api/admin/subscriptions").with(bearer(admin)))
			.andExpect(jsonPath("$.content[0].username").value("opina"))
			.andExpect(jsonPath("$.content[0].planName").value("Leitor casual"))
			.andExpect(jsonPath("$.content[0].status").value("ACTIVE"));
		mockMvc.perform(get("/api/admin/stats").with(bearer(admin)))
			.andExpect(jsonPath("$.activeSubscriptions").value(1))
			.andExpect(jsonPath("$.usefulFeedback").value(1));
	}

}
