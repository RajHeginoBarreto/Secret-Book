package br.com.secretbook.account;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

	@Query("select s from Subscription s join fetch s.plan where s.user.id = :userId and s.status = 'ACTIVE'")
	Optional<Subscription> findActive(Long userId);

	@Query(value = "select s from Subscription s join fetch s.user join fetch s.plan",
			countQuery = "select count(s) from Subscription s")
	Page<Subscription> findAllWithDetails(Pageable pageable);

	/** Assinaturas ativas por plano: [nome do plano, total]. */
	@Query("select s.plan.name, count(s) from Subscription s where s.status = 'ACTIVE' group by s.plan.name order by s.plan.name")
	List<Object[]> countActiveByPlan();

}
