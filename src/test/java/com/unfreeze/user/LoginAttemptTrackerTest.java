package com.unfreeze.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class LoginAttemptTrackerTest {

    static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    private final MutableClock clock = new MutableClock();
    private final LoginAttemptTracker tracker = new LoginAttemptTracker(clock);

    @Test
    void locksAfterFiveFailuresForFifteenMinutes() {
        for (int i = 0; i < 4; i++) tracker.recordFailure("a@b.c");
        assertThat(tracker.isLocked("a@b.c")).isFalse();

        tracker.recordFailure("a@b.c");
        assertThat(tracker.isLocked("a@b.c")).isTrue();

        clock.now = clock.now.plus(Duration.ofMinutes(15));
        assertThat(tracker.isLocked("a@b.c")).isFalse();

        // 잠금 해제 후 한 번 실패로 다시 잠기지 않는다
        tracker.recordFailure("a@b.c");
        assertThat(tracker.isLocked("a@b.c")).isFalse();
    }

    @Test
    void resetClearsFailures() {
        for (int i = 0; i < 4; i++) tracker.recordFailure("a@b.c");
        tracker.reset("a@b.c");
        tracker.recordFailure("a@b.c");
        assertThat(tracker.isLocked("a@b.c")).isFalse();
    }
}
