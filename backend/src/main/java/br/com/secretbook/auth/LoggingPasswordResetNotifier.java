package br.com.secretbook.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * Implementação de DESENVOLVIMENTO: sem servidor de e-mail configurado (SPRING_MAIL_HOST vazio), escreve o link no
 * log da aplicação em vez de enviar. Com SMTP configurado, quem envia é o {@link SmtpPasswordResetNotifier}.
 */
@Component
@ConditionalOnExpression("'${spring.mail.host:}'.isEmpty()")
public class LoggingPasswordResetNotifier implements PasswordResetNotifier {

	private static final Logger log = LoggerFactory.getLogger(LoggingPasswordResetNotifier.class);

	@Override
	public void send(AppUser user, String resetLink) {
		log.info("[DEV] Link de redefinição de senha para {}: {}", user.getEmail(), resetLink);
	}

}
