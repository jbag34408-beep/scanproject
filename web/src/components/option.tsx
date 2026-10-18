import type { ChangeEventHandler, ReactNode } from "react";

// Figma "Option" 컴포넌트. 키보드·스크린리더 지원을 위해 네이티브 radio/checkbox를 쓴다.
export function Option({
  type = "radio",
  name,
  checked,
  onChange,
  children,
}: {
  type?: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4 transition-colors has-checked:border-primary has-checked:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input type={type} name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-primary" />
      <span>{children}</span>
    </label>
  );
}
