package br.com.secretbook;

import br.com.secretbook.auth.AppUser;
import br.com.secretbook.auth.PasswordResetNotifier;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** Guarda o último link de redefinição enviado para cada e-mail, para os testes usarem. */
public class CapturingPasswordResetNotifier implements PasswordResetNotifier {

	private final Map<String, String> lastLinks = new ConcurrentHashMap<>();

	@Override
	public void send(AppUser user, String resetLink) {
		lastLinks.put(user.getEmail(), resetLink);
	}

	public Optional<String> lastTokenFor(String email) {
		return Optional.ofNullable(lastLinks.get(email)).map(link -> link.substring(link.indexOf("token=") + 6));
	}

}
