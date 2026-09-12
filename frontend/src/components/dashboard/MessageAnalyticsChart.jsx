import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function formatDay(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function MessageAnalyticsChart({ data }) {
    if (!Array.isArray(data) || data.length === 0) {
        return <div className="empty-state">No message activity in the last 7 days.</div>;
    }

    const chartData = data.map((d) => ({ ...d, day: formatDay(d.date) }));

    return (
        <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="delivered" stroke="#2563eb" strokeWidth={2} dot={false} name="Delivered" />
                    <Line type="monotone" dataKey="read" stroke="#16a34a" strokeWidth={2} dot={false} name="Read" />
                    <Line type="monotone" dataKey="sent" stroke="#7c3aed" strokeWidth={2} dot={false} name="Sent" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
