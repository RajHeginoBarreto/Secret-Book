package br.com.secretbook.quiz;

import br.com.secretbook.auth.AppUser;
import br.com.secretbook.auth.AppUserRepository;
import br.com.secretbook.auth.AuthenticatedUser;
import br.com.secretbook.catalog.Book;
import br.com.secretbook.catalog.BookRepository;
import br.com.secretbook.catalog.CatalogMapper;
import br.com.secretbook.catalog.Genre;
import br.com.secretbook.catalog.GenreRepository;
import br.com.secretbook.common.error.ResourceNotFoundException;
import br.com.secretbook.quiz.dto.QuizResponse;
import br.com.secretbook.quiz.dto.QuizResultResponse;
import br.com.secretbook.quiz.engine.Candidate;
import br.com.secretbook.quiz.engine.PreferenceProfile;
import br.com.secretbook.quiz.engine.ProfileKey;
import br.com.secretbook.quiz.engine.RecommendationEngine;
import br.com.secretbook.quiz.engine.RecommendationResult;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class QuizService {

	private final RecommendationEngine engine = new RecommendationEngine();

	private final QuizQuestionRepository questions;

	private final QuizProfileRepository profiles;

	private final QuizAttemptRepository attempts;

	private final RecommendationSettingsRepository settings;

	private final BookRepository books;

	private final GenreRepository genres;

	private final AppUserRepository users;

	private final ReaderHistory readerHistory;

	public QuizService(QuizQuestionRepository questions, QuizProfileRepository profiles, QuizAttemptRepository attempts,
			RecommendationSettingsRepository settings, BookRepository books, GenreRepository genres,
			AppUserRepository users, ReaderHistory readerHistory) {
		this.questions = questions;
		this.profiles = profiles;
		this.attempts = attempts;
		this.settings = settings;
		this.books = books;
		this.genres = genres;
		this.users = users;
		this.readerHistory = readerHistory;
	}

	@Transactional(readOnly = true)
	public QuizResponse getQuiz() {
		return new QuizResponse(questions.findAllWithOptions().stream().map(QuizService::toQuestion).toList());
	}

	/**
	 * Calcula o perfil e as recomendações e registra a tentativa.
	 *
	 * @param viewer usuário logado, ou null; para ele, livros já lidos ou descartados não são recomendados
	 */
	public QuizAttempt submit(Map<String, List<String>> answers, AuthenticatedUser viewer) {
		AppUser owner = viewer == null ? null : users.getReferenceById(viewer.id());
		Set<Long> alreadyHandled = viewer == null ? Set.of() : readerHistory.handledBookIds(viewer.id());
		List<QuizOption> chosen = AnswerValidator.validate(questions.findAllWithOptions(), answers);
		PreferenceProfile preferences = toPreferences(chosen);
		RecommendationSettings config = settings.current();
		Map<String, String> genreNames = genreNames();

		Map<Long, Book> catalog = books.findByActiveTrue().stream()
			.collect(Collectors.toMap(Book::getId, Function.identity()));
		List<Candidate> candidates = catalog.values().stream().map(QuizService::toCandidate).toList();
		RecommendationResult result = engine.recommend(preferences, candidates, config.weights(),
				config.getMaxResults(), alreadyHandled, genreNames);

		ProfileKey key = ProfileKey.of(preferences, config.getMixThreshold().doubleValue());
		QuizProfile profile = resolveProfile(key, genreNames);
		List<AttemptRecommendation> recommendations = result.recommendations().stream()
			.map(r -> new AttemptRecommendation(catalog.get(r.candidate().id()), r.score(), r.breakdown().genre(),
					r.breakdown().pace(), r.breakdown().tone(), r.breakdown().length(), r.reasons()))
			.toList();

		QuizAttempt attempt = new QuizAttempt(owner, key.value(), profile.getName(),
				result.excludedByAvoid() + result.excludedByHistory(), Set.copyOf(chosen), recommendations);
		return attempts.save(attempt);
	}

	/**
	 * Tentativas anônimas podem ser reabertas por quem tem o id; as de uma conta, só pelo dono ou por um
	 * administrador. Para os demais, a tentativa simplesmente "não existe".
	 */
	@Transactional(readOnly = true)
	public QuizAttempt findAttempt(UUID id, AuthenticatedUser viewer) {
		return attempts.findById(id)
			.filter(attempt -> attempt.getUser() == null || (viewer != null
					&& (viewer.isAdmin() || viewer.id().equals(attempt.getUser().getId()))))
			.orElseThrow(() -> new ResourceNotFoundException("Resultado do quiz não encontrado."));
	}

	/** Monta a resposta completa de uma tentativa (usada logo após o envio e ao reabrir um resultado). */
	@Transactional(readOnly = true)
	public QuizResultResponse toResult(QuizAttempt detached) {
		// A tentativa chega de outra transação: recarrega para que livros, autores e gêneros possam ser lidos aqui.
		QuizAttempt attempt = attempts.findById(detached.getId()).orElseThrow();
		Map<String, String> genreNames = genreNames();
		PreferenceProfile preferences = toPreferences(attempt.getChosenOptions());
		QuizProfile profile = profiles.findById(attempt.getProfileKey())
			.orElseGet(() -> new QuizProfile(attempt.getProfileKey(), attempt.getProfileName(),
					fallbackDescription(attempt.getProfileName())));

		List<QuizResultResponse.GenreScore> genreScores = preferences.rankedGenres().stream()
			.map(slug -> new QuizResultResponse.GenreScore(slug, genreNames.getOrDefault(slug, slug),
					preferences.genrePoints(slug), (int) Math.round(preferences.genreShare(slug) * 100)))
			.toList();
		var preferencesResponse = new QuizResultResponse.Preferences(preferences.preferredPace().orElse(null),
				preferences.preferredTone().orElse(null), preferences.preferredLength().orElse(null),
				preferences.avoid().stream().sorted().toList());

		List<AttemptRecommendation> stored = attempt.getRecommendations();
		List<QuizResultResponse.RecommendationItem> items = IntStream.range(0, stored.size()).mapToObj(index -> {
			AttemptRecommendation rec = stored.get(index);
			return new QuizResultResponse.RecommendationItem(index + 1, rec.getScore(),
					new QuizResultResponse.Breakdown(rec.getGenreMatch(), rec.getPaceMatch(), rec.getToneMatch(),
							rec.getLengthMatch()),
					rec.getReasons(), CatalogMapper.toDetail(rec.getBook()));
		}).toList();

		return new QuizResultResponse(attempt.getId(), attempt.getCreatedAt(),
				new QuizResultResponse.Profile(profile.getKey(), profile.getName(), profile.getDescription()),
				genreScores, preferencesResponse, items, attempt.getExcludedCount());
	}

	/** Soma os efeitos das opções na ordem das perguntas (a posição serve para desempatar). */
	private static PreferenceProfile toPreferences(Collection<QuizOption> chosen) {
		PreferenceProfile.Builder builder = PreferenceProfile.builder();
		chosen.stream()
			.sorted(Comparator.comparingInt((QuizOption option) -> option.getQuestion().getPosition())
				.thenComparingInt(QuizOption::getPosition))
			.forEach(option -> option.getEffects()
				.forEach(effect -> builder.add(option.getQuestion().getPosition(), effect.toEffect())));
		return builder.build();
	}

	private QuizProfile resolveProfile(ProfileKey key, Map<String, String> genreNames) {
		return profiles.findById(key.value()).orElseGet(() -> {
			String name = key.genres().isEmpty() ? "Leitor eclético"
					: key.genres().stream().map(slug -> genreNames.getOrDefault(slug, slug))
						.collect(Collectors.joining(" e "));
			return new QuizProfile(key.value(), name, fallbackDescription(name));
		});
	}

	private static String fallbackDescription(String name) {
		return "Seu perfil de leitura é " + name + ". As recomendações abaixo foram escolhidas a partir das suas "
				+ "respostas.";
	}

	private Map<String, String> genreNames() {
		return genres.findAll().stream().collect(Collectors.toMap(Genre::getSlug, Genre::getName));
	}

	private static Candidate toCandidate(Book book) {
		return new Candidate(book.getId(), book.getTitle(),
				book.getGenres().stream().map(Genre::getSlug).collect(Collectors.toSet()), book.getPace(),
				book.getTone(), book.getPages(), Set.copyOf(book.getContentNotes()));
	}

	private static QuizResponse.Question toQuestion(QuizQuestion question) {
		QuizOption condition = question.getConditionOption();
		return new QuizResponse.Question(question.getSlug(), question.getText(), question.getHelpText(),
				question.isMultiple(), question.isRequired(),
				condition == null ? null
						: new QuizResponse.Condition(condition.getQuestion().getSlug(), condition.getSlug()),
				question.getOptions().stream()
					.map(option -> new QuizResponse.Option(option.getSlug(), option.getText(), option.isExclusive()))
					.toList());
	}

}
