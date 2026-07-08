// Reusable Telegram Login Widget mount. Extracted from AdminPanel.jsx so the general
// public login (App.jsx header) and the admin panel share one implementation instead of
// drifting copies.
import { useEffect, useRef } from "react";

export default function TelegramLoginWidget({ botUsername, onAuth, size, radius }) {
  const holderRef = useRef(null);
  useEffect(() => {
    if (!holderRef.current || !botUsername) return;
    const cbName = "_v3TgOnAuth_" + Math.random().toString(36).slice(2);
    window[cbName] = (user) => onAuth(user);
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", size || "large");
    script.setAttribute("data-radius", radius != null ? String(radius) : "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", `${cbName}(user)`);
    holderRef.current.innerHTML = "";
    holderRef.current.appendChild(script);
    return () => { try { delete window[cbName]; } catch (_) {} };
  }, [botUsername, onAuth, size, radius]);
  return <div ref={holderRef} />;
}
