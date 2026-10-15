package br.com.secretbook.quiz.engine;

import java.util.List;

/**
 * Define o perfil literário: o gênero principal puro, ou a combinação dos dois mais fortes quando o segundo tem
 * pelo menos {@code mixThreshold} pontos. A chave junta os slugs em ordem alfabética ("fantasia+romance").
 */
public record ProfileKey(List<String> genres) {

	public static ProfileKey of(PreferenceProfile profile, double mixThreshold) {
		List<String> ranked = profile.rankedGenres();
		if (ranked.size() >= 2 && profile.genrePoints(ranked.get(1)) >= mixThreshold) {
			return new ProfileKey(ranked.subList(0, 2));
		}
		return new ProfileKey(ranked.isEmpty() ? List.of() : List.of(ranked.getFirst()));
	}

	public String value() {
		return String.join("+", genres.stream().sorted().toList());
	}

}
