export function formatRelativeTime(dateStr) {
    if (!dateStr) return "";
    const then = new Date(dateStr).getTime();
    if (Number.isNaN(then)) return "";
    const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.round(diffHr / 24);
    return `${diffDay}d`;
}

export function formatMessageTime(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}