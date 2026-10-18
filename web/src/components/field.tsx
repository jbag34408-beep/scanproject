import { useId, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Figma "Field" 컴포넌트: 라벨 + 48px 입력 + 도움말/오류
export function Field({ label, hint, error, ...props }: { label: string; hint?: string; error?: string } & ComponentProps<"input">) {
  const id = useId();
  const note = error ?? hint;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? id + "-note" : undefined}
        className="h-12 rounded-xl px-4 text-base md:text-base"
        {...props}
      />
      {note && (
        <p id={id + "-note"} className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {note}
        </p>
      )}
    </div>
  );
}
