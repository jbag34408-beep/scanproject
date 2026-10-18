package com.unfreeze.global.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.security.SecureRandom;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class AesEncryptorTest {

    private static String randomKey() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }

    private final AesEncryptor encryptor = new AesEncryptor(randomKey());

    @Test
    void roundTrip() {
        String plain = "1234567890123 홍길동";
        assertThat(encryptor.decrypt(encryptor.encrypt(plain))).isEqualTo(plain);
    }

    @Test
    void samePlainTextGivesDifferentCipherText() {
        String plain = "1234567890123";
        String a = encryptor.encrypt(plain);
        String b = encryptor.encrypt(plain);
        assertThat(a).isNotEqualTo(b).doesNotContain(plain);
    }

    @Test
    void tamperedOrWrongKeyFails() {
        String cipher = encryptor.encrypt("secret");
        assertThatThrownBy(() -> new AesEncryptor(randomKey()).decrypt(cipher))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageNotContaining("secret");
    }

    @Test
    void rejectsWrongKeyLength() {
        assertThatThrownBy(() -> new AesEncryptor(Base64.getEncoder().encodeToString(new byte[16])))
                .isInstanceOf(IllegalStateException.class);
    }
}
