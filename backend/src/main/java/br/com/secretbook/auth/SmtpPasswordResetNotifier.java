package br.com.secretbook.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Envia o link de redefinição por e-mail (SMTP). Ativo quando SPRING_MAIL_HOST está definido; as demais
 * configurações seguem o padrão do Spring Boot (SPRING_MAIL_PORT, SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD...).
 * Só contas com e-mail cadastrado (antigas ou de administrador) recebem o link.
 */
@Component
@ConditionalOnExpression("!'${spring.mail.host:}'.isEmpty()")
public class SmtpPasswordResetNotifier implements PasswordResetNotifier {

	private final JavaMailSender mailSender;

	private final String from;

	public SmtpPasswordResetNotifier(JavaMailSender mailSender,
			@Value("${secretbook.mail.from:nao-responda@secretbook.local}") String from) {
		this.mailSender = mailSender;
		this.from = from;
	}

	@Override
	public void send(AppUser user, String resetLink) {
		if (user.getEmail() == null) {
			return;
		}
		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(from);
		message.setTo(user.getEmail());
		message.setSubject("Secret Book: redefinição de senha");
		message.setText("""
				Olá, %s!

				Recebemos um pedido para redefinir a senha da sua conta no Secret Book.
				Para criar uma nova senha, abra o link abaixo (ele vale por pouco tempo e só pode ser usado uma vez):

				%s

				Se não foi você, ignore este e-mail: sua senha continua a mesma.
				""".formatted(user.getUsername(), resetLink));
		mailSender.send(message);
	}

}
