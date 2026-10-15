package br.com.secretbook.quiz;

import java.util.Set;

/** Livros que o leitor já resolveu (lidos ou avaliados como "não combina") e que não devem ser recomendados. */
public interface ReaderHistory {

	Set<Long> handledBookIds(Long userId);

}
