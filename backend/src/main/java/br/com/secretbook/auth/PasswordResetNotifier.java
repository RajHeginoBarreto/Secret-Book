package br.com.secretbook.auth;

/** Entrega o link de redefinição de senha ao usuário (e-mail, em produção). */
public interface PasswordResetNotifier {

	void send(AppUser user, String resetLink);

}
