package br.com.secretbook.auth.dto;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

/** Regra de senha: 8 a 64 caracteres, com pelo menos uma letra e um número. */
@NotBlank(message = "é obrigatória")
@Size(min = 8, max = 64, message = "deve ter entre 8 e 64 caracteres")
@Pattern(regexp = "^(?=.*\\p{L})(?=.*\\d).*$", message = "deve ter letras e números")
@Documented
@Constraint(validatedBy = {})
@Target({ FIELD, METHOD, PARAMETER })
@Retention(RUNTIME)
public @interface ValidPassword {

	String message() default "senha inválida";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

}
