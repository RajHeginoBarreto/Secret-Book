package br.com.secretbook.quiz;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import java.util.ArrayList;
import java.util.List;

@Entity
public class QuizQuestion {

	@Id
	private Long id;

	@Column(nullable = false, unique = true)
	private String slug;

	@Column(nullable = false)
	private int position;

	@Column(nullable = false)
	private String text;

	private String helpText;

	@Column(nullable = false)
	private boolean multiple;

	@Column(nullable = false)
	private boolean required;

	/** Se preenchida, a pergunta só aparece quando esta opção foi escolhida. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "condition_option_id")
	private QuizOption conditionOption;

	@OneToMany(mappedBy = "question")
	@OrderBy("position")
	private List<QuizOption> options = new ArrayList<>();

	protected QuizQuestion() {
	}

	public Long getId() {
		return id;
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

	public String getHelpText() {
		return helpText;
	}

	public boolean isMultiple() {
		return multiple;
	}

	public boolean isRequired() {
		return required;
	}

	public QuizOption getConditionOption() {
		return conditionOption;
	}

	public List<QuizOption> getOptions() {
		return options;
	}

}
