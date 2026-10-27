package br.com.secretbook.account;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ReaderFavoriteAuthorRepository extends JpaRepository<ReaderFavoriteAuthor, ReaderFavoriteAuthor.Id> {

	@Query("select a from ReaderFavoriteAuthor a where a.id.userId = :userId order by a.position")
	List<ReaderFavoriteAuthor> findByUser(Long userId);

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from ReaderFavoriteAuthor a where a.id.userId = :userId")
	int deleteByUser(Long userId);

}
