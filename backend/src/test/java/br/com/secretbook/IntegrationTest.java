package br.com.secretbook;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.secretbook.auth.AppUser;
import br.com.secretbook.auth.AppUserRepository;
import br.com.secretbook.auth.Role;
import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base dos testes de integração: aplicação completa + PostgreSQL em contêiner (compartilhado entre as classes).
 * Cada teste roda em uma transação desfeita no final, então os dados demonstrativos do Flyway ficam intactos.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
public abstract class IntegrationTest {

	protected static final String PASSWORD = "senha-forte-123";

	@Autowired
	protected MockMvc mockMvc;

	@Autowired
	protected AppUserRepository users;

	@Autowired
	protected PasswordEncoder passwordEncoder;

	/** Cria uma conta de leitor pela API e devolve o token da sessão aberta. */
	protected String registerReader(String email) throws Exception {
		String body = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"name": "Leitora Teste", "email": "%s", "password": "%s"}""".formatted(email, PASSWORD)))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.token");
	}

	/** Cria um administrador direto no banco e faz login pela API. */
	protected String loginAsNewAdmin(String email) throws Exception {
		users.save(new AppUser("Admin Teste", email, passwordEncoder.encode(PASSWORD), Role.ADMIN));
		return login(email, PASSWORD);
	}

	protected String login(String email, String password) throws Exception {
		String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "%s", "password": "%s"}""".formatted(email, password)))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.token");
	}

	protected static RequestPostProcessor bearer(String token) {
		return request -> {
			request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
			return request;
		};
	}

}
