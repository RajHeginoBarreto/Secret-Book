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
 * Cria a primeira conta de administrador a partir de ADMIN_USERNAME (padrão "admin") e ADMIN_PASSWORD, se ela ainda
 * não existir. ADMIN_EMAIL é opcional (permite entrar também pelo e-mail e recuperar a senha). Sem ADMIN_PASSWORD,
 * nada acontece. Senhas nunca ficam no código nem nas migrações.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

	private final AppUserRepository users;

	private final PasswordEncoder passwordEncoder;

	private final String username;

	private final String email;

	private final String password;

	private final String name;

	public AdminBootstrap(AppUserRepository users, PasswordEncoder passwordEncoder,
			@Value("${secretbook.admin.username:admin}") String username,
			@Value("${secretbook.admin.email:}") String email, @Value("${secretbook.admin.password:}") String password,
			@Value("${secretbook.admin.name:Administrador}") String name) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.username = Usernames.normalize(username);
		this.email = email;
		this.password = password;
		this.name = name;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
			return;
		}
		if (users.existsByUsername(username) || (StringUtils.hasText(email) && users.existsByEmail(email.trim()))) {
			log.info("Conta de administrador inicial ({}) já existe; nada a fazer.", username);
			return;
		}
		if (!username.matches(Usernames.REGEX)) {
			log.warn("ADMIN_USERNAME {}; administrador inicial não foi criado.", Usernames.MESSAGE);
			return;
		}
		if (password.length() < 8) {
			log.warn("ADMIN_PASSWORD precisa ter pelo menos 8 caracteres; administrador inicial não foi criado.");
			return;
		}
		String displayName = StringUtils.hasText(name) ? name.trim() : username;
		users.save(new AppUser(displayName, username, email, passwordEncoder.encode(password), Role.ADMIN));
		log.info("Conta de administrador inicial criada: {}", username);
	}

}
