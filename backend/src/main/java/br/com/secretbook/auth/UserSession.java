package br.com.secretbook.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;
import java.util.UUID;

/** Sessão aberta por um login. O id vai no token; revogar a sessão invalida o token imediatamente. */
@Entity
public class UserSession {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private AppUser user;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant expiresAt;

	private Instant revokedAt;

	protected UserSession() {
	}

	public UserSession(AppUser user, Instant createdAt, Instant expiresAt) {
		this.id = UUID.randomUUID();
		this.user = user;
		this.createdAt = createdAt;
		this.expiresAt = expiresAt;
	}

	public boolean isActive(Instant now) {
		return revokedAt == null && now.isBefore(expiresAt);
	}

	public void revoke(Instant now) {
		if (revokedAt == null) {
			revokedAt = now;
		}
	}

	public UUID getId() {
		return id;
	}

	public AppUser getUser() {
		return user;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

}
