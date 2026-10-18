import { useEffect, useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Option } from "@/components/option";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, ApiFailure, useRequireLogin, type ApiError } from "@/lib/api";
import { go } from "@/lib/router";
import type { Bank, CaseResponse } from "@/lib/types";

const amount = (v: string) => (v.trim() ? Number(v.replace(/\D/g, "")) : null);

// Figma 04 Case Input / Mobile
export function CaseNew() {
  useRequireLogin();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState({ bankCode: "", accountNo: "", depositAmount: "", frozenAmount: "", depositAt: "" });
  const [threat, setThreat] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api<Bank[]>("/banks").then(setBanks).catch(() => setBanks([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await api<CaseResponse>("/cases", {
        method: "POST",
        body: {
          caseType: "PING_MONEY",
          bankCode: form.bankCode || null,
          accountNo: form.accountNo.replace(/\D/g, "") || null,
          depositAmount: amount(form.depositAmount),
          frozenAmount: amount(form.frozenAmount),
          depositAt: form.depositAt ? new Date(form.depositAt).toISOString() : null,
          threatReceived: threat,
        },
      });
      go(`/cases/${created.id}/diagnosis`);
    } catch (err) {
      if (err instanceof ApiFailure && err.status === 401) return go("/login");
      setError(err instanceof ApiFailure ? err.error : { code: "NETWORK", message: "연결에 실패했어요. 잠시 후 다시 시도해 주세요." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md md:max-w-3xl">
      <TopBar title="사건 정보" progress="1 / 2" />
      <form onSubmit={submit} className="space-y-4 p-6" noValidate>
        <h2 className="text-2xl font-bold">어떤 일이 있었나요?</h2>
        <p className="text-sm text-muted-foreground">모르는 항목은 비워 두세요. 나중에 채워도 돼요.</p>

        <div className="space-y-2">
          <Label htmlFor="bank">은행</Label>
          <select
            id="bank"
            value={form.bankCode}
            onChange={set("bankCode")}
            className="h-12 w-full rounded-xl border border-input bg-background px-4 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">은행 선택</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="계좌번호"
          inputMode="numeric"
          autoComplete="off"
          placeholder="숫자만 입력"
          value={form.accountNo}
          onChange={set("accountNo")}
          hint="암호화해 저장하고, 화면에는 끝 4자리만 보여요."
          error={error?.fields?.accountNo}
        />
        <Field label="모르는 입금액 (원)" inputMode="numeric" placeholder="예: 300000" value={form.depositAmount} onChange={set("depositAmount")} error={error?.fields?.depositAmount} />
        <Field label="묶인 금액 (원)" inputMode="numeric" placeholder="예: 5000000" value={form.frozenAmount} onChange={set("frozenAmount")} error={error?.fields?.frozenAmount} />
        <Field label="입금 일시" type="datetime-local" value={form.depositAt} onChange={set("depositAt")} />

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">돈을 요구하는 협박 연락을 받았나요?</legend>
          <Option name="threat" checked={threat} onChange={() => setThreat(true)}>
            네, 받았어요
          </Option>
          <Option name="threat" checked={!threat} onChange={() => setThreat(false)}>
            아니요
          </Option>
        </fieldset>

        {error && !error.fields && (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        )}
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base">
          다음
        </Button>
      </form>
    </div>
  );
}
