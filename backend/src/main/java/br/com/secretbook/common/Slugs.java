package br.com.secretbook.common;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Gera identificadores legíveis para URLs ("O Relógio da Rua" → "o-relogio-da-rua").
 */
public final class Slugs {

	private Slugs() {
	}

	public static String of(String text) {
		String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
		return withoutAccents.toLowerCase(Locale.ROOT)
			.replaceAll("[^a-z0-9]+", "-")
			.replaceAll("(^-+|-+$)", "");
	}

}
