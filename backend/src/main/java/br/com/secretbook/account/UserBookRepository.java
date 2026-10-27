package br.com.secretbook.account;

import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserBookRepository extends JpaRepository<UserBook, UserBook.Id> {

	@Query("select ub from UserBook ub join fetch ub.book where ub.user.id = :userId order by ub.updatedAt desc")
	List<UserBook> findByUser(Long userId);

	@Query("select ub.book.id from UserBook ub where ub.user.id = :userId and ub.status = :status")
	Set<Long> findBookIdsByStatus(Long userId, ReadingStatus status);

	/** Comentários de um livro feitos por contas ativas com o status informado, do mais novo ao mais antigo. */
	@Query("""
			select ub from UserBook ub join fetch ub.user u
			where ub.book.id = :bookId and ub.status = :status
			and ub.comment is not null and u.enabled = true
			order by ub.reviewedAt desc""")
	List<UserBook> findReviews(Long bookId, ReadingStatus status);

}
