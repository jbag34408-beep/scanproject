import { Clock, Info, ShieldAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertLevel } from "@/lib/types";

// Figma "Alert" 컴포넌트 tone = urgent / deadline / info / warning
const TONE = {
  URGENT: { icon: TriangleAlert, box: "border-urgent/25 bg-urgent-bg", title: "text-urgent" },
  DEADLINE: { icon: Clock, box: "border-warning/25 bg-warning-bg", title: "text-warning" },
  INFO: { icon: Info, box: "border-info/25 bg-info-bg", title: "text-info" },
  WARNING: { icon: ShieldAlert, box: "border-warning/25 bg-warning-bg", title: "text-warning" },
} as const;

export function AlertBox({ level, title, children }: { level: AlertLevel; title: string; children: string }) {
  const tone = TONE[level];
  const Icon = tone.icon;
  return (
    <div role={level === "URGENT" ? "alert" : "note"} className={cn("flex gap-3 rounded-xl border p-4", tone.box)}>
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", tone.title)} />
      <div className="space-y-1 text-sm">
        <p className={cn("font-medium", tone.title)}>{title}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}
