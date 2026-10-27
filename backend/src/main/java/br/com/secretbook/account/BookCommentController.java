package br.com.secretbook.account;

import br.com.secretbook.account.dto.AccountDtos.BookCommentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
@Tag(name = "Catálogo", description = "Livros, autores e gêneros (dados demonstrativos)")
public class BookCommentController {

	private final AccountService account;

	public BookCommentController(AccountService account) {
		this.account = account;
	}

	@GetMapping("/{slug}/comments")
	@Operation(summary = "Comentários públicos de quem já leu o livro, do mais novo ao mais antigo")
	public List<BookCommentResponse> comments(@PathVariable String slug) {
		return account.bookComments(slug);
	}

}
