package br.com.secretbook.account;

import br.com.secretbook.account.dto.AccountDtos.ReaderProfileResponse;
import br.com.secretbook.common.error.ApiException;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Perfil do leitor: tipos literários de que gosta ou não gosta e autores favoritos. */
@Service
@Transactional
public class ReaderProfileService {

	private static final Comparator<String> ALPHABETICAL = Collator.getInstance(Locale.forLanguageTag("pt-BR"))::compare;

	private final ReaderGenrePreferenceRepository genres;

	private final ReaderFavoriteAuthorRepository authors;

	public ReaderProfileService(ReaderGenrePreferenceRepository genres, ReaderFavoriteAuthorRepository authors) {
		this.genres = genres;
		this.authors = authors;
	}

	@Transactional(readOnly = true)
	public ReaderProfileResponse profile(Long userId) {
		List<ReaderGenrePreference> preferences = genres.findByUser(userId);
		return new ReaderProfileResponse(labels(preferences, true), labels(preferences, false),
				authors.findByUser(userId).stream().map(ReaderFavoriteAuthor::getName).toList());
	}

	/**
	 * Substitui o perfil inteiro. As listas já chegam limpas (sem itens vazios nem repetidos); aqui só se confere que
	 * nenhum tipo literário esteja ao mesmo tempo em "gosto" e "não gosto".
	 */
	public ReaderProfileResponse update(Long userId, List<String> likedGenres, List<String> dislikedGenres,
			List<String> favoriteAuthors) {
		Map<String, String> liked = likedGenres.stream()
			.collect(Collectors.toMap(label -> label.toLowerCase(Locale.ROOT), Function.identity()));
		List<String> conflicts = dislikedGenres.stream()
			.filter(label -> liked.containsKey(label.toLowerCase(Locale.ROOT)))
			.toList();
		if (!conflicts.isEmpty()) {
			throw ApiException.badRequest("Um tipo literário não pode estar ao mesmo tempo em \"gosto\" e \"não gosto\": "
					+ String.join(", ", conflicts) + ".");
		}

		genres.deleteByUser(userId);
		authors.deleteByUser(userId);
		List<ReaderGenrePreference> preferences = new ArrayList<>();
		likedGenres.forEach(label -> preferences.add(new ReaderGenrePreference(userId, label, true)));
		dislikedGenres.forEach(label -> preferences.add(new ReaderGenrePreference(userId, label, false)));
		genres.saveAll(preferences);
		List<ReaderFavoriteAuthor> favorites = new ArrayList<>();
		for (int i = 0; i < favoriteAuthors.size(); i++) {
			favorites.add(new ReaderFavoriteAuthor(userId, favoriteAuthors.get(i), i));
		}
		authors.saveAll(favorites);
		genres.flush();
		authors.flush();
		return profile(userId);
	}

	private static List<String> labels(List<ReaderGenrePreference> preferences, boolean liked) {
		return preferences.stream()
			.filter(preference -> preference.isLiked() == liked)
			.map(ReaderGenrePreference::getLabel)
			.sorted(ALPHABETICAL)
			.toList();
	}

}
