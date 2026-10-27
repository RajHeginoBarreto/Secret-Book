package br.com.secretbook.account;

import br.com.secretbook.account.dto.AccountDtos.AccountExport;
import br.com.secretbook.auth.AppUser;
import br.com.secretbook.auth.AppUserRepository;
import br.com.secretbook.auth.dto.AuthDtos.UserResponse;
import br.com.secretbook.common.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Exportação de tudo o que a aplicação guarda sobre o leitor (direito de acesso e portabilidade da LGPD). */
@Service
@Transactional(readOnly = true)
public class AccountExportService {

	private final AppUserRepository users;

	private final AccountService account;

	private final ReaderProfileService profiles;

	private final SubscriptionService subscriptions;

	public AccountExportService(AppUserRepository users, AccountService account, ReaderProfileService profiles,
			SubscriptionService subscriptions) {
		this.users = users;
		this.account = account;
		this.profiles = profiles;
		this.subscriptions = subscriptions;
	}

	public AccountExport export(Long userId) {
		AppUser user = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
		return new AccountExport(UserResponse.of(user), user.getPrivacyAcceptedAt(), profiles.profile(userId),
				account.library(userId), account.feedback(userId), account.quizHistory(userId),
				subscriptions.current(userId).orElse(null));
	}

}
