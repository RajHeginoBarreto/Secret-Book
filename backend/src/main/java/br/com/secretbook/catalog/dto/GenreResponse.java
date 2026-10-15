package br.com.secretbook.catalog.dto;

public record GenreResponse(String slug, String name, String description, long bookCount) {
}
