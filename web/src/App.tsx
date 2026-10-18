import { useRoute } from "@/lib/router";
import { Auth } from "@/pages/auth";
import { CaseNew } from "@/pages/case-new";
import { Cases } from "@/pages/cases";
import { Checklist } from "@/pages/checklist";
import { DiagnosisQuestions } from "@/pages/diagnosis";
import { Landing } from "@/pages/landing";
import { Result } from "@/pages/result";
import { Complaint } from "@/pages/complaint";
import { LawsuitGuide } from "@/pages/lawsuit-guide";
import { Objection } from "@/pages/objection";

export default function App() {
  const route = useRoute();
  const caseRoute = route.match(/^\/cases\/(\d+)\/(diagnosis|result|checklist|objection|complaint)$/);

  if (route === "/login") return <Auth key="login" mode="login" />;
  if (route === "/signup") return <Auth key="signup" mode="signup" />;
  if (route === "/lawsuit") return <LawsuitGuide />;
  if (route === "/cases") return <Cases />;
  if (route === "/cases/new") return <CaseNew />;
  if (caseRoute?.[2] === "diagnosis") return <DiagnosisQuestions caseId={caseRoute[1]} />;
  if (caseRoute?.[2] === "result") return <Result caseId={caseRoute[1]} />;
  if (caseRoute?.[2] === "checklist") return <Checklist caseId={caseRoute[1]} />;
  if (caseRoute?.[2] === "objection") return <Objection caseId={caseRoute[1]} />;
  if (caseRoute?.[2] === "complaint") return <Complaint caseId={caseRoute[1]} />;
  return <Landing />;
}
