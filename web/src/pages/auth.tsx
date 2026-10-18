import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { api, ApiFailure, type ApiError } from "@/lib/api";
import { go } from "@/lib/router";

// Figma 03 Login / Mobile. 회원가입도 같은 화면 구성을 쓴다.
export function Auth({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (signup) await api("/auth/signup", { method: "POST", body: { ...form, phone: form.phone || null } });
      await api("/auth/login", { method: "POST", body: { email: form.email, password: form.password } });
      // 새로 가입하면 바로 사건 등록, 기존 사용자는 내 사건 목록에서 이어서
      go(signup ? "/cases/new" : "/cases");
    } catch (err) {
      setError(err instanceof ApiFailure ? err.error : { code: "NETWORK", message: "연결에 실패했어요. 잠시 후 다시 시도해 주세요." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <TopBar title={signup ? "회원가입" : "로그인"} />
      <form onSubmit={submit} className="space-y-4 p-6" noValidate>
        <h2 className="text-2xl font-bold">{signup ? "계정을 만들어 주세요" : "다시 오셨네요"}</h2>
        <p className="text-sm text-muted-foreground">
          {signup ? "사건과 진단 결과를 저장해 두고 이어서 볼 수 있어요." : "저장해 둔 사건과 진단 결과를 이어서 볼 수 있어요."}
        </p>
        <Field label="이메일" type="email" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={set("email")} error={error?.fields?.email} required />
        <Field
          label="비밀번호"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder="8자 이상"
          value={form.password}
          onChange={set("password")}
          hint={signup ? "8~72자" : "5회 연속 틀리면 15분 동안 로그인이 제한돼요."}
          error={error?.fields?.password}
          required
        />
        {signup && (
          <>
            <Field label="이름" autoComplete="name" value={form.name} onChange={set("name")} error={error?.fields?.name} required />
            <Field
              label="휴대폰 번호 (선택)"
              type="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              value={form.phone}
              onChange={set("phone")}
              hint="암호화해 저장해요."
              error={error?.fields?.phone}
            />
          </>
        )}
        {error && !error.fields && (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        )}
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base">
          {signup ? "가입하고 시작하기" : "로그인"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {signup ? (
            <>
              이미 계정이 있나요? <a href="#/login" className="underline">로그인</a>
            </>
          ) : (
            <>
              처음이신가요? <a href="#/signup" className="underline">회원가입</a>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
