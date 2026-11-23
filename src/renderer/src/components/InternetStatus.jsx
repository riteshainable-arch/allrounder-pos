import { useCallback, useEffect, useRef, useState } from "react";
import Tooltip from "@mui/material/Tooltip";

const CHECK_INTERVAL_MS = 15000;
const CHECK_TIMEOUT_MS = 5000;
// Inline SVGs: icon fonts/iconify may need the network, which is exactly when this shows "offline".
// eslint-disable-next-line react/prop-types
const WifiIcon = ({ off }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M12 18h.01" />
        <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
        <path d="M6.343 12.343a8 8 0 0 1 11.314 0" />
        <path d="M3.515 9.515c4.686 -4.687 12.284 -4.687 17 0" />
        {off && <path d="M3 3l18 18" />}
    </svg>
);

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "";

/**
 * Small header indicator: green = internet / server reachable, red = offline.
 * navigator.onLine alone is not enough (wifi connected without internet reports
 * "online"), so we also ping the API server every few seconds.
 */
export default function InternetStatus() {
    const [state, setState] = useState(() => (navigator.onLine ? "online" : "offline"));
    const timerRef = useRef(null);

    const check = useCallback(async () => {
        if (!navigator.onLine) {
            setState("offline");
            return;
        }
        if (!API_BASE_URL) {
            setState("online");
            return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
        try {
            // no-cors: any response (even 404) means the server is reachable
            await fetch(API_BASE_URL, { method: "GET", mode: "no-cors", cache: "no-store", signal: controller.signal });
            setState("online");
        } catch {
            setState("server-down");
        } finally {
            clearTimeout(timeout);
        }
    }, []);

    useEffect(() => {
        const first = setTimeout(check, 0);
        timerRef.current = setInterval(check, CHECK_INTERVAL_MS);
        const goOnline = () => check();
        const goOffline = () => setState("offline");
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            clearTimeout(first);
            clearInterval(timerRef.current);
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, [check]);

    const isOnline = state === "online";
    const label =
        state === "online"
            ? "Internet connected"
            : state === "offline"
              ? "No internet connection"
              : "Internet on, but server not reachable";

    return (
        <Tooltip title={label} placement="top">
            <div
                role="status"
                aria-label={label}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${
                    isOnline ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
                }`}
            >
                <span className="relative flex h-2.5 w-2.5">
                    {isOnline && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                    )}
                    <span
                        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                    />
                </span>
                <WifiIcon off={!isOnline} />
            </div>
        </Tooltip>
    );
}
