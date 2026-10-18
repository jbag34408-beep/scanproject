package com.unfreeze.lawsuit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.unfreeze.IntegrationTestSupport;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

class LawsuitFlowTest extends IntegrationTestSupport {

    @Test
    void recordLawsuitProgressAndCaseBecomesLawsuit() throws Exception {
        MockHttpSession session = signupAndLogin(newEmail());
        long caseId = createCase(session);

        mockMvc.perform(get("/api/v1/cases/{id}/lawsuit", caseId).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        Map<String, Object> body = new HashMap<>(Map.of(
                "court", "서울중앙지방법원",
                "caseNumber", "2026가단12345",
                "filedAt", "2026-10-20",
                "hearingAt", "2026-11-20T10:30:00"));
        mockMvc.perform(json(put("/api/v1/cases/{id}/lawsuit", caseId), body, session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.caseNumber").value("2026가단12345"))
                .andExpect(jsonPath("$.data.hearingAt").value("2026-11-20T10:30:00"));
        mockMvc.perform(get("/api/v1/cases/{id}", caseId).session(session))
                .andExpect(jsonPath("$.data.status").value("LAWSUIT"));

        // PUT은 통째로 바꾼다: 보내지 않은 기일은 비워진다
        body.remove("hearingAt");
        body.put("judgmentServedAt", "2026-12-15");
        body.put("result", "WON");
        mockMvc.perform(json(put("/api/v1/cases/{id}/lawsuit", caseId), body, session))
                .andExpect(jsonPath("$.data.hearingAt").doesNotExist())
                .andExpect(jsonPath("$.data.result").value("WON"));
    }

    @Test
    void othersCannotSeeLawsuitAndInputIsValidated() throws Exception {
        MockHttpSession owner = signupAndLogin(newEmail());
        long caseId = createCase(owner);
        MockHttpSession other = signupAndLogin(newEmail());

        mockMvc.perform(get("/api/v1/cases/{id}/lawsuit", caseId).session(other))
                .andExpect(status().isNotFound());
        mockMvc.perform(json(put("/api/v1/cases/{id}/lawsuit", caseId), Map.of("caseNumber", "x".repeat(31)), owner))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(put("/api/v1/cases/{id}/lawsuit", caseId), Map.of("result", "MAYBE"), owner))
                .andExpect(status().isBadRequest());
    }
}
