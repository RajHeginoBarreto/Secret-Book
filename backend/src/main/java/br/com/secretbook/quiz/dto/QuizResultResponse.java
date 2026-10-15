package br.com.secretbook.quiz.dto;

import br.com.secretbook.catalog.ContentNote;
import br.com.secretbook.catalog.LengthCategory;
import br.com.secretbook.catalog.Pace;
import br.com.secretbook.catalog.Tone;
import br.com.secretbook.catalog.dto.BookDetail;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Resultado de uma tentativa do quiz.
 *
 * @param excludedCount livros que ficaram de fora por temas a evitar ou por já terem sido lidos/descartados
 */
public record QuizResultResponse(UUID id, Instant createdAt, Profile profile, List<GenreScore> genres,
		Preferences preferences, List<RecommendationItem> recommendations, int excludedCount) {

	public record Profile(String key, String name, String description) {
	}

	/**
	 * @param points soma dos pesos das respostas que apontaram para o gênero
	 * @param percent fração dos pontos de gênero, de 0 a 100 (não é probabilidade de gostar)
	 */
	public record GenreScore(String slug, String name, double points, int percent) {
	}

	/** Preferências deduzidas. {@code length} vazio significa "tanto faz". */
	public record Preferences(Pace pace, Tone tone, LengthCategory length, List<ContentNote> avoid) {
	}

	public record RecommendationItem(int position, int score, Breakdown breakdown, List<String> reasons,
			BookDetail book) {
	}

	public record Breakdown(int genre, int pace, int tone, int length) {
	}

}
