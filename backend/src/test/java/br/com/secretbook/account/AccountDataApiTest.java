package br.com.secretbook.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.IntegrationTest;
import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

/** Direitos do titular (LGPD): exportar os dados e excluir a conta. */
class AccountDataApiTest extends IntegrationTest {

	private static final String QUIZ_ANSWERS = """
			{"answers": {
			  "noite-livre": ["aventura"], "historia-que-prende": ["magia"], "tipo-de-magia": ["romantica"],
			  "lugar": ["europa"], "final": ["batalha"], "ritmo": ["rapido"], "clima": ["leve"],
			  "tamanho": ["medio"], "evitar": ["nenhum"]
			}}""";

	@Autowired
	private JdbcTemplate jdbc;

	@Test
	void exportContainsEverythingStoredAboutTheReader() throws Exception {
		String token = registerReader("exporta");
		fillAccount(token);

		mockMvc.perform(get("/api/me/export").with(bearer(token)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.user.username").value("exporta"))
			.andExpect(jsonPath("$.user.email").doesNotExist())
			.andExpect(jsonPath("$.privacyAcceptedAt").isNotEmpty())
			.andExpect(jsonPath("$.readerProfile.likedGenres[0]").value("Romance"))
			.andExpect(jsonPath("$.readerProfile.favoriteAuthors[0]").value("Lia Monteverde"))
			.andExpect(jsonPath("$.library.length()").value(1))
			.andExpect(jsonPath("$.library[0].book.slug").value("um-verao-em-paraty"))
			.andExpect(jsonPath("$.library[0].comment").value("Leitura leve."))
			.andExpect(jsonPath("$.feedback.length()").value(1))
			.andExpect(jsonPath("$.quizAttempts.length()").value(1))
			.andExpect(jsonPath("$.subscription.plan.slug").value("leitor-casual"));

		String other = registerReader("exporta-vazio");
		mockMvc.perform(get("/api/me/export").with(bearer(other)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.library.length()").value(0))
			.andExpect(jsonPath("$.subscription").doesNotExist());

		mockMvc.perform(get("/api/me/export")).andExpect(status().isUnauthorized());
	}

	@Test
	void deletingTheAccountRequiresThePasswordAndRemovesAllData() throws Exception {
		String token = registerReader("apaga-tudo");
		Long userId = users.findByUsername("apaga-tudo").orElseThrow().getId();
		String attemptId = fillAccount(token);

		mockMvc.perform(delete("/api/me").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"password\": \"senha-errada-1\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("A senha está incorreta."));
		mockMvc.perform(delete("/api/me").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isBadRequest());

		mockMvc.perform(delete("/api/me").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"password\": \"%s\"}".formatted(PASSWORD)))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/auth/me").with(bearer(token))).andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\": \"apaga-tudo\", \"password\": \"%s\"}".formatted(PASSWORD)))
			.andExpect(status().isUnauthorized());

		for (String table : new String[] { "app_user where id", "user_session where user_id",
				"user_book where user_id", "recommendation_feedback where user_id", "subscription where user_id",
				"reader_genre_preference where user_id", "reader_favorite_author where user_id" }) {
			assertThat(jdbc.queryForObject("select count(*) from " + table + " = ?", Long.class, userId))
				.as(table).isZero();
		}
		// A tentativa do quiz continua nas estatísticas, mas sem vínculo com a pessoa.
		assertThat(jdbc.queryForObject("select user_id from quiz_attempt where id = ?", Long.class,
				UUID.fromString(attemptId))).isNull();

		// O nome de usuário fica livre de novo.
		registerReader("apaga-tudo");
	}

	/** Preenche perfil, biblioteca (com comentário), avaliação, quiz e assinatura; devolve o id da tentativa. */
	private String fillAccount(String token) throws Exception {
		mockMvc.perform(put("/api/me/reader-profile").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"likedGenres": ["Romance"], "dislikedGenres": ["Terror"], "favoriteAuthors": ["Lia Monteverde"]}"""))
			.andExpect(status().isOk());
		mockMvc.perform(put("/api/me/library/um-verao-em-paraty").with(bearer(token))
			.contentType(MediaType.APPLICATION_JSON).content("{\"status\": \"READ\", \"favorite\": true}"))
			.andExpect(status().isOk());
		mockMvc.perform(put("/api/me/library/um-verao-em-paraty/review").with(bearer(token))
			.contentType(MediaType.APPLICATION_JSON).content("{\"rating\": 5, \"comment\": \"Leitura leve.\"}"))
			.andExpect(status().isOk());
		mockMvc.perform(put("/api/me/feedback/a-coroa-de-sal").with(bearer(token))
			.contentType(MediaType.APPLICATION_JSON).content("{\"useful\": true}"))
			.andExpect(status().isOk());
		String attempt = mockMvc.perform(post("/api/quiz/attempts").with(bearer(token))
			.contentType(MediaType.APPLICATION_JSON).content(QUIZ_ANSWERS))
			.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
		mockMvc.perform(post("/api/me/subscription").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
			.content("{\"planSlug\": \"leitor-casual\"}")).andExpect(status().isCreated());
		return JsonPath.read(attempt, "$.id");
	}

}
