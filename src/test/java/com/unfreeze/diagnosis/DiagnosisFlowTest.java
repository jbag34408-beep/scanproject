package com.unfreeze.diagnosis;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.unfreeze.IntegrationTestSupport;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

class DiagnosisFlowTest extends IntegrationTestSupport {

    private static final Map<String, Object> ANSWERS = Map.ofEntries(
            Map.entry("knowsDepositor", "NO"),
            Map.entry("depositReason", "UNKNOWN"),
            Map.entry("transferStage", "FIRST"),
            Map.entry("bankNoticeReceived", true),
            Map.entry("writtenClaimFiled", "YES"),
            Map.entry("claimNoticeDate", "2026-10-05"),
            Map.entry("priorFreeze", "NO"),
            Map.entry("accountUsage", "LIVING"),
            Map.entry("paidToThreatener", "NONE"),
            Map.entry("policeReported", false),
            Map.entry("policeSummoned", false),
            Map.entry("otherRestrictions", "NO"),
            Map.entry("accountHandedOver", false),
            Map.entry("evidence", List.of("TRANSACTION_HISTORY")));

    @Test
    void diagnoseAndReadLatest() throws Exception {
        MockHttpSession session = signupAndLogin(newEmail());
        long caseId = createCase(session);

        mockMvc.perform(get("/api/v1/cases/{id}/diagnoses/latest", caseId).session(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("DIAGNOSIS_NOT_FOUND"));

        String res = mockMvc.perform(json(post("/api/v1/cases/{id}/diagnoses", caseId), ANSWERS, session))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.caseId").value(caseId))
                .andExpect(jsonPath("$.data.ruleVersion").value(DiagnosisRules.VERSION))
                // threatReceived=true 사건이므로 협박 경고가 붙는다
                .andExpect(jsonPath("$.data.alerts[0].code").value("THREAT_DO_NOT_PAY"))
                .andExpect(jsonPath("$.data.alerts[1].code").value("OBJECTION_DEADLINE"))
                .andExpect(jsonPath("$.data.pathways[*].code").value(
                        org.hamcrest.Matchers.contains("REPORT_THREAT", "OBJECTION_PARTIAL_RELEASE", "SETTLE_VIA_BANK")))
                .andExpect(jsonPath("$.data.steps[*].bankCode").value(org.hamcrest.Matchers.hasItem("004")))
                .andExpect(jsonPath("$.data.amounts.referenceDifference").value(4_700_000))
                .andExpect(jsonPath("$.data.disclaimer").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        assertThat(res).doesNotContain(ACCOUNT_NO).doesNotContain("accountHandedOver");

        mockMvc.perform(get("/api/v1/cases/{id}", caseId).session(session))
                .andExpect(jsonPath("$.data.status").value("DIAGNOSED"));
        mockMvc.perform(get("/api/v1/cases/{id}/diagnoses/latest", caseId).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pathways[1].code").value("OBJECTION_PARTIAL_RELEASE"));
    }

    @Test
    void otherUserCannotDiagnoseOrRead() throws Exception {
        long caseId = createCase(signupAndLogin(newEmail()));
        MockHttpSession other = signupAndLogin(newEmail());

        mockMvc.perform(json(post("/api/v1/cases/{id}/diagnoses", caseId), ANSWERS, other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("CASE_NOT_FOUND"));
        mockMvc.perform(get("/api/v1/cases/{id}/diagnoses/latest", caseId).session(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("CASE_NOT_FOUND"));
    }

    @Test
    void missingAnswersAreValidated() throws Exception {
        MockHttpSession session = signupAndLogin(newEmail());
        long caseId = createCase(session);

        mockMvc.perform(json(post("/api/v1/cases/{id}/diagnoses", caseId), Map.of("knowsDepositor", "NO"), session))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields.depositReason").exists())
                .andExpect(jsonPath("$.error.fields.accountHandedOver").exists());
    }
}
