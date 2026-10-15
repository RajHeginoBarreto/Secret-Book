package br.com.secretbook.quiz;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

	@Query("select a from QuizAttempt a where a.user.id = :userId order by a.createdAt desc")
	List<QuizAttempt> findByUser(Long userId);

	long countByCreatedAtAfter(Instant since);

	@Query("select count(a) > 0 from QuizAttempt a join a.recommendations r where r.book.id = :bookId")
	boolean wasRecommended(Long bookId);

	/** Livros mais recomendados: [título, vezes]. */
	@Query("""
			select r.book.title, count(r) from QuizAttempt a join a.recommendations r
			group by r.book.title order by count(r) desc, r.book.title""")
	List<Object[]> mostRecommendedBooks(Pageable pageable);

}
