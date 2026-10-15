package br.com.secretbook.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI secretbookOpenApi() {
		return new OpenAPI().info(new Info()
			.title("Secret Book API")
			.version("v1")
			.description("API do Secret Book, plataforma de descoberta literária. "
				+ "Protótipo de portfólio: planos, valores e assinaturas são demonstrativos. "
				+ "Erros seguem o formato Problem Details (RFC 9457)."));
	}

}
