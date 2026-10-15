package br.com.secretbook;

import org.springframework.boot.SpringApplication;

public class TestSecretbookApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(SecretbookApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
