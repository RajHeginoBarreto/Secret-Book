package br.com.secretbook.quiz;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.util.HashSet;
import java.util.Set;

@Entity
public class QuizOption {

	@Id
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "question_id")
	private QuizQuestion question;

	@Column(nullable = false)
	private String slug;

	@Column(nullable = false)
	private int position;

	@Column(nullable = false)
	private String text;

	/** Não pode ser combinada com outras opções da mesma pergunta (ex.: "Nenhum"). */
	@Column(nullable = false)
	private boolean exclusive;

	@ElementCollection
	@CollectionTable(name = "quiz_option_effect", joinColumns = @JoinColumn(name = "option_id"))
	private Set<OptionEffect> effects = new HashSet<>();

	protected QuizOption() {
	}

	public Long getId() {
		return id;
	}

	public QuizQuestion getQuestion() {
		return question;
	}

	public String getSlug() {
		return slug;
	}

	public int getPosition() {
		return position;
	}

	public String getText() {
		return text;
	}

	public boolean isExclusive() {
		return exclusive;
	}

	public Set<OptionEffect> getEffects() {
		return effects;
	}

}
