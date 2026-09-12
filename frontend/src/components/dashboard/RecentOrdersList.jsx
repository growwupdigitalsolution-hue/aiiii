const STATUS_STYLES = {
    pending: { bg: "#fff7ed", color: "#c2410c" },
    paid: { bg: "#e8f8ee", color: "#16a34a" },
    shipped: { bg: "#eef2ff", color: "#4338ca" },
    delivered: { bg: "#e8f8ee", color: "#16a34a" },
    cancelled: { bg: "#fef2f2", color: "#b91c1c" },
};

export default function RecentOrdersList({ orders }) {
    if (!Array.isArray(orders) || orders.length === 0) {
        return <div className="empty-state">No orders yet.</div>;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {orders.map((order) => {
                const style = STATUS_STYLES[order.orderStatus] || { bg: "#f2f4f7", color: "#475467" };
                return (
                    <div key={order.orderNumber} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{order.orderNumber}</div>
                            <div style={{ fontSize: 12, color: "#667085" }}>{order.customerName}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>₹{order.totalAmount?.toLocaleString()}</div>
                            <span style={{
                                fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                                background: style.bg, color: style.color, textTransform: "capitalize"
                            }}>
                                {order.orderStatus}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
