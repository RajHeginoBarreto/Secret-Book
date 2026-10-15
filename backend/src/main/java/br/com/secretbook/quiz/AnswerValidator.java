package br.com.secretbook.quiz;

import br.com.secretbook.common.error.ApiException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Confere as respostas contra as perguntas do quiz e devolve as opções escolhidas, na ordem das perguntas.
 *
 * <p>Regras: perguntas obrigatórias visíveis precisam de resposta; perguntas de escolha única aceitam uma opção;
 * opções exclusivas ("Nenhum") não se combinam com outras. Perguntas condicionais só contam quando a opção que as
 * libera foi escolhida; respostas para perguntas que não estavam visíveis são ignoradas.
 */
final class AnswerValidator {

	private AnswerValidator() {
	}

	static List<QuizOption> validate(List<QuizQuestion> questions, Map<String, List<String>> answers) {
		Set<String> known = questions.stream().map(QuizQuestion::getSlug).collect(Collectors.toSet());
		for (String slug : answers.keySet()) {
			if (!known.contains(slug)) {
				throw ApiException.badRequest("Pergunta desconhecida: " + slug + ".");
			}
		}

		Set<Long> chosenIds = new HashSet<>();
		List<QuizOption> chosen = new ArrayList<>();
		for (QuizQuestion question : questions) {
			QuizOption condition = question.getConditionOption();
			if (condition != null && !chosenIds.contains(condition.getId())) {
				continue;
			}

			Set<String> slugs = new LinkedHashSet<>();
			answers.getOrDefault(question.getSlug(), List.of()).stream().filter(Objects::nonNull).forEach(slugs::add);
			if (slugs.isEmpty()) {
				if (question.isRequired()) {
					throw ApiException.badRequest("Responda à pergunta \"" + question.getText() + "\".");
				}
				continue;
			}
			if (!question.isMultiple() && slugs.size() > 1) {
				throw ApiException.badRequest("Escolha só uma opção em \"" + question.getText() + "\".");
			}

			Map<String, QuizOption> options = question.getOptions().stream()
				.collect(Collectors.toMap(QuizOption::getSlug, Function.identity()));
			List<QuizOption> selected = new ArrayList<>();
			for (String slug : slugs) {
				QuizOption option = options.get(slug);
				if (option == null) {
					throw ApiException.badRequest("Opção inválida para a pergunta \"" + question.getText() + "\".");
				}
				selected.add(option);
			}
			if (selected.size() > 1) {
				selected.stream().filter(QuizOption::isExclusive).findFirst().ifPresent(exclusive -> {
					throw ApiException.badRequest(
							"A opção \"" + exclusive.getText() + "\" não pode ser combinada com outras.");
				});
			}

			selected.forEach(option -> chosenIds.add(option.getId()));
			chosen.addAll(selected);
		}
		return chosen;
	}

}
