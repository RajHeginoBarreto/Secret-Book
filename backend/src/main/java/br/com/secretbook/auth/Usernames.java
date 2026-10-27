package br.com.secretbook.auth;

import java.text.Normalizer;

/** Regras do nome de usuário: o mesmo texto digitado de formas diferentes vira o mesmo nome. */
public final class Usernames {

	/**
	 * 3 a 40 caracteres: letras (inclusive acentuadas), números, espaço, ponto, _ ou -; começa e termina com letra ou
	 * número. Aplicado depois de {@link #normalize(String)}.
	 */
	public static final String REGEX = "^(?=.{3,40}$)[\\p{L}\\p{N}](?:[\\p{L}\\p{N} ._-]*[\\p{L}\\p{N}])?$";

	public static final String MESSAGE = "deve ter de 3 a 40 caracteres: letras, números, espaço, ponto, _ ou -";

	private Usernames() {
	}

	/** Forma canônica (NFC), sem espaços nas pontas e com espaços internos reduzidos a um só. */
	public static String normalize(String username) {
		if (username == null) {
			return null;
		}
		return Normalizer.normalize(username, Normalizer.Form.NFC).strip().replaceAll("\\s+", " ");
	}

}
