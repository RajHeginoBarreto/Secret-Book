package br.com.secretbook.quiz;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/** Nome e descrição de um perfil literário (ver {@link br.com.secretbook.quiz.engine.ProfileKey}). */
@Entity
public class QuizProfile {

	@Id
	private String key;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String description;

	protected QuizProfile() {
	}

	public QuizProfile(String key, String name, String description) {
		this.key = key;
		this.name = name;
		this.description = description;
	}

	public String getKey() {
		return key;
	}

	public String getName() {
		return name;
	}

	public String getDescription() {
		return description;
	}

}
