package br.com.secretbook.quiz;

import br.com.secretbook.auth.AppUser;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderColumn;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Uma tentativa do quiz: respostas, perfil calculado e recomendações apresentadas. */
@Entity
public class QuizAttempt {

	@Id
	private UUID id;

	@Column(nullable = false)
	private String profileKey;

	@Column(nullable = false)
	private String profileName;

	@Column(nullable = false)
	private int excludedCount;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	/** Dono da tentativa; vazio quando o quiz foi feito sem login. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	private AppUser user;

	@ManyToMany
	@JoinTable(name = "quiz_attempt_answer", joinColumns = @JoinColumn(name = "attempt_id"),
			inverseJoinColumns = @JoinColumn(name = "option_id"))
	private Set<QuizOption> chosenOptions = new HashSet<>();

	@ElementCollection
	@CollectionTable(name = "quiz_attempt_recommendation", joinColumns = @JoinColumn(name = "attempt_id"))
	@OrderColumn(name = "position")
	private List<AttemptRecommendation> recommendations = new ArrayList<>();

	protected QuizAttempt() {
	}

	public QuizAttempt(AppUser user, String profileKey, String profileName, int excludedCount,
			Set<QuizOption> chosenOptions, List<AttemptRecommendation> recommendations) {
		this.id = UUID.randomUUID();
		this.createdAt = Instant.now();
		this.user = user;
		this.profileKey = profileKey;
		this.profileName = profileName;
		this.excludedCount = excludedCount;
		this.chosenOptions.addAll(chosenOptions);
		this.recommendations.addAll(recommendations);
	}

	public UUID getId() {
		return id;
	}

	public AppUser getUser() {
		return user;
	}

	public String getProfileKey() {
		return profileKey;
	}

	public String getProfileName() {
		return profileName;
	}

	public int getExcludedCount() {
		return excludedCount;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Set<QuizOption> getChosenOptions() {
		return chosenOptions;
	}

	public List<AttemptRecommendation> getRecommendations() {
		return recommendations;
	}

}
