package br.com.secretbook.account;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanRepository extends JpaRepository<Plan, Long> {

	Optional<Plan> findBySlugAndActiveTrue(String slug);

	List<Plan> findByActiveTrueOrderByMonthlyPriceCentsAsc();

}
