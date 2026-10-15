package br.com.secretbook.catalog.dto;

import java.util.List;

public record AuthorDetail(String slug, String name, String bio, List<BookSummary> books) {
}
