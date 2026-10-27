package br.com.secretbook.auth;

import br.com.secretbook.common.error.ApiException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Proteção contra força bruta no login: conta as falhas recentes por conta (nome de usuário) e por endereço IP.
 * Passado o limite dentro da janela, novas tentativas são recusadas com 429 até a falha mais antiga sair da janela.
 * Um login certo zera o contador da conta. Os contadores ficam em memória (uma instância do backend).
 */
@Component
public class LoginAttemptLimiter {

	private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

	private final Clock clock;

	private final Duration window;

	private final int maxPerAccount;

	private final int maxPerIp;

	public LoginAttemptLimiter(Clock clock, @Value("${secretbook.auth.login-window:15m}") Duration window,
			@Value("${secretbook.auth.login-max-failures-per-account:5}") int maxPerAccount,
			@Value("${secretbook.auth.login-max-failures-per-ip:30}") int maxPerIp) {
		this.clock = clock;
		this.window = window;
		this.maxPerAccount = maxPerAccount;
		this.maxPerIp = maxPerIp;
	}

	/** Recusa a tentativa (429) se a conta ou o IP já erraram demais na janela atual. */
	public void check(String username, String ip) {
		Instant now = clock.instant();
		Duration wait = max(waitFor(accountKey(username), maxPerAccount, now), waitFor(ipKey(ip), maxPerIp, now));
		if (!wait.isZero()) {
			long minutes = Math.max(1, (wait.toSeconds() + 59) / 60);
			throw ApiException.tooManyRequests("Muitas tentativas de login. Tente de novo em %d %s."
				.formatted(minutes, minutes == 1 ? "minuto" : "minutos"));
		}
	}

	public void recordFailure(String username, String ip) {
		Instant now = clock.instant();
		record(accountKey(username), now);
		record(ipKey(ip), now);
	}

	public void recordSuccess(String username) {
		failures.remove(accountKey(username));
	}

	/** Esquece todas as falhas (usado nos testes). */
	public void clear() {
		failures.clear();
	}

	private Duration waitFor(String key, int max, Instant now) {
		Deque<Instant> attempts = failures.get(key);
		if (attempts == null) {
			return Duration.ZERO;
		}
		synchronized (attempts) {
			prune(attempts, now);
			if (attempts.size() < max) {
				return Duration.ZERO;
			}
			return Duration.between(now, attempts.peekFirst().plus(window));
		}
	}

	private void record(String key, Instant now) {
		Deque<Instant> attempts = failures.computeIfAbsent(key, ignored -> new ArrayDeque<>());
		synchronized (attempts) {
			prune(attempts, now);
			attempts.addLast(now);
		}
	}

	private void prune(Deque<Instant> attempts, Instant now) {
		Instant limit = now.minus(window);
		while (!attempts.isEmpty() && !attempts.peekFirst().isAfter(limit)) {
			attempts.removeFirst();
		}
	}

	private static Duration max(Duration a, Duration b) {
		return a.compareTo(b) >= 0 ? a : b;
	}

	private static String accountKey(String username) {
		return "conta:" + (username == null ? "" : username.toLowerCase(Locale.ROOT));
	}

	private static String ipKey(String ip) {
		return "ip:" + (ip == null ? "desconhecido" : ip);
	}

}
