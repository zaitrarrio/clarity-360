import { useEffect, useState } from "react";

/** Summary ⇄ Detailed preference, shared across the plan-building flows. */
export function useDetailMode() {
  const [detailed, setDetailed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("clarity-detail-mode") === "true";
  });
  useEffect(() => {
    localStorage.setItem("clarity-detail-mode", String(detailed));
  }, [detailed]);
  return [detailed, setDetailed] as const;
}
