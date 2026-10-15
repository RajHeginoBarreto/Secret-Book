package br.com.secretbook.quiz;

import br.com.secretbook.quiz.dto.QuizResponse;
import br.com.secretbook.quiz.dto.QuizResultResponse;
import br.com.secretbook.quiz.dto.SubmitAnswersRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import br.com.secretbook.auth.AuthenticatedUser;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quiz")
@Tag(name = "Quiz", description = "Quiz literário e recomendações explicáveis")
public class QuizController {

	private final QuizService quiz;

	public QuizController(QuizService quiz) {
		this.quiz = quiz;
	}

	@GetMapping
	@Operation(summary = "Perguntas do quiz, na ordem, com as condições das perguntas condicionais")
	public QuizResponse questions() {
		return quiz.getQuiz();
	}

	@PostMapping("/attempts")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Envia as respostas e recebe o perfil e as recomendações justificadas")
	public QuizResultResponse submit(@Valid @RequestBody SubmitAnswersRequest request,
			@AuthenticationPrincipal AuthenticatedUser viewer) {
		return quiz.toResult(quiz.submit(request.answers(), viewer));
	}

	@GetMapping("/attempts/{id}")
	@Operation(summary = "Reabre o resultado de uma tentativa (as de uma conta, só o dono ou um administrador)")
	public QuizResultResponse attempt(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser viewer) {
		return quiz.toResult(quiz.findAttempt(id, viewer));
	}

}
