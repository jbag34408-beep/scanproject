import { useEffect, useState } from "react";

// shortcut: 화면 6개라 해시 라우팅으로 충분, 중첩 라우트·데이터 로더가 필요해지면 react-router로 교체
export function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash.slice(1) || "/";
}

export const go = (path: string) => {
  window.location.hash = path;
  window.scrollTo(0, 0);
};
