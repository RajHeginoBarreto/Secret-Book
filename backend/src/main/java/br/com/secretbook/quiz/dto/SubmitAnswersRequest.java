package br.com.secretbook.quiz.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * Respostas do quiz: slug da pergunta → slugs das opções escolhidas.
 */
public record SubmitAnswersRequest(@NotNull(message = "é obrigatório") Map<String, List<String>> answers) {
}
