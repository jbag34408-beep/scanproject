import { useRoute } from "@/lib/router";
import { Auth } from "@/pages/auth";
import { CaseNew } from "@/pages/case-new";
import { DiagnosisQuestions } from "@/pages/diagnosis";
import { Landing } from "@/pages/landing";
import { Result } from "@/pages/result";

export default function App() {
  const route = useRoute();
  const caseRoute = route.match(/^\/cases\/(\d+)\/(diagnosis|result)$/);

  if (route === "/login") return <Auth key="login" mode="login" />;
  if (route === "/signup") return <Auth key="signup" mode="signup" />;
  if (route === "/cases/new") return <CaseNew />;
  if (caseRoute?.[2] === "diagnosis") return <DiagnosisQuestions caseId={caseRoute[1]} />;
  if (caseRoute?.[2] === "result") return <Result caseId={caseRoute[1]} />;
  return <Landing />;
}
