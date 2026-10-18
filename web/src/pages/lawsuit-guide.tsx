import { useState } from "react";
import { AlertBox } from "@/components/alert-box";
import { Field } from "@/components/field";
import { TopBar } from "@/components/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { serviceFee, stampFee } from "@/lib/lawsuit";
import { cn } from "@/lib/utils";
import { Step } from "@/pages/landing";

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

// 근거: 통신사기피해환급법(2026. 10. 2. 시행) 제4조의2제2항, 제5조제1항제5호, 제8조제2항제1호의2
// TODO: 출시 전 법률 전문가 검토 (문구·절차 설명)
const LAW = [
  ["제4조의2 제2항", "통장 명의인은 피해자를 상대로 채무부존재확인 소송을 낼 수 있어요."],
  ["제5조 제1항 제5호", "이 소송이 법원에서 진행 중이면, 은행은 묶인 돈을 피해자에게 넘기는 절차(채권소멸 공고)를 시작하지 않아요."],
  ["제8조 제2항 제1호의2", "소송 중에도 피해금만큼은 계속 묶여 있어요. 피해금이 아닌 돈은 지급정지 해제 대상이 돼요."],
];

const STEPS = [
  ["은행에 먼저 확인하기", "피해구제를 신청한 사람(피해자) 이름, 피해금액, 채권소멸 공고나 환급이 이미 진행됐는지 물어보세요. 환급이 이미 끝났다면 소송이 각하(본안 판단 없이 종료)될 수 있어요."],
  ["무료 상담 받기", "대한법률구조공단(국번 없이 132)에서 무료로 법률상담을 받을 수 있어요. 내 상황에서 소송이 맞는지 먼저 확인하세요."],
  ["증거 모으기", "거래내역서, 지급정지 통지, 은행에 알린 기록, 협박 메시지, 112 신고내역, 계좌 원래 용도(급여 등) 자료를 원본 그대로 모으세요."],
  ["소장 쓰기", "이 사이트의 소장 작성 도구에서 칸을 채우면 소장 양식이 만들어져요. 제출 전 점검표로 빠진 곳을 확인하세요."],
  ["법원에 내기", "대법원 전자소송(ecfs.scourt.go.kr)으로 내거나, 피고 주소지 관할 법원 민원실에 종이로 내요. 인지액과 송달료를 함께 내요. 접수 뒤 '소제기증명원'을 받아 은행에 내고, 피해금이 아닌 돈의 지급정지 해제를 요청하세요."],
  ["소송 진행과 판결", "법원 우편을 꼭 확인하세요. 피고 주소를 모르면 법원이 주소보정을 요구하는데, 이때 사실조회 신청으로 주소를 찾을 수 있어요. 판결이 확정되면 판결정본과 확정증명원을 은행에 내고 해제를 요청해요."],
];

const TERMS = [
  ["원고 / 피고", "소송을 내는 사람(나)이 원고, 상대방(피해구제를 신청한 피해자)이 피고예요."],
  ["채무부존재확인", "'나는 그 돈을 갚거나 돌려줄 의무가 없다'는 것을 법원이 확인해 주는 것이에요."],
  ["소가", "소송으로 다투는 금액이에요. 여기서는 확인을 구하는 금액이에요."],
  ["인지액 / 송달료", "인지액은 소송 수수료, 송달료는 법원이 서류를 우편으로 보내는 비용이에요."],
  ["청구취지", "법원에 바라는 결론을 한두 문장으로 쓴 부분이에요."],
  ["청구원인", "왜 그런 결론이 맞는지 사실을 시간순으로 쓴 부분이에요."],
  ["입증방법 (갑 제1호증)", "내가 내는 증거 목록이에요. 원고 증거는 '갑', 순서대로 제1호증, 제2호증…으로 번호를 붙여요."],
  ["관할 법원", "사건을 맡는 법원이에요. 보통 피고가 사는 곳의 법원이에요."],
  ["각하", "소송 요건이 안 맞아 내용을 판단하지 않고 끝내는 것이에요."],
];

