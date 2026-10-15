package br.com.secretbook.account;

import br.com.secretbook.account.dto.AccountDtos.PlanResponse;
import br.com.secretbook.account.dto.AccountDtos.SubscriptionResponse;
import br.com.secretbook.auth.AppUserRepository;
import br.com.secretbook.common.error.ApiException;
import br.com.secretbook.common.error.ResourceNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Assinatura DEMONSTRATIVA: guarda o plano escolhido, sem cobrança nem dados de pagamento. */
@Service
@Transactional
public class SubscriptionService {

	private final SubscriptionRepository subscriptions;

	private final PlanRepository plans;

	private final AppUserRepository users;

	private final Clock clock;

	public SubscriptionService(SubscriptionRepository subscriptions, PlanRepository plans, AppUserRepository users,
			Clock clock) {
		this.subscriptions = subscriptions;
		this.plans = plans;
		this.users = users;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public List<PlanResponse> plans() {
		return plans.findByActiveTrueOrderByMonthlyPriceCentsAsc().stream().map(PlanResponse::of).toList();
	}

	@Transactional(readOnly = true)
	public Optional<SubscriptionResponse> current(Long userId) {
		return subscriptions.findActive(userId).map(SubscriptionResponse::of);
	}

	/** Assina um plano. Se já houver assinatura ativa, ela é encerrada e substituída (troca de plano). */
	public SubscriptionResponse subscribe(Long userId, String planSlug) {
		Plan plan = plans.findBySlugAndActiveTrue(planSlug)
			.orElseThrow(() -> new ResourceNotFoundException("Plano não encontrado."));
		Instant now = clock.instant();
		Optional<Subscription> active = subscriptions.findActive(userId);
		if (active.isPresent() && active.get().getPlan().getId().equals(plan.getId())) {
			throw ApiException.conflict("Você já assina este plano.");
		}
		active.ifPresent(subscription -> subscription.cancel(now));
		subscriptions.flush();
		return SubscriptionResponse.of(subscriptions.save(new Subscription(users.getReferenceById(userId), plan, now)));
	}

	public void cancel(Long userId) {
		Subscription active = subscriptions.findActive(userId)
			.orElseThrow(() -> new ResourceNotFoundException("Você não tem assinatura ativa."));
		active.cancel(clock.instant());
	}

}
