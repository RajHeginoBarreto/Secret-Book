package br.com.secretbook.auth;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

	@Query("select u from AppUser u where lower(u.email) = lower(:email)")
	Optional<AppUser> findByEmail(String email);

	@Query("select count(u) > 0 from AppUser u where lower(u.email) = lower(:email)")
	boolean existsByEmail(String email);

	@Query("""
			select u from AppUser u
			where :pattern is null or lower(u.name) like :pattern or lower(u.email) like :pattern""")
	Page<AppUser> search(String pattern, Pageable pageable);

	long countByRole(Role role);

}
