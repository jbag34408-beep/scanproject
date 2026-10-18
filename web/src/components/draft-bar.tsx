import { Button } from "@/components/ui/button";
import { draftLabel, type DraftState } from "@/lib/draft";

// 자동 저장 상태 + 저장본 지우기
export function DraftBar<T>({ draft, empty }: { draft: DraftState<T>; empty: T }) {
  async function clear() {
    if (!window.confirm("저장된 작성 내용을 지우고 처음부터 쓸까요?")) return;
    await draft.clear(empty).catch(() => window.alert("지우지 못했어요. 다시 시도해 주세요."));
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-xs">
      <p role="status" className={draft.status === "error" ? "flex-1 text-destructive" : "flex-1 text-muted-foreground"}>
        {draftLabel(draft)}
      </p>
      {draft.savedAt && (
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          작성 내용 지우기
        </Button>
      )}
    </div>
  );
}
