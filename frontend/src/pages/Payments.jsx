import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import {
    DollarSign, TrendingUp, Check, AlertCircle,
    Eye, EyeOff, RefreshCw
} from 'lucide-react';
import './payments.css';

/* =========================================================
   SAMPLE DATA
   ========================================================= */
const STATS = {
    todayRevenue: 42500,
    monthlyRevenue: 1120000,
    successfulTxns: 284,
    failedTxns: 12,
};

const CHART_DATA = [
    { day: 'Jul 28', value: 42000 },
    { day: 'Jul 29', value: 58000 },
    { day: 'Jul 30', value: 38000 },
    { day: 'Jul 31', value: 72000 },
    { day: 'Aug 1', value: 88000 },
    { day: 'Aug 2', value: 65000 },
    { day: 'Aug 3', value: 95000 },
];

const GATEWAYS = [
    { id: 'razorpay', name: 'Razorpay', env: 'live', enabled: true, logoKey: 'R', apiKey: 'rzp_live_1234567890abcdef', secret: '••••••••••••••••••••••••' },
    { id: 'stripe', name: 'Stripe', env: 'live', enabled: true, logoKey: 'S', apiKey: 'sk_live_1234567890abcdef', secret: '••••••••••••••••••••••••' },
    { id: 'payu', name: 'PayU', env: 'test', enabled: false, logoKey: 'P', apiKey: 'payu_test_1234', secret: '••••••••••••••' },
    { id: 'cashfree', name: 'Cashfree', env: 'test', enabled: false, logoKey: 'C', apiKey: 'cf_test_1234', secret: '••••••••••••••' },
];

const TRANSACTIONS = [
    { id: 'TXN-8901', customer: 'Rahul Sharma', amount: 5700, gateway: 'Razorpay', method: 'UPI', status: 'success', date: 'Aug 3, 2025', order: 'ORD-5512' },
    { id: 'TXN-8900', customer: 'Priya Mehta', amount: 1800, gateway: 'Stripe', method: 'Card', status: 'pending', date: 'Aug 3, 2025', order: 'ORD-5511' },
    { id: 'TXN-8899', customer: 'Vikram Singh', amount: 9500, gateway: 'Razorpay', method: 'Net Banking', status: 'success', date: 'Aug 2, 2025', order: 'ORD-5510' },
    { id: 'TXN-8898', customer: 'Ananya Roy', amount: 3200, gateway: 'PayU', method: 'UPI', status: 'success', date: 'Aug 2, 2025', order: 'ORD-5509' },
    { id: 'TXN-8897', customer: 'Kavita Patel', amount: 3500, gateway: 'Cashfree', method: 'Card', status: 'failed', date: 'Jul 30, 2025', order: 'ORD-5507' },
    { id: 'TXN-8896', customer: 'Suresh Kumar', amount: 4500, gateway: 'Razorpay', method: 'UPI', status: 'refunded', date: 'Jul 31, 2025', order: 'ORD-5508' },
];

/* =========================================================
   HELPERS
   ========================================================= */
const formatINR = (n) => `₹${n.toLocaleString('en-IN')}`;

/* =========================================================
   CHART (Pure SVG Line Chart)
   ========================================================= */
const RevenueChart = ({ data }) => {
    const W = 1000;
    const H = 260;
    const PAD_X = 40;
    const PAD_TOP = 20;
    const PAD_BOTTOM = 20;

    const maxVal = 100000;
    const minVal = 0;

    const stepX = (W - PAD_X * 2) / (data.length - 1);
    const scaleY = (val) => {
        const ratio = (val - minVal) / (maxVal - minVal);
        return H - PAD_BOTTOM - ratio * (H - PAD_TOP - PAD_BOTTOM);
    };

    const points = data.map((d, i) => ({
        x: PAD_X + i * stepX,
        y: scaleY(d.value),
        ...d,
    }));

    // Build path
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Y-axis labels
    const yLabels = [0, 25000, 50000, 75000, 100000];

    return (
        <div className="chart-wrapper">
            <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                {/* Grid lines */}
                {yLabels.map((v, i) => {
                    const y = scaleY(v);
                    return (
                        <g key={i}>
                            <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="#eef2f7" strokeWidth="1" />
                            <text x={PAD_X - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8" fontWeight="500">
                                ₹{v >= 1000 ? `${v / 1000}k` : v}
                            </text>
                        </g>
                    );
                })}

                {/* Line */}
                <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Dots */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                ))}
            </svg>

            <div className="chart-labels">
                {data.map((d, i) => (
                    <span key={i}>{d.day}</span>
                ))}
            </div>
        </div>
    );
};

/* =========================================================
   OVERVIEW TAB
   ========================================================= */
