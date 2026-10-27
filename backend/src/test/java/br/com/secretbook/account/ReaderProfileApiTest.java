package br.com.secretbook.account;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.IntegrationTest;
import br.com.secretbook.auth.AppUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class ReaderProfileApiTest extends IntegrationTest {

	private static final String BOOK = "/api/me/library/um-verao-em-paraty";

	@Test
	void readerProfileStartsEmptyAndIsReplacedAsAWhole() throws Exception {
		String token = registerReader("perfil-leitor");

		mockMvc.perform(get("/api/me/reader-profile").with(bearer(token)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.likedGenres.length()").value(0))
			.andExpect(jsonPath("$.dislikedGenres.length()").value(0))
			.andExpect(jsonPath("$.favoriteAuthors.length()").value(0));

		mockMvc.perform(put("/api/me/reader-profile").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"likedGenres": [" Romance ", "fantasia", "ROMANCE", "", "Ficção científica"],
						 "dislikedGenres": ["Terror"],
						 "favoriteAuthors": ["Machado de Assis", "  ", "Clarice Lispector", "machado de assis"]}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.likedGenres.length()").value(3))
			.andExpect(jsonPath("$.likedGenres[0]").value("fantasia"))
			.andExpect(jsonPath("$.likedGenres[1]").value("Ficção científica"))
			.andExpect(jsonPath("$.likedGenres[2]").value("Romance"))
			.andExpect(jsonPath("$.dislikedGenres[0]").value("Terror"))
			.andExpect(jsonPath("$.favoriteAuthors.length()").value(2))
			.andExpect(jsonPath("$.favoriteAuthors[0]").value("Machado de Assis"))
			.andExpect(jsonPath("$.favoriteAuthors[1]").value("Clarice Lispector"));

		mockMvc.perform(put("/api/me/reader-profile").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"likedGenres": ["Suspense"], "dislikedGenres": [],
						 "favoriteAuthors": ["Clarice Lispector", "Machado de Assis"]}"""))
			.andExpect(status().isOk());

		mockMvc.perform(get("/api/me/reader-profile").with(bearer(token)))
			.andExpect(jsonPath("$.likedGenres.length()").value(1))
			.andExpect(jsonPath("$.likedGenres[0]").value("Suspense"))
			.andExpect(jsonPath("$.dislikedGenres.length()").value(0))
			.andExpect(jsonPath("$.favoriteAuthors[0]").value("Clarice Lispector"))
			.andExpect(jsonPath("$.favoriteAuthors[1]").value("Machado de Assis"));
	}

	@Test
	void validatesTheReaderProfile() throws Exception {
		String token = registerReader("perfil-invalido");

		mockMvc.perform(put("/api/me/reader-profile").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"likedGenres": ["Romance"], "dislikedGenres": ["romance"], "favoriteAuthors": []}"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail")
				.value("Um tipo literário não pode estar ao mesmo tempo em \"gosto\" e \"não gosto\": romance."));

		mockMvc.perform(put("/api/me/reader-profile").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"likedGenres": ["%s"], "dislikedGenres": [], "favoriteAuthors": []}""".formatted("x".repeat(61))))
			.andExpect(status().isBadRequest());

		StringBuilder many = new StringBuilder();
		for (int i = 0; i < 31; i++) {
			many.append(i == 0 ? "" : ",").append("\"Autor ").append(i).append('"');
		}
		mockMvc.perform(put("/api/me/reader-profile").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"likedGenres\": [], \"dislikedGenres\": [], \"favoriteAuthors\": [" + many + "]}"))
			.andExpect(status().isBadRequest());

		mockMvc.perform(get("/api/me/reader-profile")).andExpect(status().isUnauthorized());
	}

	@Test
	void onlyBooksMarkedAsReadCanBeReviewed() throws Exception {
		String token = registerReader("comentarista");
		String review = "{\"rating\": 4, \"comment\": \"  Me fez querer viajar.  \"}";

		mockMvc.perform(put(BOOK + "/review").with(bearer(token)).contentType(MediaType.APPLICATION_JSON).content(review))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("Marque o livro como lido para poder comentar."));

		mockMvc.perform(put(BOOK).with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\": \"READING\", \"favorite\": false}")).andExpect(status().isOk());
		mockMvc.perform(put(BOOK + "/review").with(bearer(token)).contentType(MediaType.APPLICATION_JSON).content(review))
			.andExpect(status().isBadRequest());

		mockMvc.perform(put(BOOK).with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\": \"READ\", \"favorite\": true}")).andExpect(status().isOk());
		mockMvc.perform(put(BOOK + "/review").with(bearer(token)).contentType(MediaType.APPLICATION_JSON).content(review))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("READ"))
			.andExpect(jsonPath("$.favorite").value(true))
			.andExpect(jsonPath("$.rating").value(4))
			.andExpect(jsonPath("$.comment").value("Me fez querer viajar."))
			.andExpect(jsonPath("$.reviewedAt").isNotEmpty());

		// A nota é opcional; o comentário não.
		mockMvc.perform(put(BOOK + "/review").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"rating\": null, \"comment\": \"Releitura: ainda melhor.\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.rating").doesNotExist())
			.andExpect(jsonPath("$.comment").value("Releitura: ainda melhor."));
		mockMvc.perform(put(BOOK + "/review").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"rating\": 6, \"comment\": \"   \"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors.length()").value(2));

		mockMvc.perform(get(BOOK).with(bearer(token)))
			.andExpect(jsonPath("$.comment").value("Releitura: ainda melhor."));

		mockMvc.perform(delete(BOOK + "/review").with(bearer(token))).andExpect(status().isNoContent());
		mockMvc.perform(get(BOOK).with(bearer(token)))
			.andExpect(jsonPath("$.status").value("READ"))
			.andExpect(jsonPath("$.comment").doesNotExist())
			.andExpect(jsonPath("$.rating").doesNotExist())
			.andExpect(jsonPath("$.reviewedAt").doesNotExist());
	}

	@Test
	void commentsArePublicAndOnlyShowReadersWhoFinishedTheBook() throws Exception {
		String ana = registerReader("Ana Comenta");
		String bia = registerReader("bia-comenta");
		String carla = registerReader("carla-bloqueada");
		for (String token : new String[] { ana, bia, carla }) {
			mockMvc.perform(put(BOOK).with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\": \"READ\", \"favorite\": false}")).andExpect(status().isOk());
		}
		review(ana, "{\"rating\": 5, \"comment\": \"Perfeito para o verão.\"}");
		review(bia, "{\"comment\": \"Gostei do final.\"}");
		review(carla, "{\"rating\": 1, \"comment\": \"Não deveria aparecer.\"}");

		AppUser blocked = users.findByUsername("carla-bloqueada").orElseThrow();
		blocked.setEnabled(false);
		users.flush();

		// Ler de novo (status deixa de ser READ) esconde o comentário sem apagá-lo.
		String dani = registerReader("dani-relendo");
		mockMvc.perform(put(BOOK).with(bearer(dani)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\": \"READ\", \"favorite\": false}"));
		review(dani, "{\"comment\": \"Vou reler.\"}");
		mockMvc.perform(put(BOOK).with(bearer(dani)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\": \"READING\", \"favorite\": false}")).andExpect(status().isOk());

		mockMvc.perform(get("/api/books/um-verao-em-paraty/comments"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[0].author").value("bia-comenta"))
			.andExpect(jsonPath("$[0].rating").doesNotExist())
			.andExpect(jsonPath("$[0].comment").value("Gostei do final."))
			.andExpect(jsonPath("$[1].author").value("Ana Comenta"))
			.andExpect(jsonPath("$[1].rating").value(5))
			.andExpect(jsonPath("$[1].reviewedAt").isNotEmpty());

		mockMvc.perform(get("/api/books/a-coroa-de-sal/comments"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(0));
		mockMvc.perform(get("/api/books/nao-existe/comments")).andExpect(status().isNotFound());
	}

	@Test
	void removingTheBookFromTheLibraryAlsoRemovesTheComment() throws Exception {
		String token = registerReader("desiste");
		mockMvc.perform(put(BOOK).with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\": \"READ\", \"favorite\": false}"));
		review(token, "{\"comment\": \"Comentário passageiro.\"}");

		mockMvc.perform(put(BOOK).with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\": null, \"favorite\": false}")).andExpect(status().isOk());
		mockMvc.perform(get("/api/books/um-verao-em-paraty/comments"))
			.andExpect(jsonPath("$.length()").value(0));
	}

	private void review(String token, String body) throws Exception {
		mockMvc.perform(put(BOOK + "/review").with(bearer(token)).contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isOk());
	}

}
