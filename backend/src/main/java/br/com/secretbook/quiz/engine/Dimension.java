package br.com.secretbook.quiz.engine;

/** Aspecto do gosto do leitor que uma opção do quiz influencia. */
public enum Dimension {

	/** Valor: slug do gênero. */
	GENRE,
	/** Valor: {@link br.com.secretbook.catalog.Pace}. */
	PACE,
	/** Valor: {@link br.com.secretbook.catalog.Tone}. */
	TONE,
	/** Valor: {@link br.com.secretbook.catalog.LengthCategory}. */
	LENGTH,
	/** Valor: {@link br.com.secretbook.catalog.ContentNote} a evitar (filtro rígido, sem peso). */
	AVOID

}