// 누구나 볼 수 있는 채무부존재확인 소송 안내 (로그인 불필요)
export function LawsuitGuide() {
  const [amount, setAmount] = useState("");
  const value = Number(amount.replace(/\D/g, "")) || 0;

  return (
    <div className="mx-auto max-w-md md:max-w-3xl">
      <TopBar title="채무부존재확인 소송 안내" />
      <div className="space-y-10 p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">통장이 안 풀릴 때, 법원에 확인을 구하는 방법</h2>
          <p className="text-muted-foreground">
            모르는 돈 때문에 통장이 묶였을 때, 법원에 "나는 이 돈을 돌려줄 의무가 없다"고 확인해 달라고 요청하는 소송이에요. 이의제기로 해결되지 않을 때 쓸 수 있는
            방법이에요.
          </p>
        </div>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">이럴 때 생각해 볼 수 있어요</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>이의제기를 했는데도 지급정지가 풀리지 않을 때</li>
            <li>피해금이 아닌 내 돈(급여, 생활비)까지 함께 묶여 있을 때</li>
            <li>묶인 돈이 피해자에게 넘어가는 절차(채권소멸 공고)가 시작되기 전에 막고 싶을 때</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">법이 정해 둔 것</h3>
          <dl className="space-y-3 rounded-xl bg-muted p-4 text-sm">
            {LAW.map(([no, text]) => (
              <div key={no}>
                <dt className="font-medium">통신사기피해환급법 {no}</dt>
                <dd>{text}</dd>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">2026. 10. 2. 시행 법률 기준이에요.</p>
          </dl>
        </section>

        <div className="space-y-2">
          <AlertBox level="WARNING" title="입금된 돈이 실제 피해금이라면">
            법원이 그 돈은 돌려줄 의무(부당이득)가 있다고 볼 수 있어요. 이 소송이 내게 맞는지, 전부를 다툴지 일부만 다툴지 132에 먼저 상담하세요.
          </AlertBox>
          <AlertBox level="WARNING" title="증명은 내가 해야 할 수 있어요">
            돈을 받을 정당한 이유나 사정을 원고(나)가 자료로 보여 줘야 한다고 본 판결이 있어요. 지면 소송비용을 낼 수 있어요.
          </AlertBox>
          <AlertBox level="URGENT" title="협박범에게 돈을 보내지 마세요">
            소송과 상관없이 협박범에게 송금하면 풀리지 않아요. 협박은 112에 신고하세요.
          </AlertBox>
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-bold">진행 순서</h3>
          <ol className="space-y-4">
            {STEPS.map(([title, detail], i) => (
              <Step key={title} no={i + 1} title={title} detail={detail} />
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">비용 미리 계산하기</h3>
          <Field label="확인을 구하는 금액 (원)" inputMode="numeric" placeholder="예: 300000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {value > 0 && (
            <dl className="space-y-2 rounded-xl bg-muted p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">인지액(종이 접수 기준)</dt><dd>{won(stampFee(value))}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">송달료(원고·피고 각 1명)</dt><dd>{won(serviceFee())}</dd></div>
              <div className="flex justify-between font-medium"><dt>합계</dt><dd>{won(stampFee(value) + serviceFee())}</dd></div>
            </dl>
          )}
          <p className="text-xs text-muted-foreground">
            예상치예요. 전자소송은 인지액이 줄어들 수 있고, 송달료 1회분 금액은 바뀔 수 있으니 법원 안내로 확인하세요. 남은 송달료는 소송이 끝나면 돌려받아요.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">어려운 말 풀이</h3>
          <dl className="divide-y rounded-xl border text-sm">
            {TERMS.map(([term, meaning]) => (
              <div key={term} className="space-y-1 p-4">
                <dt className="font-medium">{term}</dt>
                <dd className="text-muted-foreground">{meaning}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-3">
          <a href="#/cases" className={cn(buttonVariants(), "h-12 w-full rounded-xl text-base")}>
            내 사건으로 소장 쓰기
          </a>
          <p className="text-xs text-muted-foreground">
            이 안내는 일반 정보이며 법률 자문이 아니에요. 문의: 대한법률구조공단 132 · 금융감독원 1332 · 경찰 112
          </p>
        </div>
      </div>
    </div>
  );
}
