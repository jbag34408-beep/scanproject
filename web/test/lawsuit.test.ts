import { test } from "node:test";
import assert from "node:assert/strict";
import { serviceFee, stampFee } from "../src/lib/lawsuit.ts";

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
