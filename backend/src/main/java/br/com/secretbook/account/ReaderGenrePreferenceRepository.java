package br.com.secretbook.account;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ReaderGenrePreferenceRepository
		extends JpaRepository<ReaderGenrePreference, ReaderGenrePreference.Id> {

	@Query("select p from ReaderGenrePreference p where p.id.userId = :userId")
	List<ReaderGenrePreference> findByUser(Long userId);

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from ReaderGenrePreference p where p.id.userId = :userId")
	int deleteByUser(Long userId);

}
