import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
    new: "#2563eb",
    open: "#f97316",
    inProgress: "#7c3aed",
    closed: "#16a34a",
};

const LABELS = {
    new: "New",
    open: "Open",
    inProgress: "In Progress",
    closed: "Closed",
};

export default function TicketStatusChart({ data }) {
    const chartData = Object.entries(data || {})
        .filter(([key]) => key in LABELS)
        .map(([key, value]) => ({ key, name: LABELS[key], value }));

    const total = chartData.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) {
        return <div className="empty-state">No ticket data yet.</div>;
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={2}
                        >
                            {chartData.map((entry) => (
                                <Cell key={entry.key} fill={COLORS[entry.key]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
                {chartData.map((entry) => (
                    <div key={entry.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS[entry.key] }} />
                            {entry.name}
                        </span>
                        <span style={{ fontWeight: 600 }}>{entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
