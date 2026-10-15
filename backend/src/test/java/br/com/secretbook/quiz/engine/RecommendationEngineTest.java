package br.com.secretbook.quiz.engine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.secretbook.catalog.ContentNote;
import br.com.secretbook.catalog.LengthCategory;
import br.com.secretbook.catalog.Pace;
import br.com.secretbook.catalog.Tone;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class RecommendationEngineTest {

	private static final Map<String, String> NAMES = Map.of("fantasia", "Fantasia", "romance", "Romance",
			"misterio", "Mistério", "ficcao-cientifica", "Ficção científica");

	private static final RecommendationWeights WEIGHTS = new RecommendationWeights(0.5, 0.15, 0.2, 0.15);

	private final RecommendationEngine engine = new RecommendationEngine();

	@Test
	void ranksGenresByPointsAndBreaksTiesByMostRecentAnswer() {
		PreferenceProfile profile = PreferenceProfile.builder()
			.add(0, genre("misterio", 1))
			.add(1, genre("romance", 1))
			.add(2, genre("misterio", 1))
			.add(3, genre("romance", 1))
			.build();

		assertThat(profile.rankedGenres()).containsExactly("romance", "misterio");
		assertThat(profile.genreShare("romance")).isEqualTo(0.5);
	}

	@Test
	void profileCombinesTwoGenresOnlyWhenTheSecondReachesTheThreshold() {
		PreferenceProfile mixed = PreferenceProfile.builder()
			.add(0, genre("romance", 1))
			.add(1, genre("fantasia", 1))
			.add(2, genre("fantasia", 1))
			.add(3, genre("romance", 1))
			.add(4, genre("fantasia", 1))
			.build();
		assertThat(ProfileKey.of(mixed, 2).value()).isEqualTo("fantasia+romance");

		PreferenceProfile pure = PreferenceProfile.builder()
			.add(0, genre("romance", 1))
			.add(1, genre("fantasia", 1))
			.add(2, genre("fantasia", 1))
			.build();
		assertThat(ProfileKey.of(pure, 2).value()).isEqualTo("fantasia");
	}

	@Test
	void perfectMatchScoresOneHundredAndExplainsEveryCriterion() {
		PreferenceProfile profile = profile("fantasia", Pace.FAST, Tone.LIGHT, LengthCategory.SHORT);
		Candidate book = candidate(1, "A Bruxa", Set.of("fantasia"), Pace.FAST, Tone.LIGHT, 230);

		Recommendation result = recommendOne(profile, book);

		assertThat(result.score()).isEqualTo(100);
		assertThat(result.breakdown()).isEqualTo(new Recommendation.Breakdown(100, 100, 100, 100));
		assertThat(result.reasons()).containsExactly(
				"Gênero Fantasia, que representa 100% do seu perfil",
				"Ritmo rápido, como você pediu",
				"Clima leve, como você prefere",
				"Leitura curta (230 páginas), do tamanho que você quer");
	}

	@Test
	void appliesTheConfiguredWeightsToPartialMatches() {
		// Gênero 100%, ritmo vizinho (50%), clima diferente (0%), tamanho oposto (0%).
		PreferenceProfile profile = profile("fantasia", Pace.FAST, Tone.LIGHT, LengthCategory.SHORT);
		Candidate book = candidate(1, "A Coroa", Set.of("fantasia"), Pace.MODERATE, Tone.DARK, 540);

		Recommendation result = recommendOne(profile, book);

		// (0,5 × 1 + 0,15 × 0,5 + 0,2 × 0 + 0,15 × 0) / 1 = 0,575 → 58
		assertThat(result.score()).isEqualTo(58);
		assertThat(result.breakdown()).isEqualTo(new Recommendation.Breakdown(100, 50, 0, 0));
		assertThat(result.reasons()).contains("Ritmo equilibrado, perto do rápido que você pediu");
	}

	@Test
	void sumsTheSharesOfEveryMatchingGenre() {
		PreferenceProfile profile = PreferenceProfile.builder()
			.add(0, genre("fantasia", 2))
			.add(1, genre("romance", 1))
			.add(2, genre("misterio", 1))
			.build();
		Candidate romantasy = candidate(1, "Pacto", Set.of("fantasia", "romance"), Pace.FAST, Tone.LIGHT, 300);

		Recommendation result = recommendOne(profile, romantasy);

		assertThat(result.breakdown().genre()).isEqualTo(75);
		assertThat(result.reasons().getFirst())
			.isEqualTo("Gêneros Fantasia e Romance, que juntos representam 75% do seu perfil");
	}

	@Test
	void neverRecommendsBooksWithAvoidedThemesOrAlreadyHandledBooks() {
		PreferenceProfile profile = PreferenceProfile.builder()
			.add(0, genre("misterio", 1))
			.add(1, new Effect(Dimension.AVOID, "VIOLENCE", 1))
			.build();
		Candidate violent = new Candidate(1, "Violento", Set.of("misterio"), Pace.FAST, Tone.DARK, 300,
				Set.of(ContentNote.VIOLENCE));
		Candidate read = candidate(2, "Já lido", Set.of("misterio"), Pace.FAST, Tone.DARK, 300);
		Candidate fine = candidate(3, "Tranquilo", Set.of("romance"), Pace.SLOW, Tone.LIGHT, 300);

		RecommendationResult result = engine.recommend(profile, List.of(violent, read, fine), WEIGHTS, 5, Set.of(2L),
				NAMES);

		assertThat(result.recommendations()).extracting(r -> r.candidate().title()).containsExactly("Tranquilo");
		assertThat(result.excludedByAvoid()).isEqualTo(1);
		assertThat(result.excludedByHistory()).isEqualTo(1);
		assertThat(result.recommendations().getFirst().reasons())
			.contains("Não tem nenhum dos temas que você pediu para evitar");
	}

	@Test
	void anyLengthFitsWhenTheReaderDoesNotCare() {
		PreferenceProfile profile = PreferenceProfile.builder()
			.add(0, genre("fantasia", 1))
			.add(1, new Effect(Dimension.PACE, "FAST", 1))
			.add(2, new Effect(Dimension.TONE, "LIGHT", 1))
			.build();

		Recommendation result = recommendOne(profile, candidate(1, "Longo", Set.of("fantasia"), Pace.FAST,
				Tone.LIGHT, 900));

		assertThat(result.breakdown().length()).isEqualTo(100);
		assertThat(result.reasons()).noneMatch(reason -> reason.startsWith("Leitura"));
	}

	@Test
	void ordersByScoreThenGenreThenTitleAndRespectsTheLimit() {
		PreferenceProfile profile = profile("fantasia", Pace.FAST, Tone.LIGHT, LengthCategory.SHORT);
		List<Candidate> books = List.of(
				candidate(1, "Zebra", Set.of("fantasia"), Pace.FAST, Tone.LIGHT, 200),
				candidate(2, "Abelha", Set.of("fantasia"), Pace.FAST, Tone.LIGHT, 200),
				candidate(3, "Fora do gênero", Set.of("romance"), Pace.FAST, Tone.LIGHT, 200),
				candidate(4, "Médio", Set.of("fantasia"), Pace.SLOW, Tone.LIGHT, 200));

		RecommendationResult result = engine.recommend(profile, books, WEIGHTS, 3, Set.of(), NAMES);

		assertThat(result.recommendations()).extracting(r -> r.candidate().title())
			.containsExactly("Abelha", "Zebra", "Médio");
	}

	@Test
	void rejectsInvalidWeights() {
		assertThatThrownBy(() -> new RecommendationWeights(-1, 0, 0, 0)).isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> new RecommendationWeights(0, 0, 0, 0)).isInstanceOf(IllegalArgumentException.class);
	}

	private Recommendation recommendOne(PreferenceProfile profile, Candidate book) {
		return engine.recommend(profile, List.of(book), WEIGHTS, 5, Set.of(), NAMES).recommendations().getFirst();
	}

	private static PreferenceProfile profile(String genre, Pace pace, Tone tone, LengthCategory length) {
		return PreferenceProfile.builder()
			.add(0, genre(genre, 1))
			.add(1, new Effect(Dimension.PACE, pace.name(), 1))
			.add(2, new Effect(Dimension.TONE, tone.name(), 1))
			.add(3, new Effect(Dimension.LENGTH, length.name(), 1))
			.build();
	}

	private static Effect genre(String slug, double weight) {
		return new Effect(Dimension.GENRE, slug, weight);
	}

	private static Candidate candidate(long id, String title, Set<String> genres, Pace pace, Tone tone, int pages) {
		return new Candidate(id, title, genres, pace, tone, pages, Set.of());
	}

}
