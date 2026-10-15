package br.com.secretbook.account;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/** Plano demonstrativo do clube (valores fictícios). */
@Entity
public class Plan {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String slug;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private int monthlyPriceCents;

	@Column(nullable = false)
	private int booksPerMonth;

	@Column(nullable = false)
	private boolean active = true;

	protected Plan() {
	}

	public Long getId() {
		return id;
	}

	public String getSlug() {
		return slug;
	}

	public String getName() {
		return name;
	}

	public int getMonthlyPriceCents() {
		return monthlyPriceCents;
	}

	public int getBooksPerMonth() {
		return booksPerMonth;
	}

	public boolean isActive() {
		return active;
	}

}
