package br.com.secretbook.catalog;

/**
 * Tamanho do livro, derivado do número de páginas. A ordem importa: tamanhos vizinhos são considerados parecidos.
 */
public enum LengthCategory {

	SHORT, MEDIUM, LONG;

	/** Até 249 páginas é curto; de 250 a 400, médio; acima disso, longo. */
	public static LengthCategory fromPages(int pages) {
		if (pages < 250) {
			return SHORT;
		}
		return pages <= 400 ? MEDIUM : LONG;
	}

}
