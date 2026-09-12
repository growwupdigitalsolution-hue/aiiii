import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatMonth(monthStr) {
    const [year, month] = monthStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString(undefined, { month: "short" });
}

export default function RevenueTrendChart({ data }) {
    if (!Array.isArray(data) || data.length === 0 || data.every((d) => Number(d?.total || 0) === 0)) {
        return <div className="empty-state">No revenue recorded yet.</div>;
    }

    const chartData = data.map((d) => ({ ...d, label: formatMonth(d.month) }));

    return (
        <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(v) => [`₹${Number(v || 0).toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
