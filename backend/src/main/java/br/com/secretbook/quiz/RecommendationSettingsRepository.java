package br.com.secretbook.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationSettingsRepository extends JpaRepository<RecommendationSettings, Integer> {

	default RecommendationSettings current() {
		return findById(RecommendationSettings.SINGLETON_ID)
			.orElseThrow(() -> new IllegalStateException("Configuração de recomendação ausente (migração V2)."));
	}

}
