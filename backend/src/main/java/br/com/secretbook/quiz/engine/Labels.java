package br.com.secretbook.quiz.engine;

import br.com.secretbook.catalog.ContentNote;
import br.com.secretbook.catalog.LengthCategory;
import br.com.secretbook.catalog.Pace;
import br.com.secretbook.catalog.Tone;

/** Nomes em português usados nas justificativas. */
public final class Labels {

	private Labels() {
	}

	public static String pace(Pace pace) {
		return switch (pace) {
			case SLOW -> "lento";
			case MODERATE -> "equilibrado";
			case FAST -> "rápido";
		};
	}

	public static String tone(Tone tone) {
		return switch (tone) {
			case LIGHT -> "leve";
			case EMOTIONAL -> "emocionante";
			case DARK -> "sombrio";
			case THOUGHTFUL -> "reflexivo";
		};
	}

	/** Concorda com "leitura": curta, média, longa. */
	public static String length(LengthCategory length) {
		return switch (length) {
			case SHORT -> "curta";
			case MEDIUM -> "média";
			case LONG -> "longa";
		};
	}

	public static String contentNote(ContentNote note) {
		return switch (note) {
			case VIOLENCE -> "violência";
			case GRIEF -> "luto e perda";
			case STRONG_LANGUAGE -> "linguagem forte";
			case SEXUAL_CONTENT -> "cenas de sexo";
			case HORROR -> "terror";
		};
	}

}
