package br.com.secretbook.quiz;

import br.com.secretbook.quiz.engine.Dimension;
import br.com.secretbook.quiz.engine.Effect;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.math.BigDecimal;
import java.util.Objects;

@Embeddable
public class OptionEffect {

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Dimension dimension;

	@Column(nullable = false)
	private String value;

	@Column(nullable = false, precision = 4, scale = 2)
	private BigDecimal weight;

	protected OptionEffect() {
	}

	public Effect toEffect() {
		return new Effect(dimension, value, weight.doubleValue());
	}

	@Override
	public boolean equals(Object other) {
		return other instanceof OptionEffect effect && dimension == effect.dimension
				&& Objects.equals(value, effect.value);
	}

	@Override
	public int hashCode() {
		return Objects.hash(dimension, value);
	}

}
