package br.com.secretbook.quiz.engine;

import br.com.secretbook.catalog.LengthCategory;
import br.com.secretbook.catalog.Pace;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Motor de recomendação explicável.
 *
 * <p>Para cada livro, calcula quanto ele combina (0 a 1) em quatro critérios:
 * <ul>
 * <li><b>Gênero</b>: soma das frações do perfil que foram para os gêneros do livro (limitada a 1).</li>
 * <li><b>Ritmo</b> e <b>tamanho</b>: 1 se igual ao preferido, 0,5 se vizinho (ex.: médio e longo), 0 se oposto.
 * Tamanho "tanto faz" vale 1 para qualquer livro.</li>
 * <li><b>Clima</b>: pontos do clima do livro divididos pelos pontos do clima preferido.</li>
 * </ul>
 * A nota final é a média ponderada desses critérios (pesos configuráveis), de 0 a 100. Livros com temas que o leitor
 * pediu para evitar, ou já lidos / avaliados como "não combina", nunca são recomendados. Empates são resolvidos pela
 * nota de gênero e depois pelo título, então o resultado é sempre o mesmo para as mesmas respostas.
 */
public final class RecommendationEngine {

	private static final double NEUTRAL = 0.5;

	public RecommendationResult recommend(PreferenceProfile profile, Collection<Candidate> candidates,
			RecommendationWeights weights, int maxResults, Set<Long> alreadyHandled, Map<String, String> genreNames) {
		List<Recommendation> scored = new ArrayList<>();
		int excludedByAvoid = 0;
		int excludedByHistory = 0;

		for (Candidate candidate : candidates) {
			if (alreadyHandled.contains(candidate.id())) {
				excludedByHistory++;
				continue;
			}
			if (!Collections.disjoint(candidate.contentNotes(), profile.avoid())) {
				excludedByAvoid++;
				continue;
			}
			scored.add(score(profile, candidate, weights, genreNames));
		}

		Comparator<Recommendation> order = Comparator.comparingInt(Recommendation::score)
			.thenComparingInt(recommendation -> recommendation.breakdown().genre())
			.reversed()
			.thenComparing(recommendation -> recommendation.candidate().title());
		List<Recommendation> top = scored.stream().sorted(order).limit(maxResults).toList();
		return new RecommendationResult(top, excludedByAvoid, excludedByHistory);
	}

	private Recommendation score(PreferenceProfile profile, Candidate book, RecommendationWeights weights,
			Map<String, String> genreNames) {
		List<String> reasons = new ArrayList<>();

		double genre = genreMatch(profile, book, genreNames, reasons);
		double pace = paceMatch(profile, book, reasons);
		double tone = toneMatch(profile, book, reasons);
		double length = lengthMatch(profile, book, reasons);
		if (!profile.avoid().isEmpty()) {
			reasons.add("Não tem nenhum dos temas que você pediu para evitar");
		}

		double weighted = weights.genre() * genre + weights.pace() * pace + weights.tone() * tone
				+ weights.length() * length;
		int score = percent(weighted / weights.total());
		var breakdown = new Recommendation.Breakdown(percent(genre), percent(pace), percent(tone), percent(length));
		return new Recommendation(book, score, breakdown, List.copyOf(reasons));
	}

	private double genreMatch(PreferenceProfile profile, Candidate book, Map<String, String> genreNames,
			List<String> reasons) {
		List<String> matched = profile.rankedGenres().stream().filter(book.genres()::contains).toList();
		if (matched.isEmpty()) {
			reasons.add("Foge dos seus gêneros favoritos, mas combina em outros pontos");
			return 0;
		}
		double share = Math.min(1, matched.stream().mapToDouble(profile::genreShare).sum());
		List<String> names = matched.stream().map(slug -> genreNames.getOrDefault(slug, slug)).toList();
		if (names.size() == 1) {
			reasons.add("Gênero %s, que representa %d%% do seu perfil".formatted(names.getFirst(), percent(share)));
		}
		else {
			reasons.add("Gêneros %s, que juntos representam %d%% do seu perfil".formatted(joinNames(names),
					percent(share)));
		}
		return share;
	}

	private double paceMatch(PreferenceProfile profile, Candidate book, List<String> reasons) {
		Optional<Pace> preferred = profile.preferredPace();
		if (preferred.isEmpty()) {
			return NEUTRAL;
		}
		double match = closeness(book.pace().ordinal(), preferred.get().ordinal(), Pace.values().length);
		if (match == 1) {
			reasons.add("Ritmo %s, como você pediu".formatted(Labels.pace(book.pace())));
		}
		else if (match >= NEUTRAL) {
			reasons.add("Ritmo %s, perto do %s que você pediu".formatted(Labels.pace(book.pace()),
					Labels.pace(preferred.get())));
		}
		return match;
	}

	private double toneMatch(PreferenceProfile profile, Candidate book, List<String> reasons) {
		if (!profile.hasTonePreference()) {
			return NEUTRAL;
		}
		double match = profile.toneAffinity(book.tone());
		if (match == 1) {
			reasons.add("Clima %s, como você prefere".formatted(Labels.tone(book.tone())));
		}
		else if (match > 0) {
			reasons.add("Clima %s, que também apareceu nas suas respostas".formatted(Labels.tone(book.tone())));
		}
		return match;
	}

	private double lengthMatch(PreferenceProfile profile, Candidate book, List<String> reasons) {
		Optional<LengthCategory> preferred = profile.preferredLength();
		if (preferred.isEmpty()) {
			return 1;
		}
		double match = closeness(book.length().ordinal(), preferred.get().ordinal(), LengthCategory.values().length);
		String size = "Leitura %s (%d páginas)".formatted(Labels.length(book.length()), book.pages());
		if (match == 1) {
			reasons.add(size + ", do tamanho que você quer");
		}
		else if (match >= NEUTRAL) {
			reasons.add(size + ", perto do tamanho que você quer");
		}
		return match;
	}

	/** 1 para valores iguais, caindo linearmente até 0 para os extremos opostos da escala. */
	private static double closeness(int value, int preferred, int scaleSize) {
		return 1 - (double) Math.abs(value - preferred) / (scaleSize - 1);
	}

	/** Arredonda para inteiro; a folga compensa erros de ponto flutuante (0,575 × 100 = 57,4999…). */
	private static int percent(double fraction) {
		return (int) Math.round(fraction * 100 + 1e-9);
	}

	private static String joinNames(List<String> names) {
		if (names.size() == 1) {
			return names.getFirst();
		}
		return String.join(", ", names.subList(0, names.size() - 1)) + " e " + names.getLast();
	}

}
