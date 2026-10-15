package br.com.secretbook.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

	@Query("select s from UserSession s join fetch s.user where s.id = :id")
	Optional<UserSession> findWithUser(UUID id);

	/** Revoga as sessões ativas do usuário, exceto a informada (pode ser null para revogar todas). */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("""
			update UserSession s set s.revokedAt = :now
			where s.user.id = :userId and s.revokedAt is null and (:keep is null or s.id <> :keep)""")
	int revokeAll(Long userId, UUID keep, Instant now);

}
