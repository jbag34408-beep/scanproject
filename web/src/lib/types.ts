// 백엔드 DTO와 1:1 (unfreeze-api)

export type Bank = { code: string; name: string };

export type CaseStatus = "DRAFT" | "DIAGNOSED" | "PREPARING" | "SUBMITTED" | "PARTIAL_RELEASED" | "CLOSED";

export type CaseResponse = {
  id: number;
  status: CaseStatus;
  bankCode: string | null;
  accountLast4: string | null;
  createdAt: string;
};

export type Checklist = {
  caseId: number;
  ruleVersion: string;
  items: {
    key: string;
    kind: "STEP" | "DOCUMENT";
    title: string;
    detail: string | null;
    need: "REQUIRED" | "RECOMMENDED" | null;
    checked: boolean;
  }[];
  done: number;
  total: number;
};

export type AlertLevel = "URGENT" | "DEADLINE" | "INFO" | "WARNING";

export type Diagnosis = {
  diagnosisId: number;
  caseId: number;
  ruleVersion: string;
  createdAt: string;
  alerts: { level: AlertLevel; code: string; message: string }[];
  pathways: { code: string; title: string; reason: string }[];
  steps: { order: number; title: string; detail: string; bankCode: string | null }[];
  documents: { code: string; name: string; need: "REQUIRED" | "RECOMMENDED"; ready: boolean | null }[];
  amounts: {
    frozenAmount: number | null;
    depositAmount: number | null;
    referenceDifference: number | null;
    note: string | null;
  };
  missingInputs: string[];
  disclaimer: string;
};
