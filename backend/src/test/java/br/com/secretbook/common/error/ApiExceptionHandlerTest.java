package br.com.secretbook.common.error;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(controllers = ApiExceptionHandlerTest.SampleController.class)
@Import(ApiExceptionHandlerTest.SampleController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApiExceptionHandlerTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void resourceNotFoundBecomesProblemDetail404() throws Exception {
		mockMvc.perform(get("/api/test/books/42"))
			.andExpect(status().isNotFound())
			.andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.status").value(404))
			.andExpect(jsonPath("$.title").value("Recurso não encontrado"))
			.andExpect(jsonPath("$.detail").value("Livro 42 não encontrado."))
			.andExpect(jsonPath("$.instance").value("/api/test/books/42"));
	}

	@Test
	void invalidBodyListsEachFieldError() throws Exception {
		mockMvc.perform(post("/api/test/books")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\": \" \", \"pages\": -1}"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.title").value("Dados inválidos"))
			.andExpect(jsonPath("$.detail").value("Um ou mais campos estão inválidos."))
			.andExpect(jsonPath("$.errors.length()").value(2))
			.andExpect(jsonPath("$.errors[0].field").value("pages"))
			.andExpect(jsonPath("$.errors[0].message").value("deve ser positivo"))
			.andExpect(jsonPath("$.errors[1].field").value("title"))
			.andExpect(jsonPath("$.errors[1].message").value("é obrigatório"));
	}

	@Test
	void malformedJsonIsBadRequestInPortuguese() throws Exception {
		mockMvc.perform(post("/api/test/books")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{ isto não é json"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.title").value("Requisição inválida"))
			.andExpect(jsonPath("$.detail").value("O corpo da requisição está ausente ou mal formatado."));
	}

	@Test
	void wrongPathVariableTypeIsBadRequest() throws Exception {
		mockMvc.perform(get("/api/test/books/abc"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.title").value("Requisição inválida"))
			.andExpect(jsonPath("$.detail").value("O valor 'abc' não é válido para 'id'."));
	}

	@Test
	void unknownApiRouteIsNotFoundInPortuguese() throws Exception {
		mockMvc.perform(get("/api/test/nada-aqui"))
			.andExpect(status().isNotFound())
			.andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.title").value("Recurso não encontrado"))
			.andExpect(jsonPath("$.detail").value("O endereço solicitado não existe."));
	}

	@Test
	void unsupportedMethodIsMethodNotAllowed() throws Exception {
		mockMvc.perform(put("/api/test/books/1"))
			.andExpect(status().isMethodNotAllowed())
			.andExpect(jsonPath("$.title").value("Método não permitido"))
			.andExpect(jsonPath("$.detail").value("O método PUT não é aceito neste endereço."));
	}

	@Test
	void unexpectedErrorHidesInternalDetails() throws Exception {
		mockMvc.perform(get("/api/test/boom"))
			.andExpect(status().isInternalServerError())
			.andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.title").value("Erro interno"))
			.andExpect(jsonPath("$.detail").value("Ocorreu um erro inesperado. Tente novamente mais tarde."))
			.andExpect(content().string(not(containsString("senha-do-banco"))));
	}

	record NewBook(@NotBlank(message = "é obrigatório") String title, @Positive(message = "deve ser positivo") int pages) {
	}

	@RestController
	static class SampleController {

		@GetMapping("/api/test/books/{id}")
		String findBook(@PathVariable long id) {
			throw new ResourceNotFoundException("Livro " + id + " não encontrado.");
		}

		@PostMapping("/api/test/books")
		NewBook createBook(@Valid @RequestBody NewBook book) {
			return book;
		}

		@GetMapping("/api/test/boom")
		String boom() {
			throw new IllegalStateException("falha ao conectar com senha-do-banco");
		}

	}

}
