package br.com.secretbook.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

class SecurityConfigTest extends IntegrationTest {

	@Test
	void catalogAndQuizArePublic() throws Exception {
		mockMvc.perform(get("/api/books")).andExpect(status().isOk());
		mockMvc.perform(get("/api/quiz")).andExpect(status().isOk());
		mockMvc.perform(get("/api/plans")).andExpect(status().isOk());
	}

	@Test
	void accountAreaRequiresLoginWithProblemDetail() throws Exception {
		mockMvc.perform(get("/api/me/library"))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.title").value("Não autenticado"))
			.andExpect(jsonPath("$.detail").value("Entre na sua conta para continuar."));
	}

	@Test
	void invalidTokenIsRejected() throws Exception {
		mockMvc.perform(get("/api/me/library").with(bearer("token-inventado")))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.detail").value("Sua sessão expirou ou foi encerrada. Entre de novo."));
	}

	@Test
	void adminAreaIsForbiddenForReaders() throws Exception {
		String token = registerReader("leitora-seguranca@example.com");
		mockMvc.perform(get("/api/admin/stats").with(bearer(token)))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.title").value("Acesso negado"));
	}

	@Test
	void pathsOutsideTheApiAreDenied() throws Exception {
		mockMvc.perform(get("/qualquer-coisa")).andExpect(status().isUnauthorized());
	}

	@Test
	void preflightFromAllowedOriginIsAccepted() throws Exception {
		mockMvc.perform(options("/api/books")
				.header(HttpHeaders.ORIGIN, "http://localhost:5173")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization"))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "Authorization"));
	}

	@Test
	void preflightFromUnknownOriginIsRejected() throws Exception {
		mockMvc.perform(options("/api/books")
				.header(HttpHeaders.ORIGIN, "https://site-malicioso.example")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
			.andExpect(status().isForbidden())
			.andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
	}

}
