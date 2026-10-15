package br.com.secretbook.quiz.engine;

import java.util.List;

/**
 * @param excludedByAvoid livros descartados por terem algum tema que o leitor pediu para evitar
 * @param excludedByHistory livros descartados por já terem sido lidos ou avaliados como "não combina"
 */
public record RecommendationResult(List<Recommendation> recommendations, int excludedByAvoid,
		int excludedByHistory) {
}
