import { useState } from "react";
import { Option } from "@/components/option";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiFailure, useRequireLogin } from "@/lib/api";
import { QUESTIONS } from "@/lib/questions";
import { go } from "@/lib/router";

type Answers = Record<string, unknown>;

// Figma 05 Diagnosis Question / Mobile. 한 화면에 한 질문씩.
export function DiagnosisQuestions({ caseId }: { caseId: string }) {
  useRequireLogin();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ evidence: [] });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const q = QUESTIONS[index];
  const value = answers[q.key];
  const last = index === QUESTIONS.length - 1;
  // 공고일(날짜)과 자료(복수 선택)는 비워도 넘어갈 수 있다
  const answered = q.type !== "single" || value !== undefined;
  const setValue = (v: unknown) => setAnswers({ ...answers, [q.key]: v });

  async function next() {
    if (!last) return setIndex(index + 1);
    setBusy(true);
    setError(null);
    try {
      await api(`/cases/${caseId}/diagnoses`, {
        method: "POST",
        body: { ...answers, claimNoticeDate: answers.claimNoticeDate || null },
      });
      go(`/cases/${caseId}/result`);
    } catch (err) {
      if (err instanceof ApiFailure && err.status === 401) return go("/login");
      setError(err instanceof ApiFailure ? err.message : "연결에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <TopBar title="상황 진단" progress={`${index + 1} / ${QUESTIONS.length}`} />
      <div className="h-1 bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-valuenow={index + 1}>
        <div className="h-full bg-primary transition-all" style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} />
      </div>

      {/* legend는 fieldset 패딩을 무시하고 위 테두리에 붙으므로 패딩은 바깥 div에 준다 */}
      <div className="p-6">
      <fieldset key={q.key} className="space-y-6">
        {/* legend는 fieldset의 첫 자식이어야 스크린리더가 질문으로 읽는다 */}
        <legend className="text-2xl font-bold">{q.title}</legend>
        {q.help && <p className="-mt-4 text-sm text-muted-foreground">{q.help}</p>}

        <div className="space-y-2">
          {q.type === "single" &&
            q.options.map((o) => (
              <Option key={String(o.value)} name={q.key} checked={value === o.value} onChange={() => setValue(o.value)}>
                {o.label}
              </Option>
            ))}
          {q.type === "multi" &&
            q.options.map((o) => {
              const list = (value as string[]) ?? [];
              const checked = list.includes(o.value as string);
              return (
                <Option
                  key={String(o.value)}
                  type="checkbox"
                  name={q.key}
                  checked={checked}
                  onChange={() => setValue(checked ? list.filter((v) => v !== o.value) : [...list, o.value])}
                >
                  {o.label}
                </Option>
              );
            })}
          {q.type === "date" && (
            <Input
              type="date"
              aria-label={q.title}
              value={(value as string) ?? ""}
              onChange={(e) => setValue(e.target.value)}
              className="h-12 rounded-xl px-4 text-base md:text-base"
            />
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex(index - 1)} className="h-12 flex-1 rounded-xl text-base">
            이전
          </Button>
          <Button disabled={!answered || busy} onClick={next} className="h-12 flex-1 rounded-xl text-base">
            {last ? "결과 보기" : "다음"}
          </Button>
        </div>
      </fieldset>
      </div>
    </div>
  );
}
