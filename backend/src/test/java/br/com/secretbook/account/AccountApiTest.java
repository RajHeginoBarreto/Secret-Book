package br.com.secretbook.account;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.IntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class AccountApiTest extends IntegrationTest {

	private static final String ROMANTASY_ANSWERS = """
			{"answers": {
			  "noite-livre": ["aventura"], "historia-que-prende": ["magia"], "tipo-de-magia": ["romantica"],
			  "lugar": ["europa"], "final": ["batalha"], "ritmo": ["rapido"], "clima": ["leve"],
			  "tamanho": ["medio"], "evitar": ["nenhum"]
			}}""";

	@Test
	void manageBooksInTheLibrary() throws Exception {
		String token = registerReader("biblioteca");

		mockMvc.perform(get("/api/me/library/um-verao-em-paraty").with(bearer(token)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").doesNotExist())
			.andExpect(jsonPath("$.favorite").value(false));

		mockMvc.perform(put("/api/me/library/um-verao-em-paraty").with(bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\": \"READING\", \"favorite\": true}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("READING"))
			.andExpect(jsonPath("$.favorite").value(true));

		mockMvc.perform(put("/api/me/library/a-coroa-de-sal").with(bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\": null, \"favorite\": true}"))
			.andExpect(status().isOk());

		mockMvc.perform(get("/api/me/library").with(bearer(token)))
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[*].book.slug", hasItem("um-verao-em-paraty")));

		// Sem status e sem favorito, o livro sai da biblioteca.
		mockMvc.perform(put("/api/me/library/a-coroa-de-sal").with(bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\": null, \"favorite\": false}"))
			.andExpect(status().isOk());
		mockMvc.perform(get("/api/me/library").with(bearer(token))).andExpect(jsonPath("$.length()").value(1));
	}

	@Test
	void libraryIsPrivateToEachReader() throws Exception {
		String ana = registerReader("ana-privada");
		String bia = registerReader("bia-privada");
		mockMvc.perform(put("/api/me/library/um-verao-em-paraty").with(bearer(ana))
			.contentType(MediaType.APPLICATION_JSON).content("{\"status\": \"READ\", \"favorite\": false}"));

		mockMvc.perform(get("/api/me/library").with(bearer(bia))).andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void validatesLibraryUpdates() throws Exception {
		String token = registerReader("validacao");
		mockMvc.perform(put("/api/me/library/um-verao-em-paraty").with(bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\": \"READING\"}"))
			.andExpect(status().isBadRequest());
		mockMvc.perform(put("/api/me/library/nao-existe").with(bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"favorite\": true}"))
			.andExpect(status().isNotFound());
	}

	@Test
	void booksAlreadyReadOrRejectedAreNotRecommendedAgain() throws Exception {
		String token = registerReader("refinamento");

		String first = submitQuiz(token);
		String topBook = JsonPath.read(first, "$.recommendations[0].book.slug");
		String secondBook = JsonPath.read(first, "$.recommendations[1].book.slug");
		String attemptId = JsonPath.read(first, "$.id");

		mockMvc.perform(put("/api/me/library/" + topBook).with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\": \"READ\", \"favorite\": false}")).andExpect(status().isOk());
		mockMvc.perform(put("/api/me/feedback/" + secondBook).with(bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"useful\": false, \"comment\": \"Não é meu estilo\", \"attemptId\": \"%s\"}".formatted(attemptId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.comment").value("Não é meu estilo"))
			.andExpect(jsonPath("$.attemptId").value(attemptId));

		String second = submitQuiz(token);
		org.assertj.core.api.Assertions.assertThat(JsonPath.<java.util.List<String>>read(second,
				"$.recommendations[*].book.slug")).doesNotContain(topBook, secondBook);
		org.assertj.core.api.Assertions.assertThat(JsonPath.<Integer>read(second, "$.excludedCount")).isEqualTo(2);

		mockMvc.perform(get("/api/me/feedback").with(bearer(token)))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].useful").value(false));
	}

	@Test
	void quizHistoryBelongsToTheReader() throws Exception {
		String owner = registerReader("historico");
		String stranger = registerReader("curiosa");
		String attemptId = JsonPath.read(submitQuiz(owner), "$.id");

		mockMvc.perform(get("/api/me/quiz-attempts").with(bearer(owner)))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].profileName").value("Romantasia"))
			.andExpect(jsonPath("$[0].recommendedTitles.length()").value(5));

		mockMvc.perform(get("/api/quiz/attempts/" + attemptId).with(bearer(owner))).andExpect(status().isOk());
		mockMvc.perform(get("/api/quiz/attempts/" + attemptId).with(bearer(stranger))).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/quiz/attempts/" + attemptId)).andExpect(status().isNotFound());

		String admin = loginAsNewAdmin("admin-historico");
		mockMvc.perform(get("/api/quiz/attempts/" + attemptId).with(bearer(admin))).andExpect(status().isOk());
	}

	@Test
	void demoSubscriptionLifecycle() throws Exception {
		String token = registerReader("assinante");

		mockMvc.perform(get("/api/me/subscription").with(bearer(token))).andExpect(status().isNoContent());

		mockMvc.perform(post("/api/me/subscription").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"planSlug\": \"leitor-avido\"}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.plan.name").value("Leitor ávido"))
			.andExpect(jsonPath("$.plan.monthlyPriceCents").value(7000))
			.andExpect(jsonPath("$.status").value("ACTIVE"));

		mockMvc.perform(post("/api/me/subscription").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"planSlug\": \"leitor-avido\"}"))
			.andExpect(status().isConflict());

		mockMvc.perform(post("/api/me/subscription").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"planSlug\": \"maratona-literaria\"}"))
			.andExpect(status().isCreated());
		mockMvc.perform(get("/api/me/subscription").with(bearer(token)))
			.andExpect(jsonPath("$.plan.slug").value("maratona-literaria"));

		mockMvc.perform(delete("/api/me/subscription").with(bearer(token))).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/me/subscription").with(bearer(token))).andExpect(status().isNoContent());

		mockMvc.perform(post("/api/me/subscription").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"planSlug\": \"plano-fantasma\"}"))
			.andExpect(status().isNotFound());
	}

	@Test
	void plansArePublic() throws Exception {
		mockMvc.perform(get("/api/plans"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(3))
			.andExpect(jsonPath("$[0].slug").value("leitor-casual"))
			.andExpect(jsonPath("$[*].slug", everyItem(not("plano-fantasma"))));
	}

	private String submitQuiz(String token) throws Exception {
		return mockMvc.perform(post("/api/quiz/attempts").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
			.content(ROMANTASY_ANSWERS)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
	}

}
