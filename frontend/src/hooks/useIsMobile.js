import { useEffect, useState } from "react";

export default function useIsMobile(breakpoint = 768) {
    const query = `(max-width: ${breakpoint}px)`;
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.matchMedia(query).matches : false
    );

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mql = window.matchMedia(query);
        const handler = (e) => setIsMobile(e.matches);
        mql.addEventListener("change", handler);
        setIsMobile(mql.matches);
        return () => mql.removeEventListener("change", handler);
    }, [query]);

    return isMobile;
}