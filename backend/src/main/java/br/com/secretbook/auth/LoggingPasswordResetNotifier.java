package br.com.secretbook.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Implementação de DESENVOLVIMENTO: em vez de enviar e-mail, escreve o link no log da aplicação.
 * O protótipo não tem servidor de e-mail; troque esta classe por um envio real antes de qualquer uso público.
 */
@Component
public class LoggingPasswordResetNotifier implements PasswordResetNotifier {

	private static final Logger log = LoggerFactory.getLogger(LoggingPasswordResetNotifier.class);

	@Override
	public void send(AppUser user, String resetLink) {
		log.info("[DEV] Link de redefinição de senha para {}: {}", user.getEmail(), resetLink);
	}

}
