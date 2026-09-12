import { Ticket, IndianRupee } from "lucide-react";

function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function RecentActivityList({ items }) {
    if (!Array.isArray(items) || items.length === 0) {
        return <div className="empty-state">No recent activity yet.</div>;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{
                        width: 8, height: 8, borderRadius: 999, marginTop: 5, flexShrink: 0,
                        background: item.type === "payment" ? "#16a34a" : "#2563eb"
                    }} />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "#101828" }}>{item.message}</div>
                        <div style={{ fontSize: 11.5, color: "#98a2b3", marginTop: 2 }}>{timeAgo(item.date)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
