import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Send, CheckCheck, Eye, XCircle, BarChart3 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import BroadcastModal from "../model/BroadcastModal";
import BroadcastStatsModal from "../model/BroadcastStatsModal";
import { getBroadcastStats, getBroadcasts } from "../api/broadcasts";
import { formatNumber, formatDate, computeStatPercentages, computeAxisTicks } from "../helper/broadcastValidation";
import "./broadcast.css";

const STAT_CARDS = [
    { key: "sent", label: "Sent", icon: Send, color: "var(--brd-sent)" },
    { key: "delivered", label: "Delivered", icon: CheckCheck, color: "var(--brd-delivered)" },
    { key: "read", label: "Read", icon: Eye, color: "var(--brd-read)" },
    { key: "failed", label: "Failed", icon: XCircle, color: "var(--brd-failed)" },
];

export default function Broadcast() {
    const [stats, setStats] = useState({ sent: 0, delivered: 0, read: 0, failed: 0 });
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [viewingBroadcast, setViewingBroadcast] = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [statsRes, listRes] = await Promise.all([getBroadcastStats(), getBroadcasts()]);
            setStats(statsRes);
            setBroadcasts(Array.isArray(listRes.broadcasts) ? listRes.broadcasts : []);
        } catch (err) {
            setError(err.response?.data?.ErrorMessage || "Unable to load broadcast data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const pct = useMemo(() => computeStatPercentages(stats), [stats]);
    const axisTicks = useMemo(() => computeAxisTicks(stats.sent), [stats.sent]);
    const chartMax = axisTicks[axisTicks.length - 1] || 1;

    const filteredBroadcasts = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return broadcasts;
        return broadcasts.filter(
            (b) => b.name?.toLowerCase().includes(q) || b.group?.toLowerCase().includes(q)
        );
    }, [broadcasts, search]);

    const handleCreated = async (created) => {
        await fetchAll();
        setToast({ type: "success", message: `"${created?.name || "Broadcast"}" created successfully` });
    };

    return (
        <AppLayout title="Broadcast">
            {error && <div className="error-banner">{error}</div>}

            <div className="brd-stat-grid">
                {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
                    <div className="brd-stat-card" key={key}>
                        <div className="brd-stat-card__top">
                            <span className="brd-stat-value" style={{ color }}>
                                {loading ? <span className="skeleton" style={{ width: 70, height: 26, display: "inline-block" }} /> : formatNumber(stats[key])}
                            </span>
                            <span className="brd-stat-icon" style={{ color, background: `color-mix(in srgb, ${color} 14%, white)` }}>
                                <Icon size={16} />
                            </span>
                        </div>
                        <p className="brd-stat-label">{label}</p>
                        <div className="brd-stat-track">
                            <div className="brd-stat-fill" style={{ width: `${pct[key] || 0}%`, background: color }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="brd-panel">
                <h2 className="brd-panel-title">Performance Overview</h2>
                <div className="brd-chart">
                    <div className="brd-chart-axis">
                        {[...axisTicks].reverse().map((tick) => (
                            <span key={tick}>{formatNumber(tick)}</span>
                        ))}
                    </div>
                    <div className="brd-chart-area">
                        {axisTicks.map((tick) => (
                            <div
                                key={tick}
                                className="brd-chart-gridline"
                                style={{ bottom: `calc(26px + (100% - 26px) * ${tick / chartMax})` }}
                            />
                        ))}
                        <div className="brd-chart-bars">
                            {STAT_CARDS.map(({ key, label, color }) => (
                                <div className="brd-chart-col" key={key}>
                                    <div className="brd-chart-bar-track">
                                        <div
                                            className="brd-chart-bar"
                                            style={{
                                                height: loading ? "0%" : `${Math.max((stats[key] / chartMax) * 100, stats[key] ? 1.5 : 0)}%`,
                                                background: color,
                                            }}
                                        />
                                    </div>
                                    <span className="brd-chart-col-label">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="brd-panel">
                <div className="brd-history-header">
                    <h2 className="brd-panel-title" style={{ margin: 0 }}>Broadcast History</h2>
                    <div className="brd-history-actions">
                        <div className="brd-search">
                            <Search size={15} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="brd-new-btn" onClick={() => setModalOpen(true)}>
                            <Plus size={16} />
                            <span>New Broadcast</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <BroadcastListSkeleton />
                ) : filteredBroadcasts.length === 0 ? (
                    <div className="empty-state">
                        {search ? "No broadcasts match your search." : "No broadcasts yet — send your first one."}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="brd-table-wrap">
                            <table className="brd-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Group</th>
                                        <th>Sent</th>
                                        <th>Delivered</th>
                                        <th>Read</th>
                                        <th>Failed</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBroadcasts.map((b) => (
                                        <tr key={b._id}>
                                            <td className="brd-table__name">{b.name}</td>
                                            <td>{b.group}</td>
                                            <td>{formatNumber(b.sent)}</td>
                                            <td style={{ color: "var(--brd-delivered)" }}>{formatNumber(b.delivered)}</td>
                                            <td style={{ color: "var(--brd-read)" }}>{formatNumber(b.read)}</td>
                                            <td style={{ color: "var(--brd-failed)" }}>{formatNumber(b.failed)}</td>
                                            <td>{formatDate(b.date || b.createdAt)}</td>
                                            <td><span className={`brd-badge brd-badge--${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                            <td>
                                                <button className="tpl-icon-btn" aria-label={`View ${b.name} stats`} onClick={() => setViewingBroadcast(b)}>
                                                    <BarChart3 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card list */}
                        <div className="brd-card-list">
                            {filteredBroadcasts.map((b) => (
                                <div className="brd-history-card" key={b._id} onClick={() => setViewingBroadcast(b)}>
                                    <div className="brd-history-card__top">
                                        <span className="brd-history-card__name">{b.name}</span>
                                        <span className={`brd-badge brd-badge--${b.status?.toLowerCase()}`}>{b.status}</span>
                                    </div>
                                    <p className="brd-history-card__group">{b.group}</p>
                                    <div className="brd-history-card__stats">
                                        <div><span className="brd-history-card__stat-value" style={{ color: "var(--brd-sent)" }}>{formatNumber(b.sent)}</span><span>Sent</span></div>
                                        <div><span className="brd-history-card__stat-value" style={{ color: "var(--brd-delivered)" }}>{formatNumber(b.delivered)}</span><span>Delivered</span></div>
                                        <div><span className="brd-history-card__stat-value" style={{ color: "var(--brd-read)" }}>{formatNumber(b.read)}</span><span>Read</span></div>
                                        <div><span className="brd-history-card__stat-value" style={{ color: "var(--brd-failed)" }}>{formatNumber(b.failed)}</span><span>Failed</span></div>
                                    </div>
                                    <p className="brd-history-card__date">{formatDate(b.date || b.createdAt)}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <button className="brd-fab" aria-label="New Broadcast" onClick={() => setModalOpen(true)}>
                <Plus size={22} />
            </button>

            <BroadcastModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={handleCreated}
            />

            <BroadcastStatsModal
                open={Boolean(viewingBroadcast)}
                broadcast={viewingBroadcast}
                onClose={() => setViewingBroadcast(null)}
            />

            {toast && (
                <div className={`tpl-toast tpl-toast--${toast.type}`} role="status">
                    {toast.message}
                </div>
            )}
        </AppLayout>
    );
}

function BroadcastListSkeleton() {
    return (
        <div className="brd-card-list" style={{ display: "flex" }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="brd-history-card">
                    <div className="skeleton" style={{ width: "40%", height: 16, marginBottom: 10 }} />
                    <div className="skeleton" style={{ width: "60%", height: 12, marginBottom: 14 }} />
                    <div className="skeleton" style={{ width: "100%", height: 34 }} />
                </div>
            ))}
        </div>
    );
}