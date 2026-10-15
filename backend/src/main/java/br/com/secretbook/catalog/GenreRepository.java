package br.com.secretbook.catalog;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface GenreRepository extends JpaRepository<Genre, Long> {

	Optional<Genre> findBySlug(String slug);

	List<Genre> findAllByOrderByNameAsc();

	List<Genre> findBySlugIn(Collection<String> slugs);

	boolean existsBySlug(String slug);

	/** Quantidade de livros ativos por gênero: [slug, total]. */
	@Query("select g.slug, count(b) from Book b join b.genres g where b.active = true group by g.slug")
	List<Object[]> countActiveBooksBySlug();

	/** Quantidade de livros (ativos ou não) por gênero: [slug, total]. */
	@Query("select g.slug, count(b) from Book b join b.genres g group by g.slug")
	List<Object[]> countAllBooksBySlug();

	/** O quiz referencia gêneros pelo slug: um gênero usado nas opções não pode ser excluído. */
	@Query(value = "select count(*) > 0 from quiz_option_effect where dimension = 'GENRE' and value = :slug",
			nativeQuery = true)
	boolean isUsedByQuiz(String slug);

}
