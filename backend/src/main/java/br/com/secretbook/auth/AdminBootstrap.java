package br.com.secretbook.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Cria a primeira conta de administrador a partir de ADMIN_EMAIL e ADMIN_PASSWORD, se ela ainda não existir.
 * Sem essas variáveis, nada acontece. Senhas nunca ficam no código nem nas migrações.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

	private final AppUserRepository users;

	private final PasswordEncoder passwordEncoder;

	private final String email;

	private final String password;

	private final String name;

	public AdminBootstrap(AppUserRepository users, PasswordEncoder passwordEncoder,
			@Value("${secretbook.admin.email:}") String email, @Value("${secretbook.admin.password:}") String password,
			@Value("${secretbook.admin.name:Administrador}") String name) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.email = email;
		this.password = password;
		this.name = name;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
			return;
		}
		if (users.existsByEmail(email)) {
			log.info("Conta de administrador inicial ({}) já existe; nada a fazer.", email);
			return;
		}
		if (password.length() < 8) {
			log.warn("ADMIN_PASSWORD precisa ter pelo menos 8 caracteres; administrador inicial não foi criado.");
			return;
		}
		users.save(new AppUser(name, email, passwordEncoder.encode(password), Role.ADMIN));
		log.info("Conta de administrador inicial criada: {}", email);
	}

}
