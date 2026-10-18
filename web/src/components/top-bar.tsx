import { ChevronLeft } from "lucide-react";

// Figma "TopBar" 컴포넌트
export function TopBar({ title, progress }: { title: string; progress?: string }) {
  return (
    <header className="flex items-center gap-2 px-4 py-3">
      <button type="button" aria-label="뒤로" onClick={() => history.back()} className="-m-2 p-2">
        <ChevronLeft className="size-6" />
      </button>
      <h1 className="flex-1 font-medium">{title}</h1>
      {progress && <span className="text-xs text-muted-foreground">{progress}</span>}
    </header>
  );
}
