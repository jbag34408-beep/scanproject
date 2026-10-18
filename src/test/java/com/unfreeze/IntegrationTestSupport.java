package com.unfreeze;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTestSupport {

    protected static final String ACCOUNT_NO = "1234567890123";
    protected static final String PHONE = "010-1234-5678";
    protected static final String PASSWORD = "password123!";

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

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected MockHttpSession signupAndLogin(String email) throws Exception {
        signup(email).andExpect(status().isCreated());
        return (MockHttpSession) login(email, PASSWORD)
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession(false);
    }

    protected long createCase(MockHttpSession session) throws Exception {
        Map<String, Object> body = Map.of(
                "caseType", "PING_MONEY",
                "bankCode", "004",
                "accountNo", ACCOUNT_NO,
                "depositAmount", 300000,
                "frozenAmount", 5000000,
                "depositAt", "2026-10-01T10:00:00Z",
                "threatReceived", true);
        String res = mockMvc.perform(json(post("/api/v1/cases"), body, session))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(res).at("/data/id").asLong();
    }

    protected ResultActions signup(String email) throws Exception {
        return mockMvc.perform(json(post("/api/v1/auth/signup"),
                Map.of("email", email, "password", PASSWORD, "name", "홍길동", "phone", PHONE), null));
    }

    protected ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(json(post("/api/v1/auth/login"), Map.of("email", email, "password", password), null));
    }

    protected MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, Object body,
                                                 MockHttpSession session) throws Exception {
        builder.with(csrf()).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body));
        return session == null ? builder : builder.session(session);
    }

    protected static String newEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }
}
