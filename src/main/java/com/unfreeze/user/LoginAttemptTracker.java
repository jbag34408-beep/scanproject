package com.unfreeze.user;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * 이메일별 연속 로그인 실패 5회 시 15분 잠금.
 */
// TODO: 서버를 여러 대로 늘리면 Redis로 전환
// shortcut: 서버 메모리에만 저장(재시작 시 초기화, 정리 없이 쌓임), 다중 인스턴스 배포 전에 Redis로 교체
@Component
public class LoginAttemptTracker {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptTracker() {
        this(Clock.systemUTC());
    }

    LoginAttemptTracker(Clock clock) {
        this.clock = clock;
    }

    public boolean isLocked(String key) {
        Attempt a = attempts.get(key);
        return a != null && a.lockedUntil() != null && clock.instant().isBefore(a.lockedUntil());
    }

    public void recordFailure(String key) {
        attempts.compute(key, (k, a) -> {
            // 잠금이 풀린 뒤의 실패는 새로 센다
            int failures = (a == null || a.lockedUntil() != null) ? 1 : a.failures() + 1;
            return failures >= MAX_FAILURES
                    ? new Attempt(0, clock.instant().plus(LOCK_DURATION))
                    : new Attempt(failures, null);
        });
    }

    public void reset(String key) {
        attempts.remove(key);
    }

    private record Attempt(int failures, Instant lockedUntil) {
    }
}
