package br.com.secretbook.catalog.dto;

import br.com.secretbook.catalog.LengthCategory;
import br.com.secretbook.catalog.Pace;
import br.com.secretbook.catalog.Tone;
import java.util.List;

public record BookSummary(String slug, String title, List<AuthorRef> authors, List<GenreRef> genres, int pages,
		LengthCategory length, Pace pace, Tone tone, Integer publicationYear, String coverColor) {
}
