package br.com.secretbook.catalog;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderColumn;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
public class Book {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String slug;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false)
	private String synopsis;

	private Integer publicationYear;

	@Column(nullable = false)
	private int pages;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Pace pace;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Tone tone;

	@Column(nullable = false)
	private String coverColor = "#1f3f6b";

	@Column(nullable = false)
	private boolean active = true;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	@ManyToMany
	@JoinTable(name = "book_author", joinColumns = @JoinColumn(name = "book_id"),
			inverseJoinColumns = @JoinColumn(name = "author_id"))
	@OrderColumn(name = "position")
	private List<Author> authors = new ArrayList<>();

	@ManyToMany
	@JoinTable(name = "book_genre", joinColumns = @JoinColumn(name = "book_id"),
			inverseJoinColumns = @JoinColumn(name = "genre_id"))
	private Set<Genre> genres = new LinkedHashSet<>();

	@ElementCollection
	@CollectionTable(name = "book_content_note", joinColumns = @JoinColumn(name = "book_id"))
	@Column(name = "note", nullable = false)
	@Enumerated(EnumType.STRING)
	private Set<ContentNote> contentNotes = EnumSet.noneOf(ContentNote.class);

	@ElementCollection
	@CollectionTable(name = "book_clue", joinColumns = @JoinColumn(name = "book_id"))
	@OrderColumn(name = "position")
	@Column(name = "text", nullable = false)
	private List<String> clues = new ArrayList<>();

	protected Book() {
	}

	public Book(String slug, String title) {
		this.slug = slug;
		this.title = title;
	}

	public LengthCategory getLength() {
		return LengthCategory.fromPages(pages);
	}

	public Long getId() {
		return id;
	}

	public String getSlug() {
		return slug;
	}

	public void setSlug(String slug) {
		this.slug = slug;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getSynopsis() {
		return synopsis;
	}

	public void setSynopsis(String synopsis) {
		this.synopsis = synopsis;
	}

	public Integer getPublicationYear() {
		return publicationYear;
	}

	public void setPublicationYear(Integer publicationYear) {
		this.publicationYear = publicationYear;
	}

	public int getPages() {
		return pages;
	}

	public void setPages(int pages) {
		this.pages = pages;
	}

	public Pace getPace() {
		return pace;
	}

	public void setPace(Pace pace) {
		this.pace = pace;
	}

	public Tone getTone() {
		return tone;
	}

	public void setTone(Tone tone) {
		this.tone = tone;
	}

	public String getCoverColor() {
		return coverColor;
	}

	public void setCoverColor(String coverColor) {
		this.coverColor = coverColor;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public List<Author> getAuthors() {
		return authors;
	}

	public void setAuthors(List<Author> authors) {
		this.authors.clear();
		this.authors.addAll(authors);
	}

	public Set<Genre> getGenres() {
		return genres;
	}

	public void setGenres(Set<Genre> genres) {
		this.genres.clear();
		this.genres.addAll(genres);
	}

	public Set<ContentNote> getContentNotes() {
		return contentNotes;
	}

	public void setContentNotes(Set<ContentNote> contentNotes) {
		this.contentNotes.clear();
		this.contentNotes.addAll(contentNotes);
	}

	public List<String> getClues() {
		return clues;
	}

	public void setClues(List<String> clues) {
		this.clues.clear();
		this.clues.addAll(clues);
	}

}
