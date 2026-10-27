package br.com.secretbook.account;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import java.io.Serializable;

/** Tipo literário de que o leitor gosta ({@code liked}) ou não gosta. Texto livre, escolhido pelo leitor. */
@Entity
public class ReaderGenrePreference {

	@EmbeddedId
	private Id id;

	@Column(nullable = false)
	private boolean liked;

	protected ReaderGenrePreference() {
	}

	public ReaderGenrePreference(Long userId, String label, boolean liked) {
		this.id = new Id(userId, label);
		this.liked = liked;
	}

	public String getLabel() {
		return id.label();
	}

	public boolean isLiked() {
		return liked;
	}

	@Embeddable
	public record Id(Long userId, String label) implements Serializable {
	}

}
