import { X, Send, CheckCheck, Eye, XCircle } from "lucide-react";
import { formatNumber, formatDate, computeStatPercentages } from "../helper/broadcastValidation";
import "./templateModal.css";
import "../pages/broadcast.css";

/**
 * open: boolean
 * broadcast: the broadcast row being viewed
 * onClose: () => void
 */
export default function BroadcastStatsModal({ open, broadcast, onClose }) {
    if (!open || !broadcast) return null;

    const stats = {
        sent: broadcast.sent || 0,
        delivered: broadcast.delivered || 0,
        read: broadcast.read || 0,
        failed: broadcast.failed || 0,
    };
    const pct = computeStatPercentages(stats);
    const deliveryRate = stats.sent ? ((stats.delivered / stats.sent) * 100).toFixed(1) : "0.0";
    const readRate = stats.sent ? ((stats.read / stats.sent) * 100).toFixed(1) : "0.0";

    return (
        <div className="tpm-backdrop" onClick={onClose}>
            <div
                className="tpm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="broadcast-stats-title"
                style={{ maxWidth: 440 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="tpm-drag-handle" aria-hidden="true" />

                <div className="tpm-header">
                    <h2 id="broadcast-stats-title" className="tpm-title">{broadcast.name}</h2>
                    <button className="tpm-close-btn" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="tpm-meta-row">
                    <span className="tpm-meta-chip">{broadcast.group}</span>
                    <span className={`brd-badge brd-badge--${broadcast.status?.toLowerCase()}`}>{broadcast.status}</span>
                    <span className="tpm-meta-chip">{formatDate(broadcast.date || broadcast.createdAt)}</span>
                </div>

                <div className="tpm-body">
                    <div className="brd-stats-detail-grid">
                        <StatBlock icon={Send} color="var(--brd-sent)" label="Sent" value={stats.sent} />
                        <StatBlock icon={CheckCheck} color="var(--brd-delivered)" label="Delivered" value={stats.delivered} sub={`${pct.delivered.toFixed(1)}%`} />
                        <StatBlock icon={Eye} color="var(--brd-read)" label="Read" value={stats.read} sub={`${pct.read.toFixed(1)}%`} />
                        <StatBlock icon={XCircle} color="var(--brd-failed)" label="Failed" value={stats.failed} sub={`${pct.failed.toFixed(1)}%`} />
                    </div>

                    <div className="tpm-detail-section">
                        <p className="tpm-detail-title">Rates</p>
                        <div className="tpm-detail-row">
                            <span className="tpm-detail-key">Delivery</span>
                            <span className="tpm-detail-value">{deliveryRate}% of sent messages were delivered</span>
                        </div>
                        <div className="tpm-detail-row">
                            <span className="tpm-detail-key">Read</span>
                            <span className="tpm-detail-value">{readRate}% of sent messages were read</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBlock({ icon: Icon, color, label, value, sub }) {
    return (
        <div className="brd-stats-detail-block">
            <div className="brd-stats-detail-icon" style={{ color, background: `color-mix(in srgb, ${color} 14%, white)` }}>
                <Icon size={16} />
            </div>
            <div>
                <div className="brd-stats-detail-value" style={{ color }}>{formatNumber(value)}</div>
                <div className="brd-stats-detail-label">{label}{sub ? ` · ${sub}` : ""}</div>
            </div>
        </div>
    );
}