const OverviewTab = () => {
    const cards = [
        {
            label: "Today's Revenue",
            value: formatINR(STATS.todayRevenue),
            badge: '+28%',
            badgeCls: 'up-green',
            iconCls: 'green',
            Icon: DollarSign,
        },
        {
            label: 'Monthly Revenue',
            value: `₹${(STATS.monthlyRevenue / 1000000).toFixed(2)}M`,
            badge: '+18%',
            badgeCls: 'up-blue',
            iconCls: 'blue',
            Icon: TrendingUp,
        },
        {
            label: 'Successful Txns',
            value: STATS.successfulTxns,
            badge: '+12%',
            badgeCls: 'up-purple',
            iconCls: 'purple',
            Icon: Check,
        },
        {
            label: 'Failed Txns',
            value: STATS.failedTxns,
            badge: '-8%',
            badgeCls: 'down-red',
            iconCls: 'red',
            Icon: AlertCircle,
        },
    ];

    return (
        <>
            <div className="payment-stats-grid">
                {cards.map((c, i) => (
                    <div className="payment-stat-card" key={i}>
                        <div className="payment-stat-top">
                            <div className={`payment-stat-icon ${c.iconCls}`}>
                                <c.Icon size={20} strokeWidth={2.2} />
                            </div>
                            <span className={`payment-stat-badge ${c.badgeCls}`}>{c.badge}</span>
                        </div>
                        <div>
                            <p className="payment-stat-value">{c.value}</p>
                            <p className="payment-stat-label">{c.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="chart-card">
                <h3 className="chart-title">Revenue Trend (Last 7 days)</h3>
                <RevenueChart data={CHART_DATA} />
            </div>
        </>
    );
};

/* =========================================================
   GATEWAY CARD
   ========================================================= */
const GatewayCard = ({ gateway, onToggle }) => {
    const [showKey, setShowKey] = useState(false);
    const [showSecret, setShowSecret] = useState(false);

    return (
        <div className="gateway-card">
            <div className="gateway-header">
                <div className="gateway-brand">
                    <div className={`gateway-logo ${gateway.id}`}>{gateway.logoKey}</div>
                    <div className="gateway-info">
                        <h3 className="gateway-name">{gateway.name}</h3>
                        <span className={`gateway-env ${gateway.env}`}>{gateway.env}</span>
                    </div>
                </div>

                <button
                    className={`toggle ${gateway.enabled ? 'on' : ''}`}
                    onClick={() => onToggle(gateway.id)}
                    aria-label="Toggle gateway"
                >
                    <span className="toggle-knob"></span>
                </button>
            </div>

            <div className="gateway-field">
                <label className="gateway-label">API Key / Key ID</label>
                <div className="gateway-input-wrapper">
                    <input
                        type={showKey ? 'text' : 'password'}
                        defaultValue={gateway.apiKey}
                        className="gateway-input"
                    />
                    <button className="gateway-input-icon" onClick={() => setShowKey(!showKey)} type="button">
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <div className="gateway-field">
                <label className="gateway-label">Key Secret</label>
                <div className="gateway-input-wrapper">
                    <input
                        type={showSecret ? 'text' : 'password'}
                        defaultValue={gateway.secret}
                        className="gateway-input"
                    />
                    <button className="gateway-input-icon" onClick={() => setShowSecret(!showSecret)} type="button">
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <div className="gateway-actions">
                <button className="btn-outline">
                    <RefreshCw size={14} /> Test Connection
                </button>
                <button className="btn-green">
                    {gateway.enabled ? 'Update Keys' : 'Connect'}
                </button>
            </div>
        </div>
    );
};

/* =========================================================
   GATEWAYS TAB
   ========================================================= */
const GatewaysTab = () => {
    const [gateways, setGateways] = useState(GATEWAYS);

    const handleToggle = (id) => {
        setGateways(gs => gs.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
    };

    return (
        <div className="gateways-grid">
            {gateways.map(g => (
                <GatewayCard key={g.id} gateway={g} onToggle={handleToggle} />
            ))}
        </div>
    );
};

/* =========================================================
   TRANSACTIONS TAB
   ========================================================= */
const TransactionsTab = () => {
    return (
        <div className="transactions-container">
            <div className="transactions-header">
                <h2 className="transactions-title">Transaction History</h2>
            </div>

            <div className="table-scroll">
                <table className="tx-table">
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Gateway</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Order</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TRANSACTIONS.map(tx => (
                            <tr key={tx.id}>
                                <td className="tx-id">{tx.id}</td>
                                <td className="tx-customer">{tx.customer}</td>
                                <td className="tx-amount">{formatINR(tx.amount)}</td>
                                <td className="tx-gateway">{tx.gateway}</td>
                                <td className="tx-gateway">{tx.method}</td>
                                <td>
                                    <span className={`tx-status ${tx.status}`}>{tx.status}</span>
                                </td>
                                <td className="tx-gateway">{tx.date}</td>
                                <td>
                                    <a className="tx-order-link">{tx.order}</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
const Payments = () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <AppLayout title="Payments">
            <div className="payments-page">
                {/* Tabs */}
                <div className="payment-tabs">
                    <button
                        className={`payment-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`payment-tab ${activeTab === 'gateways' ? 'active' : ''}`}
                        onClick={() => setActiveTab('gateways')}
                    >
                        Gateways
                    </button>
                    <button
                        className={`payment-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('transactions')}
                    >
                        Transactions
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'gateways' && <GatewaysTab />}
                {activeTab === 'transactions' && <TransactionsTab />}
            </div>
        </AppLayout>
    );
};

export default Payments;