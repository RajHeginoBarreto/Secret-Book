package br.com.secretbook.catalog;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

	Optional<Book> findBySlug(String slug);

	@Query("select distinct b.id from Book b join b.genres g where g.slug in :genreSlugs")
	Set<Long> findIdsByGenreSlugs(Collection<String> genreSlugs);

	Optional<Book> findBySlugAndActiveTrue(String slug);

	boolean existsBySlug(String slug);

	List<Book> findByActiveTrue();

	@Query("select b from Book b join b.authors a where a = :author and b.active = true order by b.title")
	List<Book> findActiveByAuthor(Author author);

	@Query("select count(b) > 0 from Book b join b.authors a where a = :author")
	boolean existsByAuthor(Author author);

	@Query("select count(b) > 0 from Book b join b.genres g where g = :genre")
	boolean existsByGenre(Genre genre);

	long countByActiveTrue();

}
