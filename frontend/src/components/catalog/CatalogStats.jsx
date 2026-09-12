import React from 'react';
import { Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const StatCard = ({ label, value, Icon, color }) => (
    <div className="stat-card">
        <div className={`stat-icon ${color}`}>
            <Icon size={20} strokeWidth={2.2} />
        </div>
        <div className="stat-content">
            <p className={`stat-value ${color}`}>{value}</p>
            <p className="stat-label">{label}</p>
        </div>
    </div>
);

const CatalogStats = ({ stats }) => (
    <div className="stats-grid">
        <StatCard label="Total Products" value={stats.total} Icon={Package} color="green" />
        <StatCard label="Active" value={stats.active} Icon={CheckCircle2} color="blue" />
        <StatCard label="Low Stock" value={stats.lowStock} Icon={AlertTriangle} color="orange" />
        <StatCard label="Out of Stock" value={stats.outOfStock} Icon={XCircle} color="red" />
    </div>
);

export default CatalogStats;