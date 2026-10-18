// ArrowOverlayComponent.tsx

import { useEffect, useRef, type RefObject } from "react";
import { cn } from "@/lib/utils";

/** 마우스 위치에서 target 요소로 향하는 점선 화살표를 그리는 전체 화면 캔버스 */
export const ArrowOverlay = ({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const target = targetRef.current;
    if (!canvas || !target) return;
    // 마우스를 따라가는 효과라 터치 기기에서는 그리지 않는다
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", updateCanvasSize);
    updateCanvasSize();

    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // shadcn 테마 색은 oklch()라 문자열 치환으로 투명도를 넣을 수 없어 globalAlpha로 처리한다
    const baseColor =
      getComputedStyle(document.documentElement).getPropertyValue("--color-foreground").trim() || "black";

    const drawArrow = () => {
      const { x: x0, y: y0 } = mouse;
      if (!x0 || !y0) return;

      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const a = Math.atan2(cy - y0, cx - x0);
      const x1 = cx - Math.cos(a) * (rect.width / 2 + 12);
      const y1 = cy - Math.sin(a) * (rect.height / 2 + 12);

      const midX = (x0 + x1) / 2;
      const midY = (y0 + y1) / 2;
      const offset = Math.min(200, Math.hypot(x1 - x0, y1 - y0) * 0.5);
      const t = Math.max(-1, Math.min(1, (y0 - y1) / 200));
      const controlX = midX;
      const controlY = midY + offset * t;

      const r = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
      const opacity = Math.min(0.75, (r - Math.max(rect.width, rect.height) / 2) / 750);
      if (opacity <= 0) return;

      ctx.strokeStyle = baseColor;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 1;

      // Draw curve
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(controlX, controlY, x1, y1);
      ctx.setLineDash([10, 4]);
      ctx.stroke();
      ctx.restore();

      // Draw arrowhead
      const angle = Math.atan2(y1 - controlY, x1 - controlX);
      const headLength = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 - headLength * Math.cos(angle - Math.PI / 6),
        y1 - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 - headLength * Math.cos(angle + Math.PI / 6),
        y1 - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    };

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawArrow();
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [targetRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 pointer-events-none" />;
};

export const ArrowOverlayComponent = () => {
  const targetRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className={cn("relative text-foreground")}>
      <nav className="flex max-w-screen-sm mx-auto justify-between px-8 py-4 text-sm text-muted-foreground">
        <span className="py-2 px-4">Home</span>
        <span className="py-2 px-4">About</span>
        <span className="py-2 px-4">Pricing</span>
        <span className="py-2 px-4">Get Started</span>
      </nav>

      <div className="mt-24 flex flex-col items-center">
        <h1 className="text-5xl font-medium">Something you really want</h1>
        <p className="mt-3 block text-muted-foreground text-center text-lg">
          You can&apos;t live without this product. I&apos;m sure of it.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          ref={targetRef}
          className="py-2 px-4 rounded-xl border border-border hover:border-foreground transition-colors"
        >
          Get Started
        </button>
      </div>

      <div className="mt-24 mx-auto max-w-screen-sm overflow-hidden">
        <div className="bg-accent/10 rounded-[2rem] p-[0.25rem]">
          <div className="h-96 rounded-[1.75rem] bg-muted"></div>
        </div>
      </div>

      <div className="h-24"></div>

      {/* Overlay canvas */}
      <ArrowOverlay targetRef={targetRef} />
    </div>
  );
};
