import { ArrowUp, ArrowDown } from "lucide-react";
import "./statcard.css";

export default function StatCard({ icon: Icon, iconBg, value, label, changePct }) {
    const hasChange = changePct !== undefined && changePct !== null;
    const isPositive = hasChange && changePct >= 0;

    return (
        <div className="stat-card card">
            <div className="stat-card__top">
                <div className="stat-card__icon" style={{ background: iconBg }}>
                    <Icon size={16} color="white" />
                </div>
                {hasChange && (
                    <span className={`stat-card__change ${isPositive ? "stat-card__change--up" : "stat-card__change--down"}`}>
                        {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {Math.abs(changePct)}%
                    </span>
                )}
            </div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__label">{label}</div>
        </div>
    );
}
