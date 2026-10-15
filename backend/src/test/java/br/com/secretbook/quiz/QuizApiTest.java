package br.com.secretbook.quiz;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.IntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class QuizApiTest extends IntegrationTest {

	/** Fantasia forte (com a pergunta condicional), romance como segundo gênero, ritmo rápido, clima leve. */
	private static final String ROMANTASY_ANSWERS = """
			{"answers": {
			  "noite-livre": ["aventura"],
			  "historia-que-prende": ["magia"],
			  "tipo-de-magia": ["romantica"],
			  "lugar": ["europa"],
			  "final": ["batalha"],
			  "ritmo": ["rapido"],
			  "clima": ["leve"],
			  "tamanho": ["medio"],
			  "evitar": ["nenhum"]
			}}""";

	@Test
	void servesQuestionsInOrderWithTheConditionalOne() throws Exception {
		mockMvc.perform(get("/api/quiz"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.questions.length()").value(9))
			.andExpect(jsonPath("$.questions[0].slug").value("noite-livre"))
			.andExpect(jsonPath("$.questions[2].slug").value("tipo-de-magia"))
			.andExpect(jsonPath("$.questions[2].condition.question").value("historia-que-prende"))
			.andExpect(jsonPath("$.questions[2].condition.option").value("magia"))
			.andExpect(jsonPath("$.questions[8].multiple").value(true))
			.andExpect(jsonPath("$.questions[8].options[0].exclusive").value(true));
	}

	@Test
	void computesProfileAndExplainedRecommendations() throws Exception {
		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content(ROMANTASY_ANSWERS))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.profile.key").value("fantasia+romance"))
			.andExpect(jsonPath("$.profile.name").value("Romantasia"))
			.andExpect(jsonPath("$.genres[0].slug").value("fantasia"))
			.andExpect(jsonPath("$.genres[0].points").value(3.5))
			.andExpect(jsonPath("$.genres[1].slug").value("romance"))
			.andExpect(jsonPath("$.preferences.pace").value("FAST"))
			.andExpect(jsonPath("$.preferences.tone").value("LIGHT"))
			.andExpect(jsonPath("$.preferences.length").value("MEDIUM"))
			.andExpect(jsonPath("$.recommendations.length()").value(5))
			.andExpect(jsonPath("$.recommendations[0].position").value(1))
			.andExpect(jsonPath("$.recommendations[0].book.slug").value("a-feiticeira-e-o-cartografo"))
			.andExpect(jsonPath("$.recommendations[0].score").value(100))
			.andExpect(jsonPath("$.recommendations[0].reasons[0]")
				.value("Gêneros Fantasia e Romance, que juntos representam 100% do seu perfil"))
			.andExpect(jsonPath("$.recommendations[0].book.clues.length()").value(3));
	}

	@Test
	void respectsThemesToAvoid() throws Exception {
		String answers = ROMANTASY_ANSWERS.replace("\"evitar\": [\"nenhum\"]", "\"evitar\": [\"violencia\", \"sexo\"]");

		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content(answers))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.preferences.avoid", hasItem("VIOLENCE")))
			.andExpect(jsonPath("$.recommendations[*].book.slug", everyItem(not("o-pacto-das-rosas-de-cinza"))))
			.andExpect(jsonPath("$.recommendations[*].book.slug", everyItem(not("noites-de-lisboa"))))
			// 11 livros do catálogo têm violência ou cenas de sexo.
			.andExpect(jsonPath("$.excludedCount").value(11));
	}

	@Test
	void ignoresTheConditionalQuestionWhenItWasNotUnlocked() throws Exception {
		String answers = ROMANTASY_ANSWERS.replace("\"historia-que-prende\": [\"magia\"]",
				"\"historia-que-prende\": [\"segredos\"]");

		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content(answers))
			.andExpect(status().isCreated())
			// Sem a pergunta condicional: fantasia 2, romance 1, mistério 1.
			.andExpect(jsonPath("$.genres[0].points").value(2.0))
			.andExpect(jsonPath("$.profile.key").value("fantasia"));
	}

	@Test
	void requiresTheConditionalQuestionOnceUnlocked() throws Exception {
		String answers = ROMANTASY_ANSWERS.replace("\"tipo-de-magia\": [\"romantica\"],", "");

		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content(answers))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("Responda à pergunta \"Já que você gosta de magia: qual delas te encanta?\"."));
	}

	@Test
	void rejectsInvalidAnswers() throws Exception {
		String twoOptions = ROMANTASY_ANSWERS.replace("[\"rapido\"]", "[\"rapido\", \"devagar\"]");
		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content(twoOptions))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("Escolha só uma opção em \"Qual ritmo de leitura combina com você?\"."));

		String exclusive = ROMANTASY_ANSWERS.replace("[\"nenhum\"]", "[\"nenhum\", \"terror\"]");
		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content(exclusive))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("A opção \"Nenhum, pode vir tudo\" não pode ser combinada com outras."));

		String unknown = ROMANTASY_ANSWERS.replace("[\"medio\"]", "[\"gigante\"]");
		mockMvc.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content(unknown))
			.andExpect(status().isBadRequest());
	}

	@Test
	void reopensASavedResult() throws Exception {
		String body = mockMvc
			.perform(post("/api/quiz/attempts").contentType(MediaType.APPLICATION_JSON).content(ROMANTASY_ANSWERS))
			.andReturn().getResponse().getContentAsString();
		String id = JsonPath.read(body, "$.id");

		mockMvc.perform(get("/api/quiz/attempts/{id}", id))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(id))
			.andExpect(jsonPath("$.profile.name").value("Romantasia"))
			.andExpect(jsonPath("$.genres[0].points").value(3.5))
			.andExpect(jsonPath("$.recommendations[0].book.slug").value("a-feiticeira-e-o-cartografo"))
			.andExpect(jsonPath("$.recommendations[0].breakdown.genre").value(100));
	}

	@Test
	void unknownAttemptIsNotFound() throws Exception {
		mockMvc.perform(get("/api/quiz/attempts/00000000-0000-0000-0000-000000000000"))
			.andExpect(status().isNotFound());
	}

}
