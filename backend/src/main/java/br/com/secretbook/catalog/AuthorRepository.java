package br.com.secretbook.catalog;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuthorRepository extends JpaRepository<Author, Long> {

	Optional<Author> findBySlug(String slug);

	List<Author> findAllByOrderByNameAsc();

	List<Author> findBySlugIn(Collection<String> slugs);

	boolean existsBySlug(String slug);

	/** Quantidade de livros (ativos ou não) por autor: [slug, total]. */
	@Query("select a.slug, count(b) from Book b join b.authors a group by a.slug")
	List<Object[]> countBooksBySlug();

}
