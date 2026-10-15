package br.com.secretbook.quiz;

import br.com.secretbook.quiz.engine.RecommendationWeights;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.UpdateTimestamp;

/** Configuração única (id = 1) do motor de recomendação, editável no painel administrativo. */
@Entity
public class RecommendationSettings {

	public static final int SINGLETON_ID = 1;

	@Id
	private Integer id;

	@Column(nullable = false, precision = 4, scale = 2)
	private BigDecimal genreWeight;

	@Column(nullable = false, precision = 4, scale = 2)
	private BigDecimal paceWeight;

	@Column(nullable = false, precision = 4, scale = 2)
	private BigDecimal toneWeight;

	@Column(nullable = false, precision = 4, scale = 2)
	private BigDecimal lengthWeight;

	@Column(nullable = false)
	private int maxResults;

	/** Pontos mínimos do 2º gênero para o perfil virar uma combinação de dois gêneros. */
	@Column(nullable = false, precision = 4, scale = 2)
	private BigDecimal mixThreshold;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected RecommendationSettings() {
	}

	public RecommendationWeights weights() {
		return new RecommendationWeights(genreWeight.doubleValue(), paceWeight.doubleValue(), toneWeight.doubleValue(),
				lengthWeight.doubleValue());
	}

	public void update(BigDecimal genre, BigDecimal pace, BigDecimal tone, BigDecimal length, int maxResults,
			BigDecimal mixThreshold) {
		this.genreWeight = genre;
		this.paceWeight = pace;
		this.toneWeight = tone;
		this.lengthWeight = length;
		this.maxResults = maxResults;
		this.mixThreshold = mixThreshold;
	}

	public BigDecimal getGenreWeight() {
		return genreWeight;
	}

	public BigDecimal getPaceWeight() {
		return paceWeight;
	}

	public BigDecimal getToneWeight() {
		return toneWeight;
	}

	public BigDecimal getLengthWeight() {
		return lengthWeight;
	}

	public int getMaxResults() {
		return maxResults;
	}

	public BigDecimal getMixThreshold() {
		return mixThreshold;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

}
