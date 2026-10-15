package br.com.secretbook.account;

import br.com.secretbook.auth.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;

/** Assinatura DEMONSTRATIVA: registra a escolha do plano, sem cobrança. */
@Entity
public class Subscription {

	public enum Status {
		ACTIVE, CANCELED
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private AppUser user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "plan_id")
	private Plan plan;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Status status;

	@Column(nullable = false, updatable = false)
	private Instant startedAt;

	private Instant canceledAt;

	protected Subscription() {
	}

	public Subscription(AppUser user, Plan plan, Instant startedAt) {
		this.user = user;
		this.plan = plan;
		this.status = Status.ACTIVE;
		this.startedAt = startedAt;
	}

	public void cancel(Instant now) {
		this.status = Status.CANCELED;
		this.canceledAt = now;
	}

	public Long getId() {
		return id;
	}

	public AppUser getUser() {
		return user;
	}

	public Plan getPlan() {
		return plan;
	}

	public Status getStatus() {
		return status;
	}

	public Instant getStartedAt() {
		return startedAt;
	}

	public Instant getCanceledAt() {
		return canceledAt;
	}

}
