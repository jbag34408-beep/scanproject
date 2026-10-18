package com.unfreeze.cases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unfreeze.IntegrationTestSupport;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class CaseFlowTest extends IntegrationTestSupport {

    private static final String ACCOUNT_NO = "1234567890123";
    private static final String PHONE = "010-1234-5678";
    private static final String PASSWORD = "password123!";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Test
    void signupLoginCreateAndGetCase() throws Exception {
        String email = newEmail();
        MockHttpSession session = signupAndLogin(email);

        mockMvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email));

        long caseId = createCase(session);

        String detail = mockMvc.perform(get("/api/v1/cases/{id}", caseId).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accountLast4").value("0123"))
                .andExpect(jsonPath("$.data.bankCode").value("004"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.error").isEmpty())
                .andReturn().getResponse().getContentAsString();
        String list = mockMvc.perform(get("/api/v1/cases").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andReturn().getResponse().getContentAsString();

        // 응답에 계좌번호 원문이 없다
        assertThat(detail).doesNotContain(ACCOUNT_NO).doesNotContain("accountNo\"");
        assertThat(list).doesNotContain(ACCOUNT_NO);

        // DB에도 원문이 저장되지 않는다
        String accountEnc = jdbcTemplate.queryForObject(
                "select account_no_enc from cases where id = ?", String.class, caseId);
        String phoneEnc = jdbcTemplate.queryForObject(
                "select phone_enc from users where email = ?", String.class, email);
        assertThat(accountEnc).isNotBlank().doesNotContain(ACCOUNT_NO);
        assertThat(phoneEnc).isNotBlank().doesNotContain(PHONE);

        mockMvc.perform(json(patch("/api/v1/cases/{id}", caseId), Map.of("status", "SUBMITTED"), session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.data.accountLast4").value("0123"));

        mockMvc.perform(post("/api/v1/auth/logout").with(csrf()).session(session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/cases").session(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void otherUsersCaseIsNotFound() throws Exception {
        long caseId = createCase(signupAndLogin(newEmail()));
        MockHttpSession other = signupAndLogin(newEmail());

        mockMvc.perform(get("/api/v1/cases/{id}", caseId).session(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.data").isEmpty())
                .andExpect(jsonPath("$.error.code").value("CASE_NOT_FOUND"));
        mockMvc.perform(json(patch("/api/v1/cases/{id}", caseId), Map.of("status", "CLOSED"), other))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/cases").session(other))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void requiresLoginAndCsrf() throws Exception {
        mockMvc.perform(get("/api/v1/cases"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));

        MockHttpSession session = signupAndLogin(newEmail());
        mockMvc.perform(post("/api/v1/cases").session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"caseType\":\"OTHER\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void validationErrorHasFieldMessages() throws Exception {
        MockHttpSession session = signupAndLogin(newEmail());
        mockMvc.perform(json(post("/api/v1/cases"), Map.of("accountNo", "12-34"), session))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"))
                .andExpect(jsonPath("$.error.fields.caseType").exists())
                .andExpect(jsonPath("$.error.fields.accountNo").exists());
    }

    @Test
    void duplicateEmailAndLockout() throws Exception {
        String email = newEmail();
        signup(email).andExpect(status().isCreated());
        signup(email).andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_DUPLICATED"));

        for (int i = 0; i < 5; i++) {
            login(email, "wrong-password").andExpect(status().isUnauthorized());
        }
        login(email, PASSWORD).andExpect(status().isLocked())
                .andExpect(jsonPath("$.error.code").value("ACCOUNT_LOCKED"));
    }

    private MockHttpSession signupAndLogin(String email) throws Exception {
        signup(email).andExpect(status().isCreated());
        return (MockHttpSession) login(email, PASSWORD)
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession(false);
    }

    private long createCase(MockHttpSession session) throws Exception {
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
        assertThat(res).doesNotContain(ACCOUNT_NO);
        return objectMapper.readTree(res).at("/data/id").asLong();
    }

    private ResultActions signup(String email) throws Exception {
        return mockMvc.perform(json(post("/api/v1/auth/signup"),
                Map.of("email", email, "password", PASSWORD, "name", "홍길동", "phone", PHONE), null));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(json(post("/api/v1/auth/login"), Map.of("email", email, "password", password), null));
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, Object body,
                                               MockHttpSession session) throws Exception {
        builder.with(csrf()).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body));
        return session == null ? builder : builder.session(session);
    }

    private static String newEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }
}
