package br.com.secretbook.quiz;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

	@Query("select distinct q from QuizQuestion q left join fetch q.options order by q.position")
	List<QuizQuestion> findAllWithOptions();

}
