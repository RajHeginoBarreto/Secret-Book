package br.com.secretbook.auth;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.secretbook.common.error.ApiException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

/** Teste de unidade (sem banco): roda mesmo sem Docker. */
class LoginAttemptLimiterTest {

	private final MutableClock clock = new MutableClock(Instant.parse("2026-10-26T12:00:00Z"));

	private final LoginAttemptLimiter limiter = new LoginAttemptLimiter(clock, Duration.ofMinutes(15), 3, 5);

	@Test
	void blocksTheAccountAfterTheLimitAndReleasesWhenTheWindowPasses() {
		for (int i = 0; i < 3; i++) {
			limiter.check("ana", "10.0.0.1");
			limiter.recordFailure("ana", "10.0.0.1");
		}
		assertThatThrownBy(() -> limiter.check("Ana", "10.0.0.2")).isInstanceOf(ApiException.class)
			.hasMessage("Muitas tentativas de login. Tente de novo em 15 minutos.");

		clock.advance(Duration.ofMinutes(14));
		assertThatThrownBy(() -> limiter.check("ana", "10.0.0.2"))
			.hasMessage("Muitas tentativas de login. Tente de novo em 1 minuto.");

		clock.advance(Duration.ofMinutes(1));
		assertThatCode(() -> limiter.check("ana", "10.0.0.2")).doesNotThrowAnyException();
	}

	@Test
	void blocksAnIpThatTriesManyDifferentAccounts() {
		for (int i = 0; i < 5; i++) {
			limiter.recordFailure("conta-" + i, "10.0.0.9");
		}
		assertThatThrownBy(() -> limiter.check("outra-conta", "10.0.0.9")).isInstanceOf(ApiException.class);
		assertThatCode(() -> limiter.check("outra-conta", "10.0.0.10")).doesNotThrowAnyException();
	}

	@Test
	void successClearsTheAccountCounter() {
		limiter.recordFailure("bia", "10.0.0.1");
		limiter.recordFailure("bia", "10.0.0.1");
		limiter.recordSuccess("BIA");
		limiter.recordFailure("bia", "10.0.0.1");
		limiter.recordFailure("bia", "10.0.0.1");
		assertThatCode(() -> limiter.check("bia", "10.0.0.1")).doesNotThrowAnyException();
	}

	private static final class MutableClock extends Clock {

		private Instant now;

		MutableClock(Instant now) {
			this.now = now;
		}

		void advance(Duration duration) {
			now = now.plus(duration);
		}

		@Override
		public Instant instant() {
			return now;
		}

		@Override
		public ZoneOffset getZone() {
			return ZoneOffset.UTC;
		}

		@Override
		public Clock withZone(java.time.ZoneId zone) {
			return this;
		}

	}

}
