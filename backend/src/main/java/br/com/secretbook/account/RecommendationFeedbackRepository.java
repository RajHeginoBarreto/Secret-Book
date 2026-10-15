package br.com.secretbook.account;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RecommendationFeedbackRepository extends JpaRepository<RecommendationFeedback, Long> {

	@Query("select f from RecommendationFeedback f where f.user.id = :userId and f.book.id = :bookId")
	Optional<RecommendationFeedback> findByUserAndBook(Long userId, Long bookId);

	@Query("select f from RecommendationFeedback f join fetch f.book where f.user.id = :userId order by f.updatedAt desc")
	List<RecommendationFeedback> findByUser(Long userId);

	@Query("select f.book.id from RecommendationFeedback f where f.user.id = :userId and f.useful = false")
	Set<Long> findRejectedBookIds(Long userId);

	@Query(value = "select f from RecommendationFeedback f join fetch f.user join fetch f.book",
			countQuery = "select count(f) from RecommendationFeedback f")
	Page<RecommendationFeedback> findAllWithDetails(Pageable pageable);

	long countByUseful(boolean useful);

}
