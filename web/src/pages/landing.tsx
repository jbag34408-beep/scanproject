import { useRef } from "react";
import { AlertBox } from "@/components/alert-box";
import { buttonVariants } from "@/components/ui/button";
import { ArrowOverlay } from "@/components/ui/arrow-cta";
import { cn } from "@/lib/utils";

const PREVIEW_STEPS = [
  ["은행에 지급정지 내용 확인", "지급정지 사유, 채권소멸 공고일, 대상 금액을 물어 적어 두세요."],
  ["이의제기 서류 준비", "언제, 얼마가, 누구 이름으로 들어왔는지 시간순으로 정리하세요."],
  ["내 계좌 은행에 이의제기 제출", "통신사기피해환급법 제7조에 따른 이의제기라고 말하면 빠릅니다."],
];

// Figma 01 Landing / Desktop, 02 Landing / Mobile (arrow-cta.tsx 레이아웃 기반)
export function Landing() {
  const ctaRef = useRef<HTMLAnchorElement | null>(null);

  return (
    <div className="relative text-foreground">
      <nav className="mx-auto flex max-w-screen-sm items-center justify-between px-6 py-4 text-sm">
        <span className="font-medium">unfreeze</span>
        {/* 로그인하지 않았으면 내 사건 화면이 로그인으로 보낸다 */}
        <a href="#/cases" className="text-muted-foreground hover:text-foreground">
          내 사건
        </a>
      </nav>

      {/* 화살표 캔버스는 뒤(-z-10)에 그려지고, 배경이 있는 제목·문단·카드가 화살표를 가린다 */}
      <main className="px-6">
        <div className="mt-10 flex flex-col sm:mt-24 sm:items-center">
          <h1 className="bg-background text-3xl font-medium whitespace-pre-line sm:text-center sm:text-5xl sm:leading-tight">
            {"모르는 돈이 들어오고\n통장이 묶였나요?"}
          </h1>
          <p className="mt-3 max-w-xl bg-background text-muted-foreground sm:text-center">
            통장묶기(핑돈) 피해, 혼자서도 이의제기를 준비할 수 있어요. 법률 판단이나 대리 제출 없이, 내가 입력한 내용으로
            절차와 서류를 정리해 드립니다.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            ref={ctaRef}
            href="#/cases/new"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 w-full rounded-xl px-6 text-base sm:w-auto",
              "max-sm:border-primary max-sm:bg-primary max-sm:text-primary-foreground"
            )}
          >
            내 상황 진단하기
          </a>
        </div>

        <section aria-label="진단 결과 미리보기" className="mx-auto mt-16 max-w-screen-sm sm:mt-24">
          <div className="rounded-[2rem] bg-muted p-1">
            <div className="space-y-4 rounded-[1.75rem] border bg-background p-5 sm:p-8">
              <p className="text-xs text-muted-foreground">진단 결과 미리보기</p>
              <AlertBox level="URGENT" title="돈을 보내도 풀리지 않습니다">
                협박 대화는 지우지 말고 캡처·녹음해 두고 경찰(112)에 신고하세요.
              </AlertBox>
              <AlertBox level="DEADLINE" title="이의제기 기한">
                채권소멸 공고일로부터 2개월 안에 이의제기해야 합니다.
              </AlertBox>
              <ol className="space-y-4">
                {PREVIEW_STEPS.map(([title, detail], i) => (
                  <Step key={title} no={i + 1} title={title} detail={detail} />
                ))}
              </ol>
            </div>
          </div>
        </section>

        <p className="mx-auto mt-12 mb-12 max-w-screen-sm text-xs text-muted-foreground sm:text-center">
          이 서비스는 일반 정보와 서류 작성 도구를 제공하며 법률 자문이 아닙니다. 문의: 금융감독원 1332 · 경찰 112 ·
          대한법률구조공단 132
        </p>
      </main>

      <ArrowOverlay targetRef={ctaRef} />
    </div>
  );
}

// Figma "StepItem" 컴포넌트
export function Step({ no, title, detail }: { no: number; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
        {no}
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}
