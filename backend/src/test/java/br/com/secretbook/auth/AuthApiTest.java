package br.com.secretbook.auth;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.CapturingPasswordResetNotifier;
import br.com.secretbook.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class AuthApiTest extends IntegrationTest {

	@Autowired
	private CapturingPasswordResetNotifier notifier;

	@Test
	void registerCreatesAReaderAndOpensASession() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name": " Ana Leitora ", "email": "Ana@Example.com", "password": "livros2024"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.token").isNotEmpty())
			.andExpect(jsonPath("$.user.name").value("Ana Leitora"))
			.andExpect(jsonPath("$.user.email").value("ana@example.com"))
			.andExpect(jsonPath("$.user.role").value("READER"));
	}

	@Test
	void emailsAreUniqueIgnoringCase() throws Exception {
		registerReader("repetida@example.com");
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name": "Outra", "email": "REPETIDA@example.com", "password": "livros2024"}"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value("Já existe uma conta com este e-mail."));
	}

	@Test
	void rejectsWeakPasswordsAndInvalidEmails() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name": "Ana", "email": "nao-e-email", "password": "somenteletras"}"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors[*].field", hasItem("email")))
			.andExpect(jsonPath("$.errors[?(@.field == 'password')].message").value("deve ter letras e números"));
	}

	@Test
	void loginGivesTheSameAnswerForWrongPasswordAndUnknownEmail() throws Exception {
		registerReader("login@example.com");
		login("LOGIN@example.com", PASSWORD);

		for (String body : new String[] { """
				{"email": "login@example.com", "password": "senha-errada-1"}""", """
				{"email": "ninguem@example.com", "password": "senha-errada-1"}""" }) {
			mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.detail").value("E-mail ou senha incorretos."));
		}
	}

	@Test
	void meAndProfileUpdateUseTheCurrentSession() throws Exception {
		String token = registerReader("perfil@example.com");
		mockMvc.perform(get("/api/auth/me").with(bearer(token)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("perfil@example.com"));

		mockMvc.perform(patch("/api/auth/me").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\": \"Novo Nome\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Novo Nome"));
	}

	@Test
	void logoutRevokesTheTokenImmediately() throws Exception {
		String token = registerReader("sair@example.com");
		mockMvc.perform(post("/api/auth/logout").with(bearer(token))).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/auth/me").with(bearer(token))).andExpect(status().isUnauthorized());
	}

	@Test
	void changingThePasswordClosesOtherSessionsButKeepsTheCurrentOne() throws Exception {
		String current = registerReader("troca@example.com");
		String other = login("troca@example.com", PASSWORD);

		mockMvc.perform(post("/api/auth/password/change").with(bearer(current)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"currentPassword\": \"errada-123\", \"newPassword\": \"nova-senha-456\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("A senha atual está incorreta."));

		mockMvc.perform(post("/api/auth/password/change").with(bearer(current)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"currentPassword\": \"%s\", \"newPassword\": \"nova-senha-456\"}".formatted(PASSWORD)))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/auth/me").with(bearer(current))).andExpect(status().isOk());
		mockMvc.perform(get("/api/auth/me").with(bearer(other))).andExpect(status().isUnauthorized());
		login("troca@example.com", "nova-senha-456");
	}

	@Test
	void passwordResetFlowWorksOnceAndClosesAllSessions() throws Exception {
		String session = registerReader("esqueci@example.com");

		mockMvc.perform(post("/api/auth/password/forgot").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\": \"esqueci@example.com\"}"))
			.andExpect(status().isAccepted());
		String token = notifier.lastTokenFor("esqueci@example.com").orElseThrow();

		String reset = "{\"token\": \"%s\", \"newPassword\": \"recuperada-789\"}".formatted(token);
		mockMvc.perform(post("/api/auth/password/reset").contentType(MediaType.APPLICATION_JSON).content(reset))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/auth/me").with(bearer(session))).andExpect(status().isUnauthorized());
		login("esqueci@example.com", "recuperada-789");

		mockMvc.perform(post("/api/auth/password/reset").contentType(MediaType.APPLICATION_JSON).content(reset))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("Este link de redefinição é inválido ou expirou. Peça um novo link."));
	}

	@Test
	void forgotPasswordDoesNotRevealWhetherTheAccountExists() throws Exception {
		mockMvc.perform(post("/api/auth/password/forgot").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\": \"inexistente@example.com\"}"))
			.andExpect(status().isAccepted())
			.andExpect(jsonPath("$.message")
				.value("Se existir uma conta com este e-mail, enviaremos um link para redefinir a senha."));
	}

	@Test
	void disabledAccountsCannotLogInAndLoseTheirSessions() throws Exception {
		String token = registerReader("bloqueada@example.com");
		AppUser user = users.findByEmail("bloqueada@example.com").orElseThrow();
		user.setEnabled(false);
		users.flush();

		mockMvc.perform(get("/api/auth/me").with(bearer(token))).andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\": \"bloqueada@example.com\", \"password\": \"%s\"}".formatted(PASSWORD)))
			.andExpect(status().isForbidden());
	}

}
