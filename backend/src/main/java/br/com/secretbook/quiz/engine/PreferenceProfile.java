package br.com.secretbook.quiz.engine;

import br.com.secretbook.catalog.ContentNote;
import br.com.secretbook.catalog.LengthCategory;
import br.com.secretbook.catalog.Pace;
import br.com.secretbook.catalog.Tone;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Gosto do leitor, somado a partir das opções escolhidas no quiz.
 *
 * <p>Cada dimensão guarda os pontos de cada valor e a última resposta em que ele apareceu. Em caso de empate vence o
 * valor escolhido mais recentemente, porque as últimas perguntas falam mais do livro em si.
 */
public final class PreferenceProfile {

	private final Tally<String> genres;

	private final Tally<Pace> paces;

	private final Tally<Tone> tones;

	private final Tally<LengthCategory> lengths;

	private final Set<ContentNote> avoid;

	private PreferenceProfile(Builder builder) {
		this.genres = builder.genres;
		this.paces = builder.paces;
		this.tones = builder.tones;
		this.lengths = builder.lengths;
		this.avoid = Collections.unmodifiableSet(EnumSet.copyOf(builder.avoid));
	}

	public static Builder builder() {
		return new Builder();
	}

	/** Gêneros do mais forte para o mais fraco (só os que receberam pontos). */
	public List<String> rankedGenres() {
		return genres.ranked();
	}

	public double genrePoints(String slug) {
		return genres.points(slug);
	}

	public double totalGenrePoints() {
		return genres.total();
	}

	/** Fração (0 a 1) dos pontos de gênero que foram para este gênero. */
	public double genreShare(String slug) {
		double total = genres.total();
		return total == 0 ? 0 : genres.points(slug) / total;
	}

	public Optional<Pace> preferredPace() {
		return paces.top();
	}

	public Optional<Tone> preferredTone() {
		return tones.top();
	}

	/** Vazio quando o leitor disse que o tamanho tanto faz. */
	public Optional<LengthCategory> preferredLength() {
		return lengths.top();
	}

	/** Afinidade (0 a 1) com um clima, relativa ao clima preferido. */
	public double toneAffinity(Tone tone) {
		return tones.relative(tone);
	}

	public boolean hasTonePreference() {
		return tones.total() > 0;
	}

	public Set<ContentNote> avoid() {
		return avoid;
	}

	public static final class Builder {

		private final Tally<String> genres = new Tally<>();

		private final Tally<Pace> paces = new Tally<>();

		private final Tally<Tone> tones = new Tally<>();

		private final Tally<LengthCategory> lengths = new Tally<>();

		private final Set<ContentNote> avoid = EnumSet.noneOf(ContentNote.class);

		private Builder() {
		}

		/**
		 * @param answerIndex posição da resposta no quiz (0, 1, 2…), usada para desempatar
		 */
		public Builder add(int answerIndex, Effect effect) {
			switch (effect.dimension()) {
				case GENRE -> genres.add(effect.value(), effect.weight(), answerIndex);
				case PACE -> paces.add(Pace.valueOf(effect.value()), effect.weight(), answerIndex);
				case TONE -> tones.add(Tone.valueOf(effect.value()), effect.weight(), answerIndex);
				case LENGTH -> lengths.add(LengthCategory.valueOf(effect.value()), effect.weight(), answerIndex);
				case AVOID -> avoid.add(ContentNote.valueOf(effect.value()));
			}
			return this;
		}

		public PreferenceProfile build() {
			return new PreferenceProfile(this);
		}

	}

	/** Pontos por valor + última resposta em que o valor apareceu. */
	private static final class Tally<K> {

		private final Map<K, Double> points = new HashMap<>();

		private final Map<K, Integer> lastSeen = new HashMap<>();

		void add(K key, double weight, int answerIndex) {
			points.merge(key, weight, Double::sum);
			lastSeen.merge(key, answerIndex, Math::max);
		}

		double points(K key) {
			return points.getOrDefault(key, 0.0);
		}

		double total() {
			return points.values().stream().mapToDouble(Double::doubleValue).sum();
		}

		List<K> ranked() {
			Comparator<K> byPoints = Comparator.comparingDouble(this::points);
			Comparator<K> byRecency = Comparator.comparingInt(lastSeen::get);
			return points.keySet().stream().sorted(byPoints.thenComparing(byRecency).reversed()).toList();
		}

		Optional<K> top() {
			return ranked().stream().findFirst();
		}

		double relative(K key) {
			double max = points.values().stream().mapToDouble(Double::doubleValue).max().orElse(0);
			return max == 0 ? 0 : points(key) / max;
		}

	}

}
