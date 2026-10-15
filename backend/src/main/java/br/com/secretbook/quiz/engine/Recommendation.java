package br.com.secretbook.quiz.engine;

import java.util.List;

/**
 * Um livro recomendado, com a nota final (0 a 100), a nota de cada critério e as justificativas em português.
 */
public record Recommendation(Candidate candidate, int score, Breakdown breakdown, List<String> reasons) {

	/** Quanto (0 a 100) o livro combina com o leitor em cada critério, antes de aplicar os pesos. */
	public record Breakdown(int genre, int pace, int tone, int length) {
	}

}
