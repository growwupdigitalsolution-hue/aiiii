import AppLayout from "../components/layout/AppLayout";
import { Construction } from "lucide-react";

export default function ComingSoon({ title }) {
    return (
        <AppLayout title={title}>
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
                <Construction size={32} color="#98a2b3" style={{ marginBottom: 12 }} />
                <h3 style={{ margin: "0 0 6px" }}>{title} is coming soon</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
                    This module is planned but not yet built. Let's do it in the next pass.
                </p>
            </div>
        </AppLayout>
    );
}
