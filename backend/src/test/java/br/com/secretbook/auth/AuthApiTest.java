package br.com.secretbook.auth;

import static org.assertj.core.api.Assertions.assertThat;
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
	void registerCreatesAReaderWithoutEmailAndOpensASession() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"username": "  Ana   Leitora ", "password": "livros2024", "acceptPrivacy": true}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.token").isNotEmpty())
			.andExpect(jsonPath("$.user.username").value("Ana Leitora"))
			.andExpect(jsonPath("$.user.name").value("Ana Leitora"))
			.andExpect(jsonPath("$.user.email").doesNotExist())
			.andExpect(jsonPath("$.user.role").value("READER"));

		AppUser user = users.findByUsername("ana leitora").orElseThrow();
		assertThat(user.getEmail()).isNull();
		assertThat(user.getPrivacyAcceptedAt()).isNotNull();
	}

	@Test
	void registerRequiresAcceptingThePrivacyPolicy() throws Exception {
		for (String consent : new String[] { "false", "null" }) {
			mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"username": "sem-consentimento", "password": "livros2024", "acceptPrivacy": %s}"""
						.formatted(consent)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[?(@.field == 'acceptPrivacy')].message")
					.value("é preciso aceitar a política de privacidade"));
		}
		assertThat(users.existsByUsername("sem-consentimento")).isFalse();
	}

	@Test
	void usernamesAreUniqueIgnoringCase() throws Exception {
		registerReader("Repetida");
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"username": "REPETIDA", "password": "livros2024", "acceptPrivacy": true}"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value("Este nome de usuário já está em uso."));
	}

	@Test
	void rejectsWeakPasswordsAndInvalidUsernames() throws Exception {
		for (String username : new String[] { "ab", "-comeca-com-hifen", "tem@arroba", "x".repeat(41) }) {
			mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"username": "%s", "password": "livros2024", "acceptPrivacy": true}""".formatted(username)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[?(@.field == 'username')].message")
					.value("deve ter de 3 a 40 caracteres: letras, números, espaço, ponto, _ ou -"));
		}
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"username": "Joana_D.Arc-2", "password": "somenteletras", "acceptPrivacy": true}"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors[*].field", hasItem("password")))
			.andExpect(jsonPath("$.errors[?(@.field == 'password')].message").value("deve ter letras e números"));

		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"username": "Conceição 2", "password": "livros2024", "acceptPrivacy": true}"""))
			.andExpect(status().isCreated());
	}

	@Test
	void loginByUsernameGivesTheSameAnswerForWrongPasswordAndUnknownUser() throws Exception {
		registerReader("leitora-login");
		login("LEITORA-LOGIN", PASSWORD);

		for (String body : new String[] { """
				{"username": "leitora-login", "password": "senha-errada-1"}""", """
				{"username": "ninguem", "password": "senha-errada-1"}""" }) {
			mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.detail").value("Nome de usuário ou senha incorretos."));
		}
	}

	@Test
	void legacyAccountsCanStillLogInWithTheirEmail() throws Exception {
		createLegacyReader("antiga", "antiga@example.com");

		String token = login("Antiga@Example.com", PASSWORD);
		mockMvc.perform(get("/api/auth/me").with(bearer(token)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.username").value("antiga"))
			.andExpect(jsonPath("$.email").value("antiga@example.com"));
		login("antiga", PASSWORD);
	}

	@Test
	void meAndProfileUpdateUseTheCurrentSession() throws Exception {
		String token = registerReader("perfil");
		mockMvc.perform(get("/api/auth/me").with(bearer(token)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.username").value("perfil"));

		mockMvc.perform(patch("/api/auth/me").with(bearer(token)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\": \"Novo Nome\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Novo Nome"))
			.andExpect(jsonPath("$.username").value("perfil"));
	}

	@Test
	void logoutRevokesTheTokenImmediately() throws Exception {
		String token = registerReader("sair");
		mockMvc.perform(post("/api/auth/logout").with(bearer(token))).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/auth/me").with(bearer(token))).andExpect(status().isUnauthorized());
	}

	@Test
	void changingThePasswordClosesOtherSessionsButKeepsTheCurrentOne() throws Exception {
		String current = registerReader("troca");
		String other = login("troca", PASSWORD);

		mockMvc.perform(post("/api/auth/password/change").with(bearer(current)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"currentPassword\": \"errada-123\", \"newPassword\": \"nova-senha-456\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("A senha atual está incorreta."));

		mockMvc.perform(post("/api/auth/password/change").with(bearer(current)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"currentPassword\": \"%s\", \"newPassword\": \"nova-senha-456\"}".formatted(PASSWORD)))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/auth/me").with(bearer(current))).andExpect(status().isOk());
		mockMvc.perform(get("/api/auth/me").with(bearer(other))).andExpect(status().isUnauthorized());
		login("troca", "nova-senha-456");
	}

	@Test
	void passwordResetFlowWorksOnceAndClosesAllSessions() throws Exception {
		createLegacyReader("esqueci", "esqueci@example.com");
		String session = login("esqueci", PASSWORD);

		mockMvc.perform(post("/api/auth/password/forgot").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\": \"esqueci@example.com\"}"))
			.andExpect(status().isAccepted());
		String token = notifier.lastTokenFor("esqueci@example.com").orElseThrow();

		String reset = "{\"token\": \"%s\", \"newPassword\": \"recuperada-789\"}".formatted(token);
		mockMvc.perform(post("/api/auth/password/reset").contentType(MediaType.APPLICATION_JSON).content(reset))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/auth/me").with(bearer(session))).andExpect(status().isUnauthorized());
		login("esqueci", "recuperada-789");

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
		String token = registerReader("bloqueada");
		AppUser user = users.findByUsername("bloqueada").orElseThrow();
		user.setEnabled(false);
		users.flush();

		mockMvc.perform(get("/api/auth/me").with(bearer(token))).andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\": \"bloqueada\", \"password\": \"%s\"}".formatted(PASSWORD)))
			.andExpect(status().isForbidden());
	}

}
