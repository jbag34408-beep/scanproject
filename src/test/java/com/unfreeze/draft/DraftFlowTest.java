package com.unfreeze.draft;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.unfreeze.IntegrationTestSupport;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;

class DraftFlowTest extends IntegrationTestSupport {

    private static final String CONTENT = "{\"name\":\"홍길동\",\"accountNo\":\"123-456789-01234\"}";

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Autowired
    DraftService draftService;

    @Test
    void saveReadAndDeleteDraftEncrypted() throws Exception {
        MockHttpSession session = signupAndLogin(newEmail());
        long caseId = createCase(session);

        // 저장 전에는 비어 있다
        mockMvc.perform(get("/api/v1/cases/{id}/drafts/COMPLAINT", caseId).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        mockMvc.perform(json(put("/api/v1/cases/{id}/drafts/COMPLAINT", caseId), Map.of("content", CONTENT), session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value(CONTENT))
                .andExpect(jsonPath("$.data.updatedAt").exists());
        mockMvc.perform(get("/api/v1/cases/{id}/drafts/COMPLAINT", caseId).session(session))
                .andExpect(jsonPath("$.data.content").value(CONTENT));

        // DB에는 암호문만 있다
        String stored = jdbcTemplate.queryForObject(
                "select content_enc from document_drafts where case_id = ?", String.class, caseId);
        assertThat(stored).doesNotContain("홍길동").doesNotContain("123-456789-01234");

        mockMvc.perform(delete("/api/v1/cases/{id}/drafts/COMPLAINT", caseId).with(csrf()).session(session))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/cases/{id}/drafts/COMPLAINT", caseId).session(session))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void othersCannotReadDraftAndBadKindIsRejected() throws Exception {
        MockHttpSession owner = signupAndLogin(newEmail());
        long caseId = createCase(owner);
        mockMvc.perform(json(put("/api/v1/cases/{id}/drafts/OBJECTION", caseId), Map.of("content", CONTENT), owner))
                .andExpect(status().isOk());

        MockHttpSession other = signupAndLogin(newEmail());
        mockMvc.perform(get("/api/v1/cases/{id}/drafts/OBJECTION", caseId).session(other))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/cases/{id}/drafts/UNKNOWN", caseId).session(owner))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(put("/api/v1/cases/{id}/drafts/OBJECTION", caseId), Map.of("content", "x".repeat(20_001)), owner))
                .andExpect(status().isBadRequest());
    }

    @Test
    void expiredDraftsArePurged() throws Exception {
        MockHttpSession session = signupAndLogin(newEmail());
        long caseId = createCase(session);
        mockMvc.perform(json(put("/api/v1/cases/{id}/drafts/OBJECTION", caseId), Map.of("content", CONTENT), session))
                .andExpect(status().isOk());

        // 기준 시각보다 먼저 수정된 초안은 지운다(보관기간 90일 배치와 같은 쿼리)
        assertThat(draftService.purgeUpdatedBefore(Instant.now().plusSeconds(60))).isGreaterThanOrEqualTo(1);
        mockMvc.perform(get("/api/v1/cases/{id}/drafts/OBJECTION", caseId).session(session))
                .andExpect(jsonPath("$.data").doesNotExist());
    }
}
