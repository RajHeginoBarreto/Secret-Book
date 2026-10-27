package br.com.secretbook.account;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import java.io.Serializable;

/** Autor favorito do leitor, na ordem escolhida. Texto livre (não precisa existir no catálogo). */
@Entity
public class ReaderFavoriteAuthor {

	@EmbeddedId
	private Id id;

	@Column(nullable = false)
	private int position;

	protected ReaderFavoriteAuthor() {
	}

	public ReaderFavoriteAuthor(Long userId, String name, int position) {
		this.id = new Id(userId, name);
		this.position = position;
	}

	public String getName() {
		return id.name();
	}

	public int getPosition() {
		return position;
	}

	@Embeddable
	public record Id(Long userId, String name) implements Serializable {
	}

}
