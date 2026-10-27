package br.com.secretbook.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.Locale;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
public class AppUser {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	/** Nome de usuário usado no login (único, sem diferenciar maiúsculas). */
	@Column(nullable = false)
	private String username;

	/** Opcional: contas de leitor não pedem e-mail (minimização de dados). */
	private String email;

	@Column(nullable = false)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Role role;

	@Column(nullable = false)
	private boolean enabled = true;

	/** Quando a pessoa aceitou a política de privacidade (nulo em contas antigas). */
	private Instant privacyAcceptedAt;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected AppUser() {
	}

	/** {@code email} pode ser nulo ou vazio (gravado como nulo). */
	public AppUser(String name, String username, String email, String passwordHash, Role role) {
		this.name = name;
		this.username = Usernames.normalize(username);
		this.email = normalizeEmail(email);
		this.passwordHash = passwordHash;
		this.role = role;
	}

	public static String normalizeEmail(String email) {
		return email == null || email.isBlank() ? null : email.trim().toLowerCase(Locale.ROOT);
	}

	public boolean isAdmin() {
		return role == Role.ADMIN;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getUsername() {
		return username;
	}

	public String getEmail() {
		return email;
	}

	public Instant getPrivacyAcceptedAt() {
		return privacyAcceptedAt;
	}

	public void setPrivacyAcceptedAt(Instant privacyAcceptedAt) {
		this.privacyAcceptedAt = privacyAcceptedAt;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

}
