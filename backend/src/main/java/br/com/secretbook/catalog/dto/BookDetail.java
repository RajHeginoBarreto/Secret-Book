package br.com.secretbook.catalog.dto;

import br.com.secretbook.catalog.ContentNote;
import br.com.secretbook.catalog.LengthCategory;
import br.com.secretbook.catalog.Pace;
import br.com.secretbook.catalog.Tone;
import java.util.List;

public record BookDetail(String slug, String title, List<AuthorRef> authors, List<GenreRef> genres, int pages,
		LengthCategory length, Pace pace, Tone tone, Integer publicationYear, String coverColor, String synopsis,
		List<ContentNote> contentNotes, List<String> clues) {
}
