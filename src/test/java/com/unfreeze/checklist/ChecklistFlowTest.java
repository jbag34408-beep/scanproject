package com.unfreeze.checklist;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.unfreeze.IntegrationTestSupport;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

class ChecklistFlowTest extends IntegrationTestSupport {

    private static final Map<String, Object> ANSWERS = Map.ofEntries(
            Map.entry("knowsDepositor", "NO"),
            Map.entry("depositReason", "UNKNOWN"),
            Map.entry("transferStage", "FIRST"),
            Map.entry("bankNoticeReceived", true),
            Map.entry("writtenClaimFiled", "YES"),
            Map.entry("priorFreeze", "NO"),
            Map.entry("accountUsage", "LIVING"),
            Map.entry("paidToThreatener", "NONE"),
            Map.entry("policeReported", true),
            Map.entry("policeSummoned", false),
            Map.entry("otherRestrictions", "NO"),
            Map.entry("accountHandedOver", false),
            Map.entry("evidence", List.of("TRANSACTION_HISTORY")));

    private long diagnosedCase(MockHttpSession session) throws Exception {
        long caseId = createCase(session);
        mockMvc.perform(json(post("/api/v1/cases/{id}/diagnoses", caseId), ANSWERS, session))
                .andExpect(status().isCreated());
        return caseId;
    }

    @Test
    void checklistFollowsLatestDiagnosisAndSavesChecks() throws Exception {
        MockHttpSession session = signupAndLogin(newEmail());
        long caseId = diagnosedCase(session);

        mockMvc.perform(get("/api/v1/cases/{id}/checklist", caseId).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].key").value("STEP:은행에 지급정지 내용 확인"))
                .andExpect(jsonPath("$.data.items[0].checked").value(false))
                // 진단 때 갖고 있다고 답한 서류는 기본으로 체크된다
                .andExpect(jsonPath("$.data.items[?(@.key=='DOC:TRANSACTION_HISTORY')].checked").value(true))
                .andExpect(jsonPath("$.data.done").value(1));

        mockMvc.perform(json(put("/api/v1/cases/{id}/checklist", caseId),
                        Map.of("key", "STEP:은행에 지급정지 내용 확인", "checked", true), session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].checked").value(true))
                .andExpect(jsonPath("$.data.done").value(2));
        // 기본 체크된 서류도 해제할 수 있다
        mockMvc.perform(json(put("/api/v1/cases/{id}/checklist", caseId),
                        Map.of("key", "DOC:TRANSACTION_HISTORY", "checked", false), session))
                .andExpect(jsonPath("$.data.done").value(1));

        mockMvc.perform(get("/api/v1/cases/{id}", caseId).session(session))
                .andExpect(jsonPath("$.data.status").value("PREPARING"));
    }

    @Test
    void unknownKeyIsRejected() throws Exception {
        MockHttpSession session = signupAndLogin(newEmail());
        long caseId = diagnosedCase(session);

        mockMvc.perform(json(put("/api/v1/cases/{id}/checklist", caseId),
                        Map.of("key", "STEP:없는 항목", "checked", true), session))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void requiresDiagnosisAndOwnership() throws Exception {
        MockHttpSession owner = signupAndLogin(newEmail());
        long notDiagnosed = createCase(owner);
        mockMvc.perform(get("/api/v1/cases/{id}/checklist", notDiagnosed).session(owner))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("DIAGNOSIS_NOT_FOUND"));

        long caseId = diagnosedCase(owner);
        MockHttpSession other = signupAndLogin(newEmail());
        mockMvc.perform(get("/api/v1/cases/{id}/checklist", caseId).session(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("CASE_NOT_FOUND"));
        mockMvc.perform(json(put("/api/v1/cases/{id}/checklist", caseId),
                        Map.of("key", "DOC:TRANSACTION_HISTORY", "checked", false), other))
                .andExpect(status().isNotFound());
    }
}
