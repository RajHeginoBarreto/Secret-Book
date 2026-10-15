package br.com.secretbook.quiz.engine;

import br.com.secretbook.catalog.ContentNote;
import br.com.secretbook.catalog.LengthCategory;
import br.com.secretbook.catalog.Pace;
import br.com.secretbook.catalog.Tone;
import java.util.Set;

/** O que o motor precisa saber de um livro (independente de JPA, para ser simples de testar). */
public record Candidate(long id, String title, Set<String> genres, Pace pace, Tone tone, int pages,
		Set<ContentNote> contentNotes) {

	public LengthCategory length() {
		return LengthCategory.fromPages(pages);
	}

}
