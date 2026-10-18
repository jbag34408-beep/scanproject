import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Draft = { content: string; updatedAt: string };
export type DraftState<T> = { ready: boolean; status: "idle" | "saving" | "saved" | "error"; savedAt: string | null; clear: (empty: T) => Promise<void> };

/**
 * 서류 작성 중 내용을 서버에 자동 저장한다(서버에서 암호화, 마지막 수정 후 90일 보관).
 * 처음에 저장본을 불러와 restore로 넘기고, 이후 value가 바뀌면 1.5초 뒤 저장한다.
 */
export function useDraft<T>(caseId: string, kind: "OBJECTION" | "COMPLAINT", value: T, restore: (v: T) => void): DraftState<T> {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<DraftState<T>["status"]>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const restoreRef = useRef(restore);
  const lastSaved = useRef<string | null>(null);
  const json = JSON.stringify(value);
  const path = `/cases/${caseId}/drafts/${kind}`;

  useEffect(() => {
    restoreRef.current = restore;
  });

  useEffect(() => {
    api<Draft | null>(path)
      .then((d) => {
        if (!d) return;
        lastSaved.current = d.content;
        restoreRef.current(JSON.parse(d.content) as T);
        setSavedAt(d.updatedAt);
        setStatus("saved");
      })
      .catch(() => undefined) // 못 불러오면 빈 양식으로 시작한다
      .finally(() => setReady(true));
  }, [path]);

  useEffect(() => {
    if (!ready || json === lastSaved.current) return;
    const timer = setTimeout(() => {
      setStatus("saving");
      api<Draft>(path, { method: "PUT", body: { content: json } })
        .then((d) => {
          lastSaved.current = json;
          setSavedAt(d.updatedAt);
          setStatus("saved");
        })
        .catch(() => setStatus("error"));
    }, 1500);
    return () => clearTimeout(timer);
  }, [ready, json, path]);

  // 저장본을 지우고 빈 양식으로 되돌린다. 빈 양식은 다시 저장하지 않는다
  async function clear(empty: T) {
    await api(path, { method: "DELETE" });
    lastSaved.current = JSON.stringify(empty);
    restoreRef.current(empty);
    setSavedAt(null);
    setStatus("idle");
  }

  return { ready, status, savedAt, clear };
}

export const draftLabel = <T,>(d: DraftState<T>) =>
  d.status === "saving"
    ? "저장 중…"
    : d.status === "error"
      ? "저장하지 못했어요. 연결을 확인해 주세요."
      : d.savedAt
        ? `${new Date(d.savedAt).toLocaleString("ko-KR")} 자동 저장됨`
        : "입력하면 자동으로 저장돼요";
