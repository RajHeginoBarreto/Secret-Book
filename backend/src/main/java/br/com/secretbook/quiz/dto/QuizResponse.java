package br.com.secretbook.quiz.dto;

import java.util.List;

public record QuizResponse(List<Question> questions) {

	/**
	 * @param condition quando preenchida, a pergunta só aparece se a opção indicada foi escolhida
	 */
	public record Question(String slug, String text, String helpText, boolean multiple, boolean required,
			Condition condition, List<Option> options) {
	}

	public record Condition(String question, String option) {
	}

	public record Option(String slug, String text, boolean exclusive) {
	}

}
