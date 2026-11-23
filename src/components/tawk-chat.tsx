import { useEffect } from "react";

const TAWK_SRC = "https://embed.tawk.to/6b045535a907a53ce6714597/1k84epmle";

declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

export function TawkChat() {
  useEffect(() => {
    if (document.querySelector(`script[src="${TAWK_SRC}"]`)) return;
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    const script = document.createElement("script");
    script.async = true;
    script.src = TAWK_SRC;
    script.charset = "UTF-8";
    document.body.appendChild(script);
  }, []);
  return null;
}
