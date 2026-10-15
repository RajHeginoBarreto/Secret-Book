package br.com.secretbook.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(controllers = SecurityConfigTest.PingController.class)
@Import({SecurityConfig.class, SecurityConfigTest.PingController.class})
@TestPropertySource(properties = "secretbook.cors.allowed-origins=http://localhost:5173,https://secretbook.example")
class SecurityConfigTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void apiIsPublicForNow() throws Exception {
		mockMvc.perform(get("/api/test/ping")).andExpect(status().isOk());
	}

	@Test
	void pathsOutsideTheApiAreDenied() throws Exception {
		mockMvc.perform(get("/qualquer-coisa")).andExpect(status().isForbidden());
	}

	@Test
	void preflightFromAllowedOriginIsAccepted() throws Exception {
		mockMvc.perform(options("/api/test/ping")
				.header(HttpHeaders.ORIGIN, "http://localhost:5173")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type"))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "Content-Type"));
	}

	@Test
	void everyConfiguredOriginIsAccepted() throws Exception {
		mockMvc.perform(get("/api/test/ping").header(HttpHeaders.ORIGIN, "https://secretbook.example"))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://secretbook.example"));
	}

	@Test
	void preflightFromUnknownOriginIsRejected() throws Exception {
		mockMvc.perform(options("/api/test/ping")
				.header(HttpHeaders.ORIGIN, "https://site-malicioso.example")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
			.andExpect(status().isForbidden())
			.andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
	}

	@RestController
	static class PingController {

		@GetMapping("/api/test/ping")
		String ping() {
			return "pong";
		}

	}

}
