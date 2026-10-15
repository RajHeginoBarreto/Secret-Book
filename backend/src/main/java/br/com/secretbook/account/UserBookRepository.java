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

}
