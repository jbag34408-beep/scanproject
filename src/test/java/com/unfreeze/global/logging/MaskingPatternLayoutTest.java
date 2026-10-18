package com.unfreeze.global.logging;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class MaskingPatternLayoutTest {

    @Test
    void masksAccountAndPhone() {
        assertThat(MaskingPatternLayout.mask("acct=1234567890123 phone=010-1234-5678 id=42"))
                .isEqualTo("acct=**** phone=**** id=42");
    }

    @Test
    void leavesShortAndTooLongNumbersAlone() {
        assertThat(MaskingPatternLayout.mask("amount=500000 trace=12345678901234567"))
                .isEqualTo("amount=500000 trace=12345678901234567");
    }
}
