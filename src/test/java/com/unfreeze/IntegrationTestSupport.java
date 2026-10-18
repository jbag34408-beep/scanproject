package com.unfreeze;

import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTestSupport {

    // JVM당 한 번만 띄워 스프링 컨텍스트 캐시와 함께 모든 테스트 클래스가 공유한다
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16");
    static final String CRYPTO_KEY;

    static {
        POSTGRES.start();
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        CRYPTO_KEY = Base64.getEncoder().encodeToString(key);
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("unfreeze.crypto.key", () -> CRYPTO_KEY);
    }
}
