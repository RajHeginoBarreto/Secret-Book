package br.com.secretbook.quiz.engine;

/** Peso de cada critério na nota final. Só a proporção entre eles importa. */
public record RecommendationWeights(double genre, double pace, double tone, double length) {

	public RecommendationWeights {
		if (genre < 0 || pace < 0 || tone < 0 || length < 0) {
			throw new IllegalArgumentException("Os pesos não podem ser negativos.");
		}
		if (genre + pace + tone + length <= 0) {
			throw new IllegalArgumentException("Pelo menos um peso precisa ser maior que zero.");
		}
	}

	double total() {
		return genre + pace + tone + length;
	}

}
