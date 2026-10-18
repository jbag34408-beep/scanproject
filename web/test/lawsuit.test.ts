import { test } from "node:test";
import assert from "node:assert/strict";
import { appealDeadline, lawsuitSteps, serviceFee, stampFee } from "../src/lib/lawsuit.ts";

test("인지액은 구간별 요율, 100원 미만 버림, 최소 1,000원", () => {
  assert.equal(stampFee(100_000), 1_000); // 500원 → 최소액
  assert.equal(stampFee(300_000), 1_500);
  assert.equal(stampFee(9_999_999), 49_900);
  assert.equal(stampFee(10_000_000), 50_000);
  assert.equal(stampFee(30_000_000), 140_000);
  assert.equal(stampFee(100_000_000), 455_000);
});

test("송달료는 당사자 수 × 15회분", () => {
  assert.equal(serviceFee(), 165_000);
});

test("항소 기한은 판결정본 받은 날 + 14일", () => {
  assert.equal(appealDeadline("2026-12-15"), "2026-12-29");
  assert.equal(appealDeadline("2026-12-25"), "2027-01-08");
});

test("소송 단계: 소제기증명원 미제출은 급함, 기일은 D-day 계산", () => {
  const base = { court: null, caseNumber: null, proofSubmittedAt: null, judgmentServedAt: null, result: null, finalizedAt: null };
  const steps = lawsuitSteps({ ...base, filedAt: "2026-10-20", hearingAt: "2026-11-20T10:30:00" }, "2026-11-10");
  assert.deepEqual(steps.map((s) => s.done), [true, false, false, false, false]);
  assert.equal(steps[1].urgent, true);
  assert.equal(steps[2].dday, 10);

  const judged = lawsuitSteps({ ...base, filedAt: "2026-10-20", hearingAt: null, judgmentServedAt: "2026-12-15", result: "LOST" }, "2026-12-24");
  assert.equal(judged[3].due, "2026-12-29");
  assert.equal(judged[3].urgent, true);
  assert.match(judged[3].todo, /132/);
});
