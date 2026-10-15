package br.com.secretbook.account;

import br.com.secretbook.account.dto.AccountDtos.PlanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Planos", description = "Planos demonstrativos do clube (valores fictícios)")
public class PlanController {

	private final SubscriptionService subscriptions;

	public PlanController(SubscriptionService subscriptions) {
		this.subscriptions = subscriptions;
	}

	@GetMapping("/api/plans")
	@Operation(summary = "Planos ativos, do mais barato ao mais caro")
	public List<PlanResponse> plans() {
		return subscriptions.plans();
	}

}